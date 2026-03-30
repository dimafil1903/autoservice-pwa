const Clients = {
  all: [],
  filtered: [],

  async load() {
    App.setLoading('screen-clients', true);
    try {
      this.all = await DB.getClients();
      this.filtered = [...this.all];
      this.render();
    } catch (e) {
      App.toast('Помилка завантаження', 'error');
    } finally {
      App.setLoading('screen-clients', false);
    }
  },

  render() {
    const list = document.getElementById('clients-list');
    if (!this.filtered.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><p>Клієнтів поки немає</p></div>`;
      return;
    }
    list.innerHTML = this.filtered.map(c => `
      <div class="list-item" onclick="Clients.open('${c.id}')">
        <div class="item-icon">👤</div>
        <div class="item-body">
          <div class="item-title">${c.name}</div>
          <div class="item-sub">${c.phone || '—'}</div>
        </div>
        <div>›</div>
      </div>
    `).join('');
  },

  search(q) {
    const s = q.toLowerCase();
    this.filtered = this.all.filter(c =>
      c.name.toLowerCase().includes(s) || (c.phone || '').includes(s)
    );
    this.render();
  },

  async open(id) {
    const client = this.all.find(c => c.id === id);
    if (!client) return;

    App.showScreen('screen-client-detail');
    document.getElementById('client-detail-name').textContent = client.name;
    document.getElementById('client-detail-phone').textContent = client.phone || '—';

    try {
      const cars = await DB.getCars(id);
      const carsList = document.getElementById('client-cars');
      if (!cars.length) {
        carsList.innerHTML = '<p class="empty-state" style="padding:20px 0"><small>Авто не додано</small></p>';
      } else {
        carsList.innerHTML = cars.map(car => `
          <div class="list-item" onclick="Orders.openNewForCar('${car.id}', '${client.name}')">
            <div class="item-icon">🚗</div>
            <div class="item-body">
              <div class="item-title">${car.brand} ${car.model} ${car.year || ''}</div>
              <div class="item-sub">${car.plate || ''} · ${car.vin || ''}</div>
            </div>
          </div>
        `).join('');
      }

      // Store client id for add car
      document.getElementById('btn-add-car').dataset.clientId = id;
    } catch (e) {
      App.toast('Помилка', 'error');
    }
  },

  showAddForm() {
    document.getElementById('modal-add-client').classList.add('open');
    document.getElementById('form-add-client').reset();
  },

  hideAddForm() {
    document.getElementById('modal-add-client').classList.remove('open');
  },

  async save() {
    const name  = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    if (!name) { App.toast('Введіть ім\'я', 'error'); return; }

    try {
      await DB.addClient({ name, phone });
      this.hideAddForm();
      App.toast('Клієнта додано ✓', 'success');
      this.load();
    } catch {
      App.toast('Помилка збереження', 'error');
    }
  },

  showAddCarForm(clientId) {
    document.getElementById('modal-add-car').classList.add('open');
    document.getElementById('form-add-car').reset();
    document.getElementById('car-client-id').value = clientId;
  },

  hideAddCarForm() {
    document.getElementById('modal-add-car').classList.remove('open');
  },

  async saveCar() {
    const clientId = document.getElementById('car-client-id').value;
    const brand    = document.getElementById('car-brand').value.trim();
    const model    = document.getElementById('car-model').value.trim();
    const year     = document.getElementById('car-year').value.trim();
    const plate    = document.getElementById('car-plate').value.trim();
    const vin      = document.getElementById('car-vin').value.trim();
    const color    = document.getElementById('car-color').value.trim();

    if (!brand || !model) { App.toast('Марка та модель обов\'язкові', 'error'); return; }

    try {
      await DB.addCar({ client_id: clientId, brand, model, year, plate, vin, color });
      this.hideAddCarForm();
      App.toast('Авто додано ✓', 'success');
      this.open(clientId);
    } catch {
      App.toast('Помилка збереження', 'error');
    }
  }
};
