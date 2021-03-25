var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var cors = require('cors')
var bcrypt = require('bcrypt');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const Users = require('./db/model.js').Users;
const Sessions = require('./db/model.js').Sessions;

var app = express();

var sess = {
  secret: 'SDFfs45!45$%VFgh)jkjk456KLchle',
  resave: false,
  saveUninitialized: true,
  maxAge: 24 * 60 * 60 * 1000,
  cookie: {}
}

const setCors = (req, callback) => {
  let corsOptions;
  corsOptions = {
    origin : req.header('Origin'),
    credentials : true
  }
  callback(null, corsOptions)
}

// view engine setup
app.use(express.static(path.join(__dirname, 'build')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors(setCors))


app.use(logger('dev'));
//app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(session(sess));
app.use(express.static(path.join(__dirname, 'public')));




app.use(function (req, res, next) {
  
  if (!req.session.user) {

    if ((req.path === '/registration')  || ('/' && req.method === 'GET')) {
      return next()
    }
    if (!req.headers.authorization) {
      return res.json({
        status: -2,
        result: 'need autorization'
      })
    }
    else if (req.path === '/login') {
      return next()
    }
  }
  else next()
})

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
