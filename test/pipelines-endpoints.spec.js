const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeTeamsArray } = require('./fixtures/teams.fixtures');
const { makeUserRolesArray } = require('./fixtures/user_roles.fixtures');
const { makeUsersArray } = require('./fixtures/users.fixtures');
const { makePipelinesArray } = require('./fixtures/pipelines.fixtures');

describe.only('Pipelines Endpoints', function() {
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

  describe('GET /api/pipelines', () => {
    context('Given no pipelines', () => {
      it('responds with a 200 and an empty list', () => {
        return supertest(app)
          .get('/api/pipelines')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context('Given there are pipelines in the database', () => {
      const testTeams = makeTeamsArray();
      const testUserRoles = makeUserRolesArray();
      const testUsers = makeUsersArray();
      const testPipelines = makePipelinesArray();

      beforeEach('insert pipelines', () => {
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

      it('GET /api/pipelines responds with 200 and all of the pipelines', () => {
        return supertest(app)
          .get('/api/pipelines')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testPipelines);
      });
    });
  });

  describe('GET /api/pipelines/:id', () => {
    context('Given no pipelines', () => {
      it('responds with a 404', () => {
        const id = 12345;
        return supertest(app)
          .get(`/api/pipelines/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: 'Pipeline not found' }
          });
      });
    });

    context('Given there are pipelines in the database', () => {
      const testTeams = makeTeamsArray();
      const testUserRoles = makeUserRolesArray();
      const testUsers = makeUsersArray();
      const testPipelines = makePipelinesArray();

      beforeEach('insert pipelines', () => {
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

      it('responds with a 200 and the pipeline with id', () => {
        const idToGet = 2;
        const expectedPipeline = testPipelines[idToGet - 1];

        return supertest(app)
          .get(`/api/pipelines/${idToGet}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedPipeline);
      });
    });
  });

  describe('POST /api/pipelines', () => {
    const testTeams = makeTeamsArray();
    const testUserRoles = makeUserRolesArray();
    const testUsers = makeUsersArray();

    beforeEach('insert users', () => {
      return db
        .into('teams')
        .insert(testTeams)
        .then(() => {
          return db
            .into('user_roles')
            .insert(testUserRoles)
            .then(() => {
              return db.into('users').insert(testUsers);
            });
        });
    });

    it('creates a pipelines, responding with 201 and the new pipeline', () => {
      const newPipeline = {
        title: 'Test Pipeline',
        team_id: 1
      };
      return supertest(app)
        .post('/api/pipelines')
        .send(newPipeline)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newPipeline.title);
          expect(res.body.team_id).to.eql(newPipeline.team_id);
          expect(res.body).to.have.property('id');
          expect(res.header.location).to.eql(`/api/pipelines/${res.body.id}`);
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/pipelines/${postRes.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(postRes.body)
        );
    });

    const requiredFields = ['title', 'team_id'];

    requiredFields.forEach(field => {
      const newPipeline = {
        title: 'Test Pipeline',
        team_id: 1
      };

      it('responds with 400 and an error when the required field is missing', () => {
        delete newPipeline[field];

        return supertest(app)
          .post('/api/pipelines')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(newPipeline)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          });
      });
    });
  });

  describe('DELETE /api/pipelines/:id', () => {
    context('given no pipelines', () => {
      it('responds with 404', () => {
        const id = 12345;
        return supertest(app)
          .delete(`/api/pipelines/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: 'Pipeline not found' }
          });
      });
    });

    context('Given there are pipelines in the database', () => {
      const testTeams = makeTeamsArray();
      const testUserRoles = makeUserRolesArray();
      const testUsers = makeUsersArray();
      const testPipelines = makePipelinesArray();

      beforeEach('insert pipelines', () => {
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

      it('responds with 204 and removes the pipeline', () => {
        const idToDelete = 2;
        const expectedPipelines = testPipelines.filter(
          pipeline => pipeline.id !== idToDelete
        );

        return supertest(app)
          .delete(`/api/pipelines/${idToDelete}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get('/api/pipelines')
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedPipelines)
          );
      });
    });
  });

  describe('PATCH /api/pipelines/:id', () => {
    context('given no pipelines', () => {
      it('responds with 404', () => {
        const id = 12345;
        return supertest(app)
          .patch(`/api/pipelines/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: 'Pipeline not found' }
          });
      });
    });

    context('Given there are pipelines in the database', () => {
      const testTeams = makeTeamsArray();
      const testUserRoles = makeUserRolesArray();
      const testUsers = makeUsersArray();
      const testPipelines = makePipelinesArray();

      beforeEach('insert pipelines', () => {
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

      it('responds with 204 and updates the pipeline', () => {
        const idToUpdate = 2;
        const updatePipeline = {
          title: 'PATCH test pipeline',
          team_id: 1
        };
        const expectedPipeline = {
          ...testPipelines[idToUpdate - 1],
          ...updatePipeline
        };

        return supertest(app)
          .patch(`/api/pipelines/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updatePipeline)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/pipelines/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedPipeline)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/pipelines/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title' or 'team_id'`
            }
          });
      });
    });
  });
});
