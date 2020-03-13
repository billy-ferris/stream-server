const pipelinesService = {
  getAllPipelines(knex) {
    return knex.select('*').from('pipelines');
  },
  getById(knex, id) {
    return knex
      .select('*')
      .from('pipelines')
      .where('id', id)
      .first();
  },
  insertPipeline(knex, newPipeline) {
    return knex
      .insert(newPipeline)
      .into('pipelines')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },
  deletePipeline(knex, id) {
    return knex('pipelines')
      .where({ id })
      .delete();
  },
  updatePipeline(knex, id, updatedPipeline) {
    return knex('pipelines')
      .where({ id })
      .update(updatedPipeline);
  }
};

module.exports = pipelinesService;
