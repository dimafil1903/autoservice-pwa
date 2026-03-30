# 🔧 AutoService PWA

**PWA-додаток для автосервісу** — клієнти, замовлення, фінанси, генерація Актів.

**Стек:** GitHub Pages + Google Apps Script + Google Sheets  
**Вартість:** $0 назавжди  
**Масштаб:** multi-tenant (кожен майстер — окремий Sheet/Script)

---

## 🚀 Налаштування (для адміна)

### 1. Admin Google Sheet

1. Створіть новий Google Sheet
2. Відкрийте **Розширення → Apps Script**
3. Скопіюйте вміст `gas/Setup.gs` у редактор (замінивши весь код)
4. **Функції → `doGet` → Розгорнути → Новий деплой:**
   - Тип: Веб-застосунок
   - Виконувати як: Я
   - Доступ: Усі
5. Скопіюйте URL
6. У файлі `config.js` встановіть:
   ```javascript
   ADMIN_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_ID/exec'
   ```

### 2. GitHub Pages

1. Запушіть репо (вже зроблено)
2. Settings → Pages → Deploy from branch: `main`, folder: `/ (root)`
3. Ваш PWA: `https://dimafil1903.github.io/autoservice-pwa/`

---

## 👤 Онбординг нового майстра (~10 хвилин)

1. **Видайте майстру** унікальний 4-значний PIN і посилання на шаблон Sheet
2. **Майстер:** відкриває шаблон → "Зробити копію"
3. **Майстер:** у своєму Sheet → 🔧 Автосервіс → Налаштувати → виконує кроки деплою
4. **Майстер:** копіює свій Script URL
5. **Ви:** в Admin Sheet додаєте майстра (його PIN + Script URL)
6. **Майстер:** відкриває PWA → вводить PIN → готово ✅

---

## 📁 Структура

```
autoservice-pwa/
├── index.html          # PWA SPA
├── admin.html          # Адмін-панель
├── manifest.json       # PWA маніфест
├── sw.js               # Service Worker
├── config.js           # Конфіг (ADMIN_SCRIPT_URL)
├── css/app.css         # Стилі
├── js/                 # Логіка клієнту
│   ├── app.js, db.js, auth.js
│   ├── clients.js, orders.js
│   ├── finance.js, docs.js
├── admin/              # Адмін-логіка
├── templates/          # Шаблон Акту
└── gas/                # Google Apps Script
    ├── Code.gs         # Бекенд майстра
    └── Setup.gs        # Setup + Admin Script
```

---

## 🗄️ База даних (Google Sheets)

| Аркуш | Поля |
|-------|------|
| clients | id, name, phone, created_at |
| cars | id, client_id, brand, model, year, vin, plate, color, notes |
| orders | id, car_id, date_in, date_out, problem, status, mileage, mileage_out, notes |
| order_items | id, order_id, type, name, qty, unit, price, total |
| finance | id, type, amount, category, date, order_id, comment |

---

## 📱 Встановлення на iPhone

1. Safari → відкрийте PWA URL
2. Поділитися → "Додати на початковий екран"

---

## 🔐 Авторизація

- Майстер вводить 4-значний PIN
- PWA запитує Admin Script → отримує `{status, scriptUrl}`
- `scriptUrl` зберігається в localStorage
- Блокування: змініть `status → blocked` в Admin Sheet

---

## 🧾 Акт прийому-передачі

Натисніть "🖨️ Сформувати Акт" в деталях замовлення. Відкриється готовий документ для друку з усіма юридичними реквізитами (відповідно до ЗУ № 996-XIV, Наказу Мінфіну № 88).
