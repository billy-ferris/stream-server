const express = require('express');
const logger = require('../../logger');
const PipelinesService = require('./pipelines-service');
const xss = require('xss');

const pipelinesRouter = express.Router();
const jsonParser = express.json();

pipelinesRouter
  .route('/')
  .get((req, res, next) => {
    PipelinesService.getAllPipelines(req.app.get('db'))
      .then(pipelines => {
        res.json(pipelines);
      })
      .catch(next);
  })
  .post(() => {});

pipelinesRouter
  .route('/:id')
  .all((req, res, next) => {
    const { id } = req.params;
    PipelinesService.getById(req.app.get('db'), id)
      .then(pipeline => {
        if (!pipeline) {
          logger.error(`Pipeline with id ${id} not found.`);
          return res.status(404).json({
            error: { message: `Pipeline not found` }
          });
        }
        res.pipeline = pipeline;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(res.pipeline);
  });

module.exports = pipelinesRouter;
