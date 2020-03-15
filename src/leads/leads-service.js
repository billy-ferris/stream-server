const leadsService = {
  getAllLeads(knex) {
    return knex.select('*').from('leads');
  },
  getById(knex, id) {
    return knex
      .select('*')
      .from('leads')
      .where('id', id)
      .first();
  },
  insertLead(knex, newPipeline) {
    return knex
      .insert(newPipeline)
      .into('leads')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },
  deleteLead(knex, id) {
    return knex('leads')
      .where({ id })
      .delete();
  },
  updateLead(knex, id, updatedLead) {
    return knex('leads')
      .where({ id })
      .update(updatedLead);
  }
};

module.exports = leadsService;
