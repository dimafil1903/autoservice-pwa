const Orders = {
  all: [],
  currentFilter: 'all',
  currentOrderId: null,

  STATUS_LABELS: {
    new:         '🆕 Нове',
    in_progress: '🔧 В роботі',
    done:        '✅ Виконано',
    closed:      '🔒 Закрито'
  },

  async load() {
    App.setLoading('screen-orders', true);
    try {
      this.all = await DB.getOrders();
      this.render();
    } catch (e) {
      App.toast('Помилка завантаження', 'error');
    } finally {
      App.setLoading('screen-orders', false);
    }
  },

  render() {
    const filtered = this.currentFilter === 'all'
      ? this.all
      : this.all.filter(o => o.status === this.currentFilter);

    const list = document.getElementById('orders-list');
    if (!filtered.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>Замовлень немає</p></div>`;
      return;
    }

    list.innerHTML = filtered.map(o => `
      <div class="list-item" onclick="Orders.open('${o.id}')">
        <div class="item-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span class="item-title">#${o.id.slice(-6).toUpperCase()}</span>
            <span class="badge badge-${o.status}">${this.STATUS_LABELS[o.status] || o.status}</span>
          </div>
          <div class="item-sub">${o.problem || '—'}</div>
          <div class="item-sub">${o.date_in || ''}</div>
        </div>
      </div>
    `).join('');
  },

  filter(status) {
    this.currentFilter = status;
    document.querySelectorAll('#screen-orders .tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.filter === status)
    );
    this.render();
  },

  async open(id) {
    this.currentOrderId = id;
    App.showScreen('screen-order-detail');
    document.getElementById('order-detail-body').innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    try {
      const [orders, items] = await Promise.all([DB.getOrders(), DB.getOrderItems(id)]);
      const order = orders.find(o => o.id === id);
      if (!order) return;

      this.renderDetail(order, items);
    } catch {
      App.toast('Помилка', 'error');
    }
  },

  renderDetail(order, items) {
    const total = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const worksTotal = items.filter(i => i.type === 'work').reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const partsTotal = items.filter(i => i.type === 'part').reduce((s, i) => s + parseFloat(i.total || 0), 0);

    document.getElementById('order-detail-body').innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:1.1rem;font-weight:700">#${order.id.slice(-6).toUpperCase()}</span>
          <span class="badge badge-${order.status}">${this.STATUS_LABELS[order.status]}</span>
        </div>
        <div class="form-group">
          <label>Проблема</label>
          <p>${order.problem || '—'}</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div><div class="s-label">Прийнято</div><div>${order.date_in || '—'}</div></div>
          <div><div class="s-label">Видано</div><div>${order.date_out || '—'}</div></div>
          <div><div class="s-label">Пробіг (прийом)</div><div>${order.mileage || '—'} км</div></div>
          <div><div class="s-label">Пробіг (видача)</div><div>${order.mileage_out || '—'} км</div></div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-title" style="margin:0">Роботи та запчастини</div>
          <button class="btn btn-secondary btn-sm" onclick="Orders.showAddItem('${order.id}')">+ Додати</button>
        </div>
        ${items.length ? `
          <div class="table-wrap">
            <table>
              <thead><tr><th>Назва</th><th>Од.</th><th class="col-num">К-ть</th><th class="col-num">Ціна</th><th class="col-num">Сума</th><th></th></tr></thead>
              <tbody>
              ${items.map(i => `
                <tr>
                  <td>${i.name}<br><small style="color:var(--text-muted)">${i.type === 'work' ? '🔧 робота' : '⚙️ запч.'}</small></td>
                  <td>${i.unit || 'шт'}</td>
                  <td class="col-num">${i.qty}</td>
                  <td class="col-num">${parseFloat(i.price).toFixed(0)}</td>
                  <td class="col-num">${parseFloat(i.total).toFixed(0)}</td>
                  <td><button class="btn btn-danger btn-sm" onclick="Orders.deleteItem('${i.id}','${order.id}')">✕</button></td>
                </tr>
              `).join('')}
              </tbody>
            </table>
          </div>
          <div class="total-line">
            <div>
              <div style="font-size:0.78rem;color:var(--text-muted)">Роботи: ${worksTotal.toFixed(0)} грн · Запч.: ${partsTotal.toFixed(0)} грн</div>
            </div>
            <div class="total-amount">${total.toFixed(0)} грн</div>
          </div>
        ` : '<p class="empty-state" style="padding:16px 0;font-size:0.85rem">Позицій немає</p>'}
      </div>

      <div class="card">
        <div class="section-title">Змінити статус</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${Object.entries(this.STATUS_LABELS).map(([k,v]) =>
            `<button class="btn btn-secondary btn-sm ${order.status===k?'active':''}" onclick="Orders.changeStatus('${order.id}','${k}')">${v}</button>`
          ).join('')}
        </div>
      </div>

      <button class="btn btn-primary" onclick="Docs.generateAct('${order.id}')">🖨️ Сформувати Акт</button>
    `;
  },

  async changeStatus(orderId, status) {
    try {
      await DB.updateOrder({ id: orderId, status });
      App.toast('Статус оновлено ✓', 'success');
      this.open(orderId);
      this.load();
    } catch {
      App.toast('Помилка', 'error');
    }
  },

  showAddItem(orderId) {
    document.getElementById('modal-add-item').classList.add('open');
    document.getElementById('form-add-item').reset();
    document.getElementById('item-order-id').value = orderId;
    // Auto-calc total on input
    ['item-qty','item-price'].forEach(id => {
      document.getElementById(id).oninput = () => {
        const q = parseFloat(document.getElementById('item-qty').value) || 0;
        const p = parseFloat(document.getElementById('item-price').value) || 0;
        document.getElementById('item-total').value = (q * p).toFixed(2);
      };
    });
  },

  hideAddItem() {
    document.getElementById('modal-add-item').classList.remove('open');
  },

  async saveItem() {
    const orderId = document.getElementById('item-order-id').value;
    const type  = document.getElementById('item-type').value;
    const name  = document.getElementById('item-name').value.trim();
    const qty   = document.getElementById('item-qty').value;
    const unit  = document.getElementById('item-unit').value;
    const price = document.getElementById('item-price').value;
    const total = document.getElementById('item-total').value;

    if (!name || !qty || !price) { App.toast('Заповніть всі поля', 'error'); return; }

    try {
      await DB.addOrderItem({ order_id: orderId, type, name, qty, unit, price, total });
      this.hideAddItem();
      App.toast('Позицію додано ✓', 'success');
      this.open(orderId);
    } catch {
      App.toast('Помилка', 'error');
    }
  },

  async deleteItem(itemId, orderId) {
    if (!confirm('Видалити позицію?')) return;
    try {
      await DB.deleteOrderItem(itemId);
      App.toast('Видалено ✓', 'success');
      this.open(orderId);
    } catch {
      App.toast('Помилка', 'error');
    }
  },

  showNewOrderForm() {
    document.getElementById('modal-new-order').classList.add('open');
    document.getElementById('form-new-order').reset();
    // Populate car select
    this.populateCarSelect();
  },

  async populateCarSelect() {
    const select = document.getElementById('order-car-id');
    select.innerHTML = '<option value="">Завантаження...</option>';
    try {
      const clients = await DB.getClients();
      let options = '<option value="">Оберіть авто</option>';
      for (const c of clients) {
        const cars = await DB.getCars(c.id);
        for (const car of cars) {
          options += `<option value="${car.id}">${c.name} — ${car.brand} ${car.model} ${car.plate ? '('+car.plate+')' : ''}</option>`;
        }
      }
      select.innerHTML = options;
    } catch {
      select.innerHTML = '<option value="">Помилка</option>';
    }
  },

  hideNewOrderForm() {
    document.getElementById('modal-new-order').classList.remove('open');
  },

  async saveNewOrder() {
    const carId   = document.getElementById('order-car-id').value;
    const problem = document.getElementById('order-problem').value.trim();
    const mileage = document.getElementById('order-mileage').value.trim();
    const dateIn  = document.getElementById('order-date-in').value;

    if (!carId || !problem) { App.toast('Оберіть авто та вкажіть проблему', 'error'); return; }

    try {
      const res = await DB.addOrder({ car_id: carId, problem, mileage: mileage ? parseInt(mileage) : null, date_in: dateIn || null, status: 'new' });
      this.hideNewOrderForm();
      App.toast('Замовлення створено ✓', 'success');
      await this.load();
      if (res.id) this.open(res.id);
    } catch {
      App.toast('Помилка', 'error');
    }
  },

  openNewForCar(carId, clientName) {
    Orders.showNewOrderForm();
    setTimeout(() => {
      document.getElementById('order-car-id').value = carId;
    }, 300);
  }
};
