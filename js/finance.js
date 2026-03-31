const Finance = {
  currentMonth: '',

  init() {
    const now = new Date();
    this.currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('finance-month').value = this.currentMonth;
  },

  async load(month) {
    if (month) this.currentMonth = month;
    App.setLoading('screen-finance', true);
    try {
      const data = await DB.getFinance(this.currentMonth);
      this.render(data);
    } catch {
      App.toast('Помилка завантаження', 'error');
    } finally {
      App.setLoading('screen-finance', false);
    }
  },

  render(items) {
    const income  = items.filter(i => i.type === 'income').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const expense = items.filter(i => i.type === 'expense').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const profit  = income - expense;

    document.getElementById('finance-summary').innerHTML = `
      <div class="stats-grid" style="margin-bottom:0">
        <div class="stat-card">
          <div class="stat-num" style="color:var(--success)">${income.toFixed(0)}</div>
          <div class="stat-label">Дохід, грн</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:var(--danger)">${expense.toFixed(0)}</div>
          <div class="stat-label">Витрати, грн</div>
        </div>
      </div>
      <div class="card" style="margin-top:12px;text-align:center">
        <div class="card-title">Прибуток</div>
        <div class="card-value" style="color:${profit >= 0 ? 'var(--success)' : 'var(--danger)'}">${profit.toFixed(0)} грн</div>
      </div>
    `;

    const list = document.getElementById('finance-list');
    if (!items.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="wallet"></i></div><p>Транзакцій немає</p></div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    list.innerHTML = items.map(i => `
      <div class="finance-row">
        <div class="f-type ${i.type === 'income' ? 'f-income-icon' : 'f-expense-icon'}"><i data-lucide="${i.type === 'income' ? 'trending-up' : 'trending-down'}"></i></div>
        <div class="f-body">
          <div>${i.comment || i.category || '—'}</div>
          <div class="f-cat">${i.category} · ${i.date || ''}</div>
        </div>
        <div class="f-amount ${i.type === 'income' ? 'f-income' : 'f-expense'}">
          ${i.type === 'income' ? '+' : '-'}${parseFloat(i.amount).toFixed(0)} грн
        </div>
      </div>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  showAddForm() {
    document.getElementById('modal-add-finance').classList.add('open');
    document.getElementById('form-add-finance').reset();
    document.getElementById('finance-date').value = new Date().toISOString().split('T')[0];
  },

  hideAddForm() {
    document.getElementById('modal-add-finance').classList.remove('open');
  },

  async save() {
    const type     = document.getElementById('finance-type').value;
    const amount   = parseFloat(document.getElementById('finance-amount').value);
    const category = document.getElementById('finance-category').value.trim();
    const date     = document.getElementById('finance-date').value;
    const comment  = document.getElementById('finance-comment').value.trim();

    if (!amount || isNaN(amount) || amount <= 0 || !date) { App.toast('Вкажіть правильну суму та дату', 'error'); return; }

    try {
      await DB.addFinance({ type, amount, category: category || null, date, comment: comment || null });
      this.hideAddForm();
      App.toast('Транзакцію додано', 'success');
      this.load();
    } catch {
      App.toast('Помилка збереження', 'error');
    }
  }
};
