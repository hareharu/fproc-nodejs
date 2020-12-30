var router = require('express').Router();

router.get('/', (req, res, next) => {
  var settings = req.app.locals.settings.getAll();
  var table = [];
  for (var key in settings) {
    table.push({ key, type: settings[key].type, group: settings[key].group, name: settings[key].name, description: settings[key].description, value: settings[key].value });
  }
  res.render('settings', {
    title: 'Настройки',
    settings: table,
    apikey: process.env.APIKEY != undefined,
  });
});

router.post('/', async (req, res, next) => {
  var vipnetchanged = await req.app.locals.settings.setAll(req.body);
  if (vipnetchanged) {
    await req.app.locals.watchers.restart('inbox');
    await req.app.locals.watchers.restart('outbox');
  }
  res.redirect('../../settings');
});

module.exports = router;
