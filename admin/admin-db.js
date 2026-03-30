// Admin DB — використовує той самий Supabase клієнт що і DB
// Але з service_role key (якщо є) або anon key
const AdminDB = {
  get: (table, params) => DB._get(table, params),
  post: (action, data) => {
    // Маппінг старих методів на нові
    if (action === 'generateInvite') return DB.generateInvite();
    if (action === 'getMasters') return DB.getMasters();
    if (action === 'registerMaster') return DB.addMaster(data);
    if (action === 'updateMasterStatus') return DB.updateMasterStatus(data.id, data.status);
    return Promise.reject(new Error('Unknown action: ' + action));
  }
};
