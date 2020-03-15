const express = require('express');
const logger = require('../../logger');
const PipelinesService = require('./pipelines-service');
const path = require('path');
const xss = require('xss');

const pipelinesRouter = express.Router();
const jsonParser = express.json();

const serializePipeline = pipeline => ({
  id: pipeline.id,
  title: xss(pipeline.title),
  team_id: pipeline.team_id
});

pipelinesRouter
  .route('/')
  .get((req, res, next) => {
    PipelinesService.getAllPipelines(req.app.get('db'))
      .then(pipelines => {
        res.json(pipelines.map(serializePipeline));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title, team_id } = req.body;
    const newPipeline = { title, team_id };

    for (const [key, value] of Object.entries(newPipeline))
      if (value == null) {
        logger.error(`Missing '${key}' in pipeline request body`);
        return res.status(400).json({
          error: { message: `Missing '${key}' in pipeline request body` }
        });
      }

    PipelinesService.insertPipeline(req.app.get('db'), newPipeline)
      .then(pipeline => {
        logger.info(`Pipeline with id ${pipeline.id} created`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${pipeline.id}`))
          .json(serializePipeline(pipeline));
      })
      .catch(next);
  });

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
    res.json(serializePipeline(res.pipeline));
  })
  .delete((req, res, next) => {
    const { id } = req.params;
    PipelinesService.deletePipeline(req.app.get('db'), id)
      .then(() => {
        logger.info(`Pipeline with id ${id} deleted`);
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, team_id } = req.body;
    const pipelineToUpdate = { title, team_id };

    const numberOfValues = Object.values(pipelineToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Pipeline request body must contain either 'title' or 'team_id'`
        }
      });
    }

    PipelinesService.updatePipeline(
      req.app.get('db'),
      req.params.id,
      serializePipeline(pipelineToUpdate)
    )
      .then(numRowsAffected => {
        logger.info(`Pipeline with id ${req.params.id} updated`);
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = pipelinesRouter;
