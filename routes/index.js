var router = require('express').Router();

router.get('/', (req, res, next) => {
  res.render('index', {
    title: 'Обработчик реестров',
    version: process.env.FPROC_VERSION || 'TEST',
    status: req.app.locals.watchers.status(),
    apikey: process.env.APIKEY != undefined,
  });
});

module.exports = router;
