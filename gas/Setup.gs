// ═══════════════════════════════════════════════════════
// Setup.gs — Автоматичне налаштування для нового майстра
// ═══════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔧 Автосервіс')
    .addItem('Налаштувати (перший раз)', 'setup')
    .addToUi();
}

function setup() {
  // 1. Ініціалізуємо таблиці
  initSheets();

  // 2. Показуємо інструкцію (Google не дозволяє auto-deploy без підтвердження)
  SpreadsheetApp.getUi().alert(
    '✅ Структуру таблиці створено!\n\n' +
    'Тепер задеплойте скрипт:\n\n' +
    '1. Розширення → Apps Script\n' +
    '2. Розгорнути → Нове розгортання\n' +
    '3. Тип: Веб-застосунок\n' +
    '4. Виконувати як: Я\n' +
    '5. Хто має доступ: Усі\n' +
    '6. Натисніть "Розгорнути"\n' +
    '7. Дозвольте доступ\n' +
    '8. Скопіюйте URL\n' +
    '9. Вставте URL в Налаштуваннях додатку'
  );
}

function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheets = {
    clients:     ['id', 'name', 'phone', 'created_at'],
    cars:        ['id', 'client_id', 'brand', 'model', 'year', 'vin', 'plate', 'color', 'notes'],
    orders:      ['id', 'car_id', 'date_in', 'date_out', 'problem', 'status', 'mileage', 'mileage_out', 'notes'],
    order_items: ['id', 'order_id', 'type', 'name', 'qty', 'unit', 'price', 'total'],
    finance:     ['id', 'type', 'amount', 'category', 'date', 'order_id', 'comment']
  };

  for (const [name, headers] of Object.entries(sheets)) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    // Set headers
    const range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setFontWeight('bold');
    range.setBackground('#e8eaf6');
    sheet.setFrozenRows(1);

    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
  }

  // Remove default "Sheet1" if exists
  try {
    const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Аркуш1');
    if (defaultSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }
  } catch (e) { /* ignore */ }
}

// ─── ADMIN SCRIPT (окремий деплой для адмін-панелі) ─────
// Цей файл розгортається окремо як Admin Apps Script

function doGetAdmin(e) {
  try {
    const action = e.parameter.action;
    const params = e.parameter;

    if (action === 'auth') {
      return createResponse(authPin(params.pin));
    }
    if (action === 'getMasters') {
      return createResponse(getMasters());
    }

    return createResponse({ error: 'Unknown action' });
  } catch (err) {
    return createResponse({ error: err.message });
  }
}

function doPostAdmin(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case 'addMaster':          return createResponse(addMaster(data));
      case 'updateMasterStatus': return createResponse(updateMasterStatus(data.id, data.status));
      case 'logActivity':        return createResponse(logActivity(data.pin));
      default:                   return createResponse({ error: 'Unknown action' });
    }
  } catch (err) {
    return createResponse({ error: err.message });
  }
}

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAdminSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('masters');
}

function getMasters() {
  const sheet = getAdminSheet();
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = String(row[i] || ''); });
    return obj;
  });
}

function authPin(pin) {
  const masters = getMasters();
  const master = masters.find(m => m.pin === pin);
  if (!master) return { status: 'invalid' };
  if (master.status === 'blocked') return { status: 'blocked' };
  logActivity(pin);
  return { status: 'active', scriptUrl: master.script_url };
}

function addMaster(d) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('masters');
  if (!sheet) {
    sheet = ss.insertSheet('masters');
    sheet.getRange(1, 1, 1, 7).setValues([['master_id', 'name', 'phone', 'pin', 'script_url', 'status', 'registered_at']]);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  const id = 'M' + String(Date.now()).slice(-6);
  sheet.appendRow([id, d.name, d.phone || '', d.pin, d.script_url || '', d.status || 'active', new Date().toISOString().split('T')[0]]);
  return { ok: true, id };
}

function updateMasterStatus(id, status) {
  const sheet = getAdminSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol  = headers.indexOf('master_id');
  const stsCol = headers.indexOf('status');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.getRange(i + 1, stsCol + 1).setValue(status);
      return { ok: true };
    }
  }
  return { error: 'Master not found' };
}

function logActivity(pin) {
  const sheet = getAdminSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const pinCol = headers.indexOf('pin');
  const lastCol = headers.indexOf('last_active');
  if (lastCol < 0) return { ok: false };

  for (let i = 1; i < data.length; i++) {
    if (data[i][pinCol] === pin) {
      sheet.getRange(i + 1, lastCol + 1).setValue(new Date().toISOString().split('T')[0]);
      return { ok: true };
    }
  }
  return { ok: false };
}
