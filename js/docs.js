const Docs = {
  async generateAct(orderId) {
    App.toast('Формування Акту...', '');
    try {
      const [orders, items] = await Promise.all([
        DB.getOrders(),
        DB.getOrderItems(orderId)
      ]);
      const order = orders.find(o => o.id === orderId);
      if (!order) { App.toast('Замовлення не знайдено', 'error'); return; }

      // Get car and client info
      let car = null, client = null;
      const clients = await DB.getClients();
      for (const c of clients) {
        const cars = await DB.getCars(c.id);
        const found = cars.find(car => car.id === order.car_id);
        if (found) { car = found; client = c; break; }
      }

      // Get settings
      const fopName    = localStorage.getItem('fopName') || '___________________';
      const fopIpn     = localStorage.getItem('fopIpn') || '___________________';
      const fopAddress = localStorage.getItem('fopAddress') || '___________________';
      const fopPhone   = localStorage.getItem('fopPhone') || '___________________';
      const fopCity    = localStorage.getItem('fopCity') || '___________________';

      const worksTotal = items.filter(i => i.type === 'work').reduce((s, i) => s + parseFloat(i.total || 0), 0);
      const partsTotal = items.filter(i => i.type === 'part').reduce((s, i) => s + parseFloat(i.total || 0), 0);
      const total      = worksTotal + partsTotal;

      const actNum = orderId.slice(-6).toUpperCase();
      const today  = new Date().toLocaleDateString('uk-UA');

      const html = `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<title>Акт № ${actNum}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; max-width: 800px; margin: 0 auto; }
  h2 { text-align: center; font-size: 16px; margin: 10px 0 4px; }
  .center { text-align: center; }
  .city-date { display: flex; justify-content: space-between; margin: 12px 0; }
  hr { border: 1px solid #555; margin: 10px 0; }
  .section { margin: 10px 0; }
  .section-title { font-weight: bold; font-size: 13px; margin-bottom: 6px; }
  .row { display: flex; gap: 16px; margin-bottom: 4px; }
  .row label { font-weight: bold; width: 200px; flex-shrink: 0; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { border: 1px solid #333; padding: 5px 7px; text-align: left; }
  th { background: #eee; font-weight: bold; text-align: center; }
  .col-r { text-align: right; }
  .total-table { margin-top: 8px; }
  .total-table td { border: 1px solid #333; }
  .signature-block { display: flex; justify-content: space-between; margin-top: 20px; }
  .signature-side { width: 45%; }
  .signature-line { border-bottom: 1px solid #000; margin: 20px 0 4px; }
  .note { font-size: 11px; color: #555; margin-top: 4px; }
  @media print {
    .no-print { display: none; }
    body { padding: 0; }
  }
</style>
</head>
<body>
<div class="no-print" style="text-align:center;margin-bottom:16px">
  <button onclick="window.print()" style="padding:10px 24px;font-size:14px;background:#e94560;color:white;border:none;border-radius:8px;cursor:pointer">🖨️ Друкувати</button>
</div>

<p class="center" style="margin-bottom:4px">Примірник № ___</p>
<h2>АКТ № ${actNum}</h2>
<h2>ПРИЙОМУ-ПЕРЕДАЧІ ВИКОНАНИХ РОБІТ</h2>
<p class="center">по ремонту автомобіля</p>

<div class="city-date">
  <span>м. ${fopCity}</span>
  <span>${today}</span>
</div>
<hr>

<div class="section">
  <div class="section-title">ВИКОНАВЕЦЬ:</div>
  <div class="row"><label>ФОП:</label><span>${fopName}</span></div>
  <div class="row"><label>ІПН:</label><span>${fopIpn}</span></div>
  <div class="row"><label>Адреса:</label><span>${fopAddress}</span></div>
  <div class="row"><label>Тел.:</label><span>${fopPhone}</span></div>
</div>
<hr>

<div class="section">
  <div class="section-title">ЗАМОВНИК:</div>
  <div class="row"><label>ПІБ:</label><span>${client ? client.name : '___________________'}</span></div>
  <div class="row"><label>Тел.:</label><span>${client ? (client.phone || '___________________') : '___________________'}</span></div>
</div>
<hr>

<div class="section">
  <div class="section-title">ВІДОМОСТІ ПРО АВТОМОБІЛЬ:</div>
  <div class="row"><label>Марка, модель:</label><span>${car ? car.brand + ' ' + car.model : '___________________'}</span></div>
  <div class="row"><label>Рік випуску:</label><span>${car ? (car.year || '___') : '___'}</span></div>
  <div class="row"><label>Колір кузова:</label><span>${car ? (car.color || '___________________') : '___________________'}</span></div>
  <div class="row"><label>Держ. номер:</label><span>${car ? (car.plate || '___________________') : '___________________'}</span></div>
  <div class="row"><label>VIN-код:</label><span>${car ? (car.vin || '___________________') : '___________________'}</span></div>
  <div class="row"><label>Пробіг при прийомі:</label><span>${order.mileage || '___'} км</span></div>
  <div class="row"><label>Пробіг при видачі:</label><span>${order.mileage_out || '___'} км</span></div>
  <div class="row"><label>Дата прийому:</label><span>${order.date_in || '___________________'}</span></div>
  <div class="row"><label>Дата видачі:</label><span>${order.date_out || today}</span></div>
</div>
<hr>

<div class="section">
  <div class="section-title">ПЕРЕЛІК ВИКОНАНИХ РОБІТ ТА ВИКОРИСТАНИХ МАТЕРІАЛІВ:</div>
  <table>
    <thead>
      <tr>
        <th style="width:30px">№</th>
        <th>Найменування роботи / матеріалу / запчастини</th>
        <th style="width:50px">Од.вим.</th>
        <th style="width:50px">К-ть</th>
        <th style="width:80px">Ціна, грн</th>
        <th style="width:90px">Сума, грн</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, i) => `
        <tr>
          <td class="col-r">${i + 1}</td>
          <td>${item.name}</td>
          <td class="col-r">${item.unit || 'шт'}</td>
          <td class="col-r">${item.qty}</td>
          <td class="col-r">${parseFloat(item.price).toFixed(2)}</td>
          <td class="col-r">${parseFloat(item.total).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr><td colspan="5" style="text-align:right;font-weight:bold">Вартість робіт:</td><td class="col-r">${worksTotal.toFixed(2)}</td></tr>
      <tr><td colspan="5" style="text-align:right;font-weight:bold">Вартість матеріалів:</td><td class="col-r">${partsTotal.toFixed(2)}</td></tr>
      <tr><td colspan="5" style="text-align:right;font-weight:bold;font-size:13px">РАЗОМ до сплати:</td><td class="col-r" style="font-weight:bold;font-size:13px">${total.toFixed(2)}</td></tr>
    </tfoot>
  </table>
  <p>Сума прописом: ______________________________________________________________________ грн.</p>
</div>
<hr>

<div class="section">
  <div class="section-title">ГАРАНТІЙНІ ЗОБОВ'ЯЗАННЯ:</div>
  <p>На виконані роботи: _______ місяців. На встановлені запчастини: _______ місяців.</p>
  <p class="note">Гарантія не поширюється на дефекти, що виникли внаслідок неналежної експлуатації або зовнішніх механічних пошкоджень.</p>
</div>
<hr>

<p>Роботи виконано в повному обсязі та належній якості. Замовник ознайомлений з гарантійними умовами обслуговування. Претензій до якості та обсягу виконаних робіт не має.</p>
<p class="note" style="margin-top:4px">Підпис замовника підтверджує отримання автомобіля у належному стані та згоду з переліком і вартістю виконаних робіт.</p>
<hr>

<div class="signature-block">
  <div class="signature-side">
    <div class="section-title">ВИКОНАВЕЦЬ:</div>
    <p>Майстер-приймальник:</p>
    <div class="signature-line"></div>
    <p style="font-size:11px">підпис &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ПІБ</p>
  </div>
  <div class="signature-side">
    <div class="section-title">ЗАМОВНИК:</div>
    <p>&nbsp;</p>
    <div class="signature-line"></div>
    <p style="font-size:11px">підпис &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ПІБ</p>
  </div>
</div>
<hr>
<p class="center note">Акт складено у 2 (двох) примірниках: примірник 1 — виконавцю, примірник 2 — замовнику</p>

</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      App.toast('Помилка генерації акту', 'error');
      console.error(e);
    }
  }
};
