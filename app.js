var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var cors = require('cors')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var sess = {
  secret: 'SDFfs45!45$%VFgh)jkjk456KLchle',
  resave: false,
  saveUninitialized: true,
  maxAge: 24 * 60 * 60 * 1000,
  cookie: {}
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true }))
app.use(logger('dev'));
//app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session(sess));
app.use(express.static(path.join(__dirname, 'public')));



app.use(function (req, res, next) {
  if(!req.session.user) {
    console.log("here")
    if(!req.headers.authorization)
    {
      console.log("no header")
      res.json({
        status: -2,
        result: 'need autorization'
      })
    }
    else
    {
      let auth_stuff=new Buffer.from(req.headers.authorization.split(" ")[1], 'base64')
      let loginpass=auth_stuff.toString().split(":")
      console.log(loginpass[0])
      console.log(loginpass[1])
      req.session.user=loginpass[0]
      console.log(req.session)
      if (loginpass[0] === 'admin') {
      res.status(200).send(req.session.user)
      }
      else res.status(401).json({
        status: -2,
        result: 'need autorization'
      })
      //check the user here
    }
  }
  else next()
})

app.use('/', indexRouter);
//app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
