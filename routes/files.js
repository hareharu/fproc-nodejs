var router = require('express').Router();

router.get('/in/:idout/:datefrom?/:dateto?', (req, res, next) => {
  var query = "SELECT o.name_out, o.name_old, i.id_in, i.name_in, i.name_arc, o.type, i.prot, COALESCE(i.date_in, i.date_foms) AS date_in, p.full AS protocol\
              FROM filesin i\
              LEFT JOIN protocol p ON i.prot = p.code\
              LEFT JOIN filesout o ON o.id_out = i.id_out\
              WHERE i.id_out = ?\
              ORDER BY i.date_in";
  req.app.locals.database.fproc.all(query, req.params.idout, (error, rows) => {
    if (error) return next(error);
    rows.forEach(row => {
      if (row.date_in) row.date_in = req.app.locals.functions.dateToString(new Date(row.date_in), true);
      row.down_recieved = row.id_in;
      if (row.prot) {
        row.down_protocol = row.id_in;
        if (row.type !== 'H') row.down_promed = row.id_in;
      }
    });
    res.render('filesin', {
      title: 'Полученные файлы',
      files: rows,
      name: rows[0].name_out + ' (' + rows[0].name_old + ')',
      back: 'files' + (req.params.datefrom ? '/' + req.params.datefrom : '') + (req.params.dateto ? '/' + req.params.dateto : ''),
      apikey: process.env.APIKEY != undefined,
    });
  });
});

router.get('/:datefrom?/:dateto?', (req, res, next) => {
  var query = "SELECT o.id_out, i.id_in, o.soft_name, o.soft_ver, o.date_out, o.status AS statuscode, t.name AS type, s.name AS sender,\
              o.name_old, o.date_old, o.name_out, o.date_send, st.name AS status, i.name_in,\
              CASE WHEN o.status = 'SENDED' AND o.type IN ('N','G') THEN NULL ELSE st.color END AS rowcolor\
              FROM (((filesout o\
              LEFT JOIN sender s ON o.sender = s.code)\
              LEFT JOIN status st ON o.status = st.code)\
              LEFT JOIN type t ON o.type = t.code)\
              LEFT JOIN filesin i ON i.id_in = (SELECT MAX(id_in) FROM filesin WHERE id_out = o.id_out)\
              WHERE SUBSTR(o.date_out, 1, 10) BETWEEN ? AND ?\
              ORDER BY o.date_out DESC";
  if (!req.params.datefrom) req.params.datefrom = req.app.locals.functions.dateToStamp(new Date()).substring(0, 10);
  if (!req.params.dateto) req.params.dateto = req.params.datefrom;
  req.app.locals.database.fproc.all(query, [ req.params.datefrom, req.params.dateto ], (error, rows) => {
    if (error) return next(error);
    rows.forEach(row => {
      if (row.date_old) row.date_old = req.app.locals.functions.dateToString(new Date(row.date_old), true);
      if (row.date_out) row.date_out = req.app.locals.functions.dateToString(new Date(row.date_out), true);
      if (row.date_send) row.date_send = req.app.locals.functions.dateToString(new Date(row.date_send), true);
    });
    res.render('files', {
      title: 'Отправленные файлы',
      date1: req.app.locals.functions.dateToString(new Date(req.params.datefrom)),
      date2: req.app.locals.functions.dateToString(new Date(req.params.dateto)),
      dates: req.app.locals.functions.getDates(),
      files: rows,
      path: req.path,
    });
  });
});

module.exports = router;
