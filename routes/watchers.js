var router = require('express').Router();

router.post('/:action/:type?', async (req, res, next) => {
  switch (req.params.action) {
    case 'start':
      if ((!req.params.type && !process.env.STARTINBOX) || req.params.type == 'inbox') await req.app.locals.watchers.start('inbox');
      if ((!req.params.type && !process.env.STARTOUTBOX) || req.params.type == 'outbox') await req.app.locals.watchers.start('outbox');
      if ((!req.params.type && !process.env.STARTARCHIVE) || req.params.type == 'archive') await req.app.locals.watchers.start('archive');
      if ((!req.params.type && !process.env.STARTSENDERS) || req.params.type == 'senders') await req.app.locals.watchers.start('senders');
      break;
    case 'stop':
      if ((!req.params.type && !process.env.STARTINBOX) || req.params.type == 'inbox') await req.app.locals.watchers.stop('inbox');
      if ((!req.params.type && !process.env.STARTOUTBOX) || req.params.type == 'outbox') await req.app.locals.watchers.stop('outbox');
      if ((!req.params.type && !process.env.STARTARCHIVE) || req.params.type == 'archive') await req.app.locals.watchers.stop('archive');
      if ((!req.params.type && !process.env.STARTSENDERS) || req.params.type == 'senders') await req.app.locals.watchers.stop('senders');
      break;
  }
  res.redirect('../../');
});

module.exports = router;
