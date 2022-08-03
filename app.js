var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var jwt = require('express-jwt');
let formidable = require('express-formidable');
require("dotenv").config()

var authRouter = require('./routes/auth');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'private')));


app.use(['/api/v1/user/send'],formidable({
  encoding:'utf-8',
  uploadDir:path.join(__dirname,'private/encrypted/'),
  multiples: true,
  keepExtensions: true
}))
app.use(jwt({
  secret: process.env.API_SECRET,
  algorithms:['HS256'],
  requestProperty: 'auth',
  getToken: function fromHeaderOrQuerystring (req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
  }
}).unless({
  path: [
    /^\/api\/v1\/auth\/.*/,
    /^\/api\/v1\/get\/.*/,
    /^\/api\/v1\/get\_enc\/.*/
  ]
}));
app.use(function (err, req, res, next) {
  console.log("[-] Got an Error:",err.name)
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({status:'ERROR',code:401,msg:'Error Occurred!'});
  }
});
app.use('/api/v1/auth', authRouter);
app.use('/api/v1', indexRouter);
app.use('/api/v1/user', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.log(err.message);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`)
})
