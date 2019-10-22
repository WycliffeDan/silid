'use strict';
const app = require('../../app'); 

const Browser = require('zombie');
const PORT = process.env.NODE_ENV === 'production' ? 3000 : 3001; 
const models = require('../../models'); 
const request = require('supertest');

const passport = require('passport');

Browser.localhost('example.com', PORT);

// For when system resources are scarce
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('authentication', function() {

  let profile;
  beforeEach(function(done) {
    let strategy = passport._strategies['auth0'];
  
    strategy._token_response = {
      access_token: 'at-1234',
      expires_in: 3600
    };
  
    // Google response as of 2019-10-22
    
    profile = {
      'displayName': 'Some Guy',
      'id': 'google-oauth2|100000000000000000010',
      'user_id': 'google-oauth2|100000000000000000000',
      'name': {
        'familyName': 'Guy',
        'givenName': 'Some'
      },
      'emails': [
        {
          'value': 'someguy@example.com'
        }
      ],
      'picture': '/images/photo.jpg',
      'locale': 'en',
      'nickname': 'someguy'
    };
    strategy._profile = profile;

    done();
  });

  let browser;
  beforeEach(function(done) {
    browser = new Browser({ waitDuration: '30s', loadCss: false });
    browser.visit('/', function(err) {
      if (err) return done.fail(err);
      browser.assert.success();
      done();
    });
  });

  afterEach(function(done) {
    models.db.collection('sessions').deleteMany({}).then(function(res) {
      done();
    }).catch(function(err) {
      done.fail(err);
    });
  });

  it('shows the home page', function() {
    browser.assert.text('nav div', 'silid');
    browser.assert.text('div h4', 'You are not logged in! Please Login to continue.');
  });

  it('displays the login form if not logged in', function() {
    browser.assert.link('nav a', 'Login', '/login');
  });

  it('does not display the logout button if not logged in', function() {
    expect(browser.query("a[href='/logout']")).toBeNull();
  });

  describe('login process', function() {
    beforeEach(function(done) {
      browser.clickLink('Login', function(err) {
        if (err) done.fail(err);
        browser.assert.success();
        done();
      });
    });

    it('does not display the login link', function() {
      expect(browser.query("form[action='/login']")).toBeNull();
    });

    it('displays a friendly greeting', function() {
      browser.assert.text('div h1', `Welcome ${profile.nickname}`);
    });

    it('renders the navbar correctly', function() {
console.log(browser.html());
      browser.assert.link('nav a', 'Home', '/');
      browser.assert.link('nav a', 'Profile', '/user');
      browser.assert.link('nav a', 'Logout', '/logout');
    });

    it('redirects to the Profile page', function() {
      browser.assert.url({ pathname: '/user'});
    });

    describe('logout', function() {
      it('does not display the logout button if not logged in', function(done) {
        browser.clickLink('Logout', function(err) {
          if (err) {
            done.fail(err);
          }
          browser.assert.success();
          expect(browser.query("a[href='/logout']")).toBeNull();
          browser.assert.attribute('form', 'action', '/login');
          done();
        });
      });

      it('removes the session', done => {
        models.db.collection('sessions').find().toArray(function(err, sessions) {
          if (err) {
            return done.fail(err);
          }
          expect(sessions.length).toEqual(1);

          // Can't click logout because it will create a new empty session
          request(app)
            .get('/logout')
            .set('Cookie', browser.cookies)
            .set('Accept', 'application/json')
            .expect(302)
            .end(function(err, res) {
              if (err) done.fail(err);

              models.db.collection('sessions').find().toArray(function(err, sessions) {
                if (err) {
                  return done.fail(err);
                }
                expect(sessions.length).toEqual(0);
                done();
              });
          });
        });
      });
    });
  });
});
