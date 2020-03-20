process.env.TZ = 'UTC';
const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeTeamsArray } = require('./fixtures/teams.fixtures');
const { makeUserRolesArray } = require('./fixtures/user_roles.fixtures');
const { makeUsersArray } = require('./fixtures/users.fixtures');
const { makePipelinesArray } = require('./fixtures/pipelines.fixtures');
const { makeLeadsArray } = require('./fixtures/leads.fixtures');

describe('Leads Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () =>
    db.raw('TRUNCATE leads, pipelines, users, user_roles, teams')
  );

  afterEach('clean the table', () =>
    db.raw('TRUNCATE leads, pipelines, users, user_roles, teams')
  );

  describe('GET /api/leads', () => {
    context('Given no leads', () => {
      it('responds with a 200 and an empty list', () => {
        return supertest(app)
          .get('/api/leads')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context('Given there are leads in the database', () => {
      const testTeams = makeTeamsArray();
      const testUserRoles = makeUserRolesArray();
      const testUsers = makeUsersArray();
      const testPipelines = makePipelinesArray();
      const testLeads = makeLeadsArray();

      beforeEach('insert leads', () => {
        return db
          .into('teams')
          .insert(testTeams)
          .then(() => {
            return db
              .into('user_roles')
              .insert(testUserRoles)
              .then(() => {
                return db
                  .into('users')
                  .insert(testUsers)
                  .then(() => {
                    return db
                      .into('pipelines')
                      .insert(testPipelines)
                      .then(() => {
                        return db.into('leads').insert(testLeads);
                      });
                  });
              });
          });
      });

      it('GET /api/leads responds with 200 and all of the leads', () => {
        return supertest(app)
          .get('/api/leads')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testLeads);
      });
    });
  });

  describe('GET /api/leads/:id', () => {
    context('Given no leads', () => {
      it('responds with a 404', () => {
        const id = 12345;
        return supertest(app)
          .get(`/api/leads/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: 'Lead not found' }
          });
      });
    });

    context('Given there are leads in the database', () => {
      const testTeams = makeTeamsArray();
      const testUserRoles = makeUserRolesArray();
      const testUsers = makeUsersArray();
      const testPipelines = makePipelinesArray();
      const testLeads = makeLeadsArray();

      beforeEach('insert leads', () => {
        return db
          .into('teams')
          .insert(testTeams)
          .then(() => {
            return db
              .into('user_roles')
              .insert(testUserRoles)
              .then(() => {
                return db
                  .into('users')
                  .insert(testUsers)
                  .then(() => {
                    return db
                      .into('pipelines')
                      .insert(testPipelines)
                      .then(() => {
                        return db.into('leads').insert(testLeads);
                      });
                  });
              });
          });
      });

      it('responds with a 200 and the lead with id', () => {
        const idToGet = 2;
        const expectedLead = testLeads[idToGet - 1];

        return supertest(app)
          .get(`/api/leads/${idToGet}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedLead);
      });
    });
  });

  describe('POST /api/leads', () => {
    const testTeams = makeTeamsArray();
    const testUserRoles = makeUserRolesArray();
    const testUsers = makeUsersArray();
    const testPipelines = makePipelinesArray();

    beforeEach('insert users', () => {
      return db
        .into('teams')
        .insert(testTeams)
        .then(() => {
          return db
            .into('user_roles')
            .insert(testUserRoles)
            .then(() => {
              return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                  return db.into('pipelines').insert(testPipelines);
                });
            });
        });
    });

    it('creates a lead, responding with 201 and the new lead', () => {
      const newLead = {
        name: 'Jared Pinto',
        phone: '123-456-7890',
        email: 'jp@letterkenny.com',
        city: 'Albany',
        state: 'New York',
        pipeline_id: 1
      };

      return supertest(app)
        .post('/api/leads')
        .send(newLead)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newLead.name);
          expect(res.body.phone).to.eql(newLead.phone);
          expect(res.body.email).to.eql(newLead.email);
          expect(res.body.city).to.eql(newLead.city);
          expect(res.body.state).to.eql(newLead.state);
          expect(res.header.location).to.eql(`/api/leads/${res.body.id}`);
          const expectedDate = new Date().toLocaleDateString();
          const actualDate = new Date(
            res.body.date_created
          ).toLocaleDateString();
          expect(actualDate).to.eql(expectedDate);
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/leads/${postRes.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(postRes.body)
        );
    });

    const requiredFields = ['name', 'phone', 'email', 'city', 'state'];

    requiredFields.forEach(field => {
      const newLead = {
        name: 'Jared Pinto test',
        phone: '123-456-7890',
        email: 'jpp@letterkenny.com',
        city: 'Albany',
        state: 'New York'
      };

      it('responds with 400 and an error when the required field is missing', () => {
        delete newLead[field];

        return supertest(app)
          .post('/api/leads')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(newLead)
          .expect(400, {
            error: { message: `Missing '${field}' in lead request body` }
          });
      });
    });
  });

  describe('DELETE /api/leads/:id', () => {
    context('given no leads', () => {
      it('responds with 404', () => {
        const id = 12345;
        return supertest(app)
          .delete(`/api/leads/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: 'Lead not found' }
          });
      });
    });

    context('Given theere are leads in the database', () => {
      const testTeams = makeTeamsArray();
      const testUserRoles = makeUserRolesArray();
      const testUsers = makeUsersArray();
      const testPipelines = makePipelinesArray();
      const testLeads = makeLeadsArray();

      beforeEach('insert leads', () => {
        return db
          .into('teams')
          .insert(testTeams)
          .then(() => {
            return db
              .into('user_roles')
              .insert(testUserRoles)
              .then(() => {
                return db
                  .into('users')
                  .insert(testUsers)
                  .then(() => {
                    return db
                      .into('pipelines')
                      .insert(testPipelines)
                      .then(() => {
                        return db.into('leads').insert(testLeads);
                      });
                  });
              });
          });
      });

      it('responds with 204 and removes the lead', () => {
        const idToDelete = 2;
        const expectedLeads = testLeads.filter(lead => lead.id !== idToDelete);

        return supertest(app)
          .delete(`/api/leads/${idToDelete}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get('/api/leads')
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedLeads)
          );
      });
    });
  });

  describe('PATCH /api/leads/:id', () => {
    context('given no leads', () => {
      it('responds with 404', () => {
        const id = 12345;
        return supertest(app)
          .patch(`/api/leads/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: 'Lead not found' }
          });
      });
    });

    context('Given there are leads in the database', () => {
      const testTeams = makeTeamsArray();
      const testUserRoles = makeUserRolesArray();
      const testUsers = makeUsersArray();
      const testPipelines = makePipelinesArray();
      const testLeads = makeLeadsArray();

      beforeEach('insert leads', () => {
        return db
          .into('teams')
          .insert(testTeams)
          .then(() => {
            return db
              .into('user_roles')
              .insert(testUserRoles)
              .then(() => {
                return db
                  .into('users')
                  .insert(testUsers)
                  .then(() => {
                    return db
                      .into('pipelines')
                      .insert(testPipelines)
                      .then(() => {
                        return db.into('leads').insert(testLeads);
                      });
                  });
              });
          });
      });

      it('responds with 204 and updates the lead', () => {
        const idToUpdate = 2;
        const updateLead = {
          name: 'PATCH change test',
          phone: '123-456-7890',
          email: 'patch@letterkenny.com',
          city: 'Albany',
          state: 'New York',
          last_updated: new Date().toISOString()
        };
        const expectedLead = {
          ...testLeads[idToUpdate - 1],
          ...updateLead
        };

        return supertest(app)
          .patch(`/api/leads/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateLead)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/leads/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedLead)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/leads/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Lead request body must contain either 'name', 'phone', 'email', 'city' or 'state'`
            }
          });
      });
    });
  });
});
