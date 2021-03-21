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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
app.use(logger('dev'));
//app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session(sess));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  //console.log(req.sessionID)
  //console.log(req.path)
  if (!req.session.user) {

    if (req.path === '/registration') {
      let data = req.body
      console.log(data.userpass)
      let auth_stuff = new Buffer.from(data.userpass, 'base64')

      let loginpass = auth_stuff.toString().split(":")

      try {

        (async () => {
          try {
            console.log(data)
            const user = await (Users.findUserByNAme([loginpass[0]]))
            if (user !== undefined) {
              return res.json({
                status: -1,
                result: 'Пользователь с таким именем уже существует'
              })
            }
            else {
              const userId = (Users.createUser([data.fio, loginpass[0], loginpass[1]]))

              //req.session.user = userId
              return res.json({
                status: 0,
                result: 'Регисрация прошла успешно'
              })

            }
          }
          catch (err) {
            console.log(err)
            return res.json({
              status: -1,
              result: err
            })
          }
        })()
      }
      catch (err) {
        console.log(err)
        return res.json({
          status: -1,
          result: err
        })
      }

    }

    else if (!req.headers.authorization) {
      return res.json({
        status: -2,
        result: 'need autorization'
      })
    }

    else if (req.path === '/login') {
      let auth_stuff = new Buffer.from(req.headers.authorization.split(" ")[1], 'base64')
      let loginpass = auth_stuff.toString().split(":")

      try {

        (async () => {
          try {
            const user = await (Users.getHashUser([loginpass[0]]))
            const match = await bcrypt.compare(loginpass[1], user.PASSWORD);
            if (match) {
              req.session.user = loginpass[0]
              return res.status(200).send(req.session.user)
            }
            else {
              return res.status(401).json({
                status: -2,
                result: 'need autorization'
              })
            }
          }
          catch (err) {
            console.log(err)
          }
        })()
      }
      catch (err) {
        console.log(err)
      }
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
