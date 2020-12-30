var express = require('express');
var error = require('http-errors');

var app = express();

app.locals.settings = require('./settings');
app.locals.watchers = require('./watchers');
app.locals.database = require('./database');
app.locals.functions = require('./functions');

app.set('views', app.locals.settings.folder('views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(app.locals.settings.folder('public')));

if (process.env.NODE_ENV != 'production') app.use(require('morgan')('dev'));

app.use('/', require('../routes/index'));

app.use((req, res, next) => {
  if (req.method == 'POST' && process.env.APIKEY && req.body.apikey != process.env.APIKEY) next(error(401));
  next();
});

app.use('/events', require('../routes/events'));
app.use('/files', require('../routes/files'));
app.use('/senders', require('../routes/senders'));
app.use('/settings', require('../routes/settings'));
app.use('/watchers', require('../routes/watchers'));

app.use('/api', require('../routes/archive'));
app.use('/api', require('../routes/fproc'));
app.use((req, res, next) => {
  if (res.data) return res.json({ status: 'ok', data: res.data, groups: res.groups });
  next();
});

app.use((req, res, next) => {
  next(error(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') == 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

if (process.env.STARTINBOX) app.locals.watchers.start('inbox');
if (process.env.STARTOUTBOX) app.locals.watchers.start('outbox');
if (process.env.STARTARCHIVE) app.locals.watchers.start('archive');
if (process.env.STARTSENDERS) app.locals.watchers.start('senders');

module.exports = app;
