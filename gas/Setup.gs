// ═══════════════════════════════════════════════════════
// Setup.gs — Автоматичне налаштування для нового майстра
// Копіюється разом із шаблонним Sheet
// ═══════════════════════════════════════════════════════

// Адреса PWA — замінити на реальну після деплою
var PWA_URL = 'https://dimafil1903.github.io/autoservice-pwa/';

// URL Admin Apps Script (де зберігаються майстри)
// Замінити після деплою Admin Script
var ADMIN_SCRIPT_URL = '';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔧 Автосервіс')
    .addItem('▶ Налаштувати (натисни тут!)', 'setup')
    .addToUi();

  // Показуємо підказку тільки якщо скрипт ще не задеплоєний
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('deployed')) {
    SpreadsheetApp.getUi().alert(
      '👋 Вітаємо!\n\n' +
      'Натисніть меню "🔧 Автосервіс → Налаштувати"\n' +
      'щоб завершити налаштування додатку.\n\n' +
      'Це займе менше хвилини!'
    );
  }
}

function setup() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();

  try {
    // 1. Ініціалізуємо структуру таблиці
    initSheets();

    // 2. Деплоїмо Web App (якщо ще не задеплоєний)
    var scriptUrl = props.getProperty('scriptUrl');
    if (!scriptUrl) {
      scriptUrl = deployWebApp();
      props.setProperty('scriptUrl', scriptUrl);
      props.setProperty('deployed', 'true');
    }

    // 3. Реєструємо майстра в Admin Sheet (якщо є ADMIN_SCRIPT_URL)
    var inviteToken = props.getProperty('inviteToken') || '';
    if (ADMIN_SCRIPT_URL) {
      registerInAdminSheet(scriptUrl, inviteToken);
    }

    // 4. Redirect назад у PWA
    var pwaUrl = PWA_URL + '?setup=done&scriptUrl=' + encodeURIComponent(scriptUrl);

    var html = HtmlService.createHtmlOutput(
      '<style>body{font-family:sans-serif;text-align:center;padding:24px;background:#1a1a2e;color:#eee}</style>' +
      '<p style="font-size:1.5rem">✅ Готово!</p>' +
      '<p style="color:#8899aa">Повертаємося до додатку...</p>' +
      '<script>' +
        'try { window.opener.location.href = "' + pwaUrl + '"; } catch(e) {}' +
        'setTimeout(function(){ window.location.href = "' + pwaUrl + '"; }, 800);' +
        'setTimeout(function(){ window.close(); }, 1200);' +
      '<\/script>'
    ).setWidth(300).setHeight(150);

    ui.showModalDialog(html, 'Налаштування завершено');

  } catch (e) {
    // Fallback: показуємо URL вручну
    var fallbackUrl = props.getProperty('scriptUrl') || '(помилка деплою)';
    ui.alert(
      '✅ Структуру таблиці створено!\n\n' +
      (fallbackUrl !== '(помилка деплою)'
        ? 'Ваш URL:\n' + fallbackUrl + '\n\nСкопіюйте та вставте в Налаштуваннях PWA додатку.'
        : 'Помилка: ' + e.message + '\n\nЗробіть деплой вручну:\n' +
          '1. Розгорнути → Нове розгортання\n' +
          '2. Тип: Веб-застосунок\n' +
          '3. Виконувати як: Я / Доступ: Усі')
    );
  }
}

// ─── AUTO-DEPLOY ─────────────────────────────────────────

function deployWebApp() {
  // ScriptApp.getService().deploy() — доступний тільки з OAuth scope
  // Якщо не спрацьовує — падаємо у fallback (ручний деплой)
  try {
    var service = ScriptApp.getService();
    var config = ScriptApp.newDeploymentConfig()
      .setTitle('AutoService API')
      .setDescription('Master Web App')
      .asWebApp()
      .setRunAs(ScriptApp.RunAs.USER_DEPLOYING)
      .setAccess(ScriptApp.Access.ANYONE)
      .build();

    var deployment = service.deploy(config);
    return deployment.getUrl();
  } catch (e) {
    // Fallback: повертаємо URL поточного деплою якщо є
    try {
      var deployments = ScriptApp.getService().getDeployments();
      for (var i = 0; i < deployments.length; i++) {
        var d = deployments[i];
        if (d.getDeploymentConfig().getDescription() !== 'HEAD') {
          return d.getUrl();
        }
      }
    } catch (e2) {}
    throw new Error('Не вдалося задеплоїти автоматично. Зробіть деплой вручну.');
  }
}

// ─── REGISTER IN ADMIN ────────────────────────────────────

function registerInAdminSheet(scriptUrl, inviteToken) {
  try {
    var payload = JSON.stringify({
      action: 'registerMaster',
      scriptUrl: scriptUrl,
      inviteToken: inviteToken,
      registeredAt: new Date().toISOString().split('T')[0]
    });
    UrlFetchApp.fetch(ADMIN_SCRIPT_URL, {
      method: 'post',
      contentType: 'text/plain',
      payload: payload,
      muteHttpExceptions: true
    });
  } catch (e) {
    // Non-critical — registration failure doesn't block setup
    Logger.log('Admin registration failed: ' + e.message);
  }
}

// ─── INIT SHEETS ─────────────────────────────────────────

function initSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheets = {
    clients:     ['id', 'name', 'phone', 'created_at'],
    cars:        ['id', 'client_id', 'brand', 'model', 'year', 'vin', 'plate', 'color', 'notes'],
    orders:      ['id', 'car_id', 'date_in', 'date_out', 'problem', 'status', 'mileage', 'mileage_out', 'notes'],
    order_items: ['id', 'order_id', 'type', 'name', 'qty', 'unit', 'price', 'total'],
    finance:     ['id', 'type', 'amount', 'category', 'date', 'order_id', 'comment']
  };

  for (var name in sheets) {
    var headers = sheets[name];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setFontWeight('bold');
    range.setBackground('#e8eaf6');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }

  // Remove default empty sheet
  try {
    var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Аркуш1');
    if (defaultSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }
  } catch (e) {}
}
