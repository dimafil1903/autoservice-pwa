// ═══════════════════════════════════════════════════════
// Admin.gs — окремий Google Apps Script для адміна
// Деплоїться ТІЛЬКИ в адміна (не в шаблоні майстра)
// ═══════════════════════════════════════════════════════

function doGet(e) {
  try {
    var action = e.parameter.action;
    var params = e.parameter;

    switch (action) {
      case 'ping':         return resp({ ok: true });
      case 'getMasters':   return resp(getMasters());
      case 'checkInvite':  return resp(checkInvite(params.token));
      default:             return resp({ error: 'Unknown action' });
    }
  } catch (err) {
    return resp({ error: err.message });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    switch (action) {
      case 'generateInvite':   return resp(generateInvite(data));
      case 'registerMaster':   return resp(registerMaster(data));
      case 'updateStatus':     return resp(updateStatus(data.id, data.status));
      default:                 return resp({ error: 'Unknown action' });
    }
  } catch (err) {
    return resp({ error: err.message });
  }
}

function resp(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── MASTERS SHEET ───────────────────────────────────────

function getMastersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('masters');
  if (!sheet) {
    sheet = ss.insertSheet('masters');
    var headers = ['master_id', 'invite_token', 'name', 'phone', 'script_url', 'status', 'registered_at', 'last_active'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e8eaf6');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getMasters() {
  var sheet = getMastersSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = String(row[i] || ''); });
    return obj;
  });
}

// ─── INVITE TOKENS ───────────────────────────────────────

function getInvitesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('invites');
  if (!sheet) {
    sheet = ss.insertSheet('invites');
    var headers = ['token', 'status', 'created_at', 'used_at'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#fce4ec');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function generateInvite(d) {
  var token = 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  var sheet = getInvitesSheet();
  sheet.appendRow([token, 'pending', new Date().toISOString().split('T')[0], '']);

  var pwaUrl = 'https://dimafil1903.github.io/autoservice-pwa/?invite=' + token;
  return { ok: true, token: token, url: pwaUrl };
}

function checkInvite(token) {
  var sheet = getInvitesSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var tokenCol  = headers.indexOf('token');
  var statusCol = headers.indexOf('status');

  for (var i = 1; i < data.length; i++) {
    if (data[i][tokenCol] === token) {
      return { valid: true, status: data[i][statusCol] };
    }
  }
  return { valid: false };
}

function markInviteUsed(token) {
  var sheet = getInvitesSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var tokenCol  = headers.indexOf('token');
  var statusCol = headers.indexOf('status');
  var usedCol   = headers.indexOf('used_at');

  for (var i = 1; i < data.length; i++) {
    if (data[i][tokenCol] === token) {
      sheet.getRange(i + 1, statusCol + 1).setValue('used');
      sheet.getRange(i + 1, usedCol + 1).setValue(new Date().toISOString().split('T')[0]);
      return;
    }
  }
}

// ─── REGISTER MASTER ─────────────────────────────────────

function registerMaster(d) {
  var sheet = getMastersSheet();
  var masters = getMasters();

  // Check if already registered (same scriptUrl)
  var exists = masters.find(function(m) { return m.script_url === d.scriptUrl; });
  if (exists) return { ok: true, id: exists.master_id, existing: true };

  var id = 'M' + String(Date.now()).slice(-6);
  sheet.appendRow([
    id,
    d.inviteToken || '',
    d.name || '',
    d.phone || '',
    d.scriptUrl || '',
    'active',
    d.registeredAt || new Date().toISOString().split('T')[0],
    ''
  ]);

  if (d.inviteToken) markInviteUsed(d.inviteToken);

  return { ok: true, id: id };
}

// ─── UPDATE STATUS ────────────────────────────────────────

function updateStatus(id, status) {
  var sheet = getMastersSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol  = headers.indexOf('master_id');
  var stsCol = headers.indexOf('status');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.getRange(i + 1, stsCol + 1).setValue(status);
      return { ok: true };
    }
  }
  return { error: 'Master not found' };
}
