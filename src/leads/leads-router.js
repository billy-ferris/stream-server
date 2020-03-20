const express = require('express');
const logger = require('../../logger');
const LeadsService = require('./leads-service');
const path = require('path');
const xss = require('xss');

const leadsRouter = express.Router();
const jsonParser = express.json();

const serializeLead = lead => ({
  id: lead.id,
  name: xss(lead.name),
  phone: xss(lead.phone),
  email: xss(lead.email),
  city: lead.city,
  state: lead.state,
  cold_caller: lead.cold_caller,
  assigned_to: lead.assigned_to,
  date_created: lead.date_created,
  last_updated: lead.last_updated,
  pipeline_id: lead.pipeline_id
});

leadsRouter
  .route('/')
  .get((req, res, next) => {
    LeadsService.getAllLeads(req.app.get('db'))
      .then(leads => {
        res.json(leads.map(serializeLead));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name, phone, email, city, state, pipeline_id } = req.body;
    const newLead = { name, phone, email, city, state };

    for (const [key, value] of Object.entries(newLead))
      if (value == null) {
        logger.error(`Missing '${key}' in lead request body`);
        return res.status(400).json({
          error: { message: `Missing '${key}' in lead request body` }
        });
      }

    newLead.pipeline_id = pipeline_id;

    LeadsService.insertLead(req.app.get('db'), newLead)
      .then(lead => {
        logger.info(`Lead with id ${lead.id} created`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${lead.id}`))
          .json(serializeLead(lead));
      })
      .catch(next);
  });

leadsRouter
  .route('/:id')
  .all((req, res, next) => {
    const { id } = req.params;

    LeadsService.getById(req.app.get('db'), id)
      .then(lead => {
        if (!lead) {
          logger.error(`Lead with id ${id} not found.`);
          return res.status(404).json({
            error: { message: `Lead not found` }
          });
        }
        res.lead = lead;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeLead(res.lead));
  })
  .delete((req, res, next) => {
    const { id } = req.params;
    LeadsService.deleteLead(req.app.get('db'), id)
      .then(() => {
        logger.info(`Lead with id ${id} deleted`);
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const {
      name,
      phone,
      email,
      city,
      state,
      last_updated,
      pipeline_id
    } = req.body;

    const leadToUpdate = {
      name,
      phone,
      email,
      city,
      state,
      last_updated,
      pipeline_id
    };

    const numberOfValues = Object.values(leadToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Lead request body must contain either 'name', 'phone', 'email', 'city', 'state' or 'pipeline_id`
        }
      });
    }

    leadToUpdate.last_updated = new Date().toISOString();

    LeadsService.updateLead(
      req.app.get('db'),
      req.params.id,
      serializeLead(leadToUpdate)
    )
      .then(nunRowsAffected => {
        logger.info(`Lead with id ${req.params.id} updated`);
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = leadsRouter;
