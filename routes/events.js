var router = require('express').Router();

router.get('/:datefrom?/:dateto?', (req, res, next) => {
  var query = "SELECT log.id, log.stamp, log.message, log.details, log.funcname, event.name AS type, event.color AS rowcolor\
              FROM log LEFT JOIN event ON event.code = log.event\
              WHERE SUBSTR(log.stamp, 1, 10) BETWEEN ? AND ?\
              ORDER BY log.stamp DESC";
  if (!req.params.datefrom) req.params.datefrom = req.app.locals.functions.dateToStamp(new Date()).substring(0, 10);
  if (!req.params.dateto) req.params.dateto = req.params.datefrom;
  req.app.locals.database.fproc.all(query, [ req.params.datefrom, req.params.dateto ], (error, rows) => {
    if (error) return next(error);
    rows.forEach(row => {
      if (row.stamp) row.stamp = req.app.locals.functions.dateToString(new Date(row.stamp), true);
    });
    res.render('events', {
      title: 'Журнал событий',
      date1: req.app.locals.functions.dateToString(new Date(req.params.datefrom)),
      date2: req.app.locals.functions.dateToString(new Date(req.params.dateto)),
      dates: req.app.locals.functions.getDates(),
      events: rows,
    });
  });
});

module.exports = router;
