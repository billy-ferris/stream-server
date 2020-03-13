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

    describe(`GET /api/pipelines/:id`, () => {
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
  });
});
