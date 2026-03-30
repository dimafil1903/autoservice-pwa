// ═══════════════════════════════════════════════════════
// AutoService PWA — Google Apps Script Backend
// Sheets: clients, cars, orders, order_items, finance
// ═══════════════════════════════════════════════════════

function doGet(e) {
  try {
    const action = e.parameter.action;
    const params = e.parameter;
    let result;

    switch (action) {
      case 'ping':         result = { ok: true, ts: Date.now() }; break;
      case 'getClients':   result = getClients(); break;
      case 'getCars':      result = getCars(params.client_id); break;
      case 'getOrders':    result = getOrders(params); break;
      case 'getOrderItems':result = getOrderItems(params.order_id); break;
      case 'getFinance':   result = getFinance(params.month); break;
      case 'getStats':     result = getStats(); break;
      default:             result = { error: 'Unknown action: ' + action };
    }

    return createResponse(result);
  } catch (err) {
    return createResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;

    switch (action) {
      case 'addClient':      result = addClient(data); break;
      case 'updateClient':   result = updateClient(data); break;
      case 'addCar':         result = addCar(data); break;
      case 'addOrder':       result = addOrder(data); break;
      case 'updateOrder':    result = updateOrder(data); break;
      case 'addOrderItem':   result = addOrderItem(data); break;
      case 'deleteOrderItem':result = deleteOrderItem(data.id); break;
      case 'addFinance':     result = addFinance(data); break;
      default:               result = { error: 'Unknown action: ' + action };
    }

    return createResponse(result);
  } catch (err) {
    return createResponse({ error: err.message });
  }
}

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── HELPERS ────────────────────────────────────────────

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? String(row[i]) : ''; });
    return obj;
  });
}

function newId() {
  return Utilities.getUuid();
}

function now() {
  return new Date().toISOString().split('T')[0];
}

// ─── CLIENTS ────────────────────────────────────────────

function getClients() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('clients');
  if (cached) return JSON.parse(cached);

  const data = sheetToObjects(getSheet('clients'));
  cache.put('clients', JSON.stringify(data), 300);
  return data;
}

function addClient(d) {
  const sheet = getSheet('clients');
  const id = newId();
  sheet.appendRow([id, d.name, d.phone || '', now()]);
  CacheService.getScriptCache().remove('clients');
  return { ok: true, id };
}

function updateClient(d) {
  const sheet = getSheet('clients');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === d.id) {
      if (d.name  !== undefined) sheet.getRange(i + 1, headers.indexOf('name') + 1).setValue(d.name);
      if (d.phone !== undefined) sheet.getRange(i + 1, headers.indexOf('phone') + 1).setValue(d.phone);
      CacheService.getScriptCache().remove('clients');
      return { ok: true };
    }
  }
  return { error: 'Client not found' };
}

// ─── CARS ────────────────────────────────────────────────

function getCars(clientId) {
  const data = sheetToObjects(getSheet('cars'));
  if (!clientId) return data;
  return data.filter(r => r.client_id === clientId);
}

function addCar(d) {
  const sheet = getSheet('cars');
  const id = newId();
  sheet.appendRow([id, d.client_id, d.brand, d.model, d.year || '', d.vin || '', d.plate || '', d.color || '', d.notes || '']);
  return { ok: true, id };
}

// ─── ORDERS ──────────────────────────────────────────────

function getOrders(params) {
  let data = sheetToObjects(getSheet('orders'));
  if (params && params.status) data = data.filter(r => r.status === params.status);
  if (params && params.date)   data = data.filter(r => r.date_in && r.date_in.startsWith(params.date));
  return data.reverse(); // newest first
}

function addOrder(d) {
  const sheet = getSheet('orders');
  const id = newId();
  sheet.appendRow([id, d.car_id, d.date_in || now(), d.date_out || '', d.problem || '', d.status || 'new', d.mileage || '', d.mileage_out || '', d.notes || '']);
  return { ok: true, id };
}

function updateOrder(d) {
  const sheet = getSheet('orders');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === d.id) {
      const fields = ['status', 'problem', 'date_out', 'mileage_out', 'notes'];
      fields.forEach(f => {
        if (d[f] !== undefined) {
          sheet.getRange(i + 1, headers.indexOf(f) + 1).setValue(d[f]);
        }
      });
      return { ok: true };
    }
  }
  return { error: 'Order not found' };
}

// ─── ORDER ITEMS ─────────────────────────────────────────

function getOrderItems(orderId) {
  const data = sheetToObjects(getSheet('order_items'));
  if (!orderId) return data;
  return data.filter(r => r.order_id === orderId);
}

function addOrderItem(d) {
  const sheet = getSheet('order_items');
  const id = newId();
  const qty   = parseFloat(d.qty   || 1);
  const price = parseFloat(d.price || 0);
  const total = parseFloat(d.total || qty * price);
  sheet.appendRow([id, d.order_id, d.type || 'work', d.name, qty, d.unit || 'шт', price, total]);
  return { ok: true, id };
}

function deleteOrderItem(id) {
  const sheet = getSheet('order_items');
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { error: 'Item not found' };
}

// ─── FINANCE ─────────────────────────────────────────────

function getFinance(month) {
  let data = sheetToObjects(getSheet('finance'));
  if (month) data = data.filter(r => r.date && r.date.startsWith(month));
  return data.reverse();
}

function addFinance(d) {
  const sheet = getSheet('finance');
  const id = newId();
  sheet.appendRow([id, d.type, d.amount, d.category || '', d.date || now(), d.order_id || '', d.comment || '']);
  return { ok: true, id };
}

// ─── STATS ───────────────────────────────────────────────

function getStats() {
  const today = now();
  const thisMonth = today.slice(0, 7);

  const orders  = sheetToObjects(getSheet('orders'));
  const clients = sheetToObjects(getSheet('clients'));
  const finance = sheetToObjects(getSheet('finance'));

  const ordersToday  = orders.filter(o => o.date_in && o.date_in.startsWith(today)).length;
  const ordersActive = orders.filter(o => o.status === 'in_progress' || o.status === 'new').length;

  const revenueMonth = finance
    .filter(f => f.type === 'income' && f.date && f.date.startsWith(thisMonth))
    .reduce((s, f) => s + parseFloat(f.amount || 0), 0);

  return {
    ordersToday,
    ordersActive,
    revenueMonth,
    totalClients: clients.length
  };
}
