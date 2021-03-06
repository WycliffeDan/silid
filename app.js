var express = require('express');
var path = require('path');
var logger = require('morgan');
var models = require('./models');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var dotenv = require('dotenv');
var passport = require('passport');
var flash = require('connect-flash');
var userInViews = require('./lib/middleware/userInViews');
var authRouter = require('./routes/auth');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

dotenv.config();

/**
 * Passport authentication - Auth0
 */
var callbackUrl;
var Strategy;
if (process.env.NODE_ENV === 'test') {
  // Tuned for testing
  callbackUrl = 'http://localhost:3001/callback';
  Strategy = require('@passport-next/passport-mocked').Strategy;
}
else {
  callbackUrl = process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback';
  Strategy = require('passport-auth0');
}

var strategy = new Strategy(
  {
    name: 'auth0',
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: callbackUrl
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  }
);

passport.use(strategy);

// You can use this section to keep a smaller payload
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(cookieParser());

/**
 * Sessions
 */
const MongoStore = require('connect-mongo')(session);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/config/config.json')[env];

const sessionConfig = {
  secret: 'CHANGE THIS SECRET',
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  store: new MongoStore({ mongooseConnection: models }),
};
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

/**
 * Static directory
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Flash messages
 */
app.use(flash());

// Handle auth failure error messages
app.use(function (req, res, next) {
  if (req && req.query && req.query.error) {
    req.flash('error', req.query.error);
  }
  if (req && req.query && req.query.error_description) {
    req.flash('error_description', req.query.error_description);
  }
  next();
});

app.use(userInViews());
app.use('/', authRouter);
app.use('/', indexRouter);
app.use('/', usersRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers

// Development error handler
// Will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// Production error handler
// No stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

let port = process.env.NODE_ENV === 'test' ? 3001 : 3000;
app.listen(port, '0.0.0.0', () => {
  console.log('silid listening on ' + port + '!');
});

module.exports = app;
