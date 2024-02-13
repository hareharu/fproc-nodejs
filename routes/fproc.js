var router = require('express').Router();

router.get('/senders', (req, res, next) => {
  req.query = "SELECT code AS key, name AS text FROM sender ORDER BY name";  
  req.app.locals.database.fproc.all(req.query, (error, data) => {
    if (error) next(error);
    res.data = data; next();
  });
});

router.get('/types', (req, res, next) => {
  req.query = "SELECT code AS key, name AS text FROM type ORDER BY name";  
  req.app.locals.database.fproc.all(req.query, (error, data) => {
    if (error) next(error);
    res.data = data; next();
  });
});

router.get('/sended/:datefrom/:dateto/:type/:sender', (req, res, next) => {
  var params = [req.params.datefrom, req.params.dateto];
  params.push(req.params.sender == 'all' ? '%' : req.params.sender);
  params.push(req.params.type == 'all' ? '%' : req.params.type);
  req.query = "SELECT o.id_out, o.soft_name, o.soft_ver, o.date_out, t.name AS type, s.name AS sender, o.name_arc, o.name_old, o.date_old, o.name_out, o.date_send, st.name AS status, i.id_in, i.name_in, i.name_arc AS name_arc_in,\
              CASE WHEN o.status = 'SENDED' AND o.type IN ('N','G') THEN NULL ELSE st.color END AS rowcolor\
              FROM (((filesout o\
              LEFT JOIN sender s ON o.sender = s.code)\
              LEFT JOIN status st ON o.status = st.code)\
              LEFT JOIN type t ON o.type = t.code)\
              LEFT JOIN filesin i ON i.id_in = (SELECT MAX(id_in) FROM filesin WHERE id_out = o.id_out)\
              WHERE SUBSTR(o.date_out, 1, 10) BETWEEN ? AND ? AND o.sender LIKE ? AND o.type LIKE ?\
              ORDER BY o.date_out";  
  req.app.locals.database.fproc.all(req.query, params, (error, data) => {
    if (error) next(error);
    res.data = data; next();
  });
});

router.get('/sended/:id', (req, res, next) => {
  req.query = "SELECT o.id_out AS key, o.id_out, o.name_arc, o.soft_name, o.soft_ver, o.xml_ver, o.date_out, t.name AS type, s.name AS sender, o.name_old, o.date_old, o.name_out, o.date_send, st.name AS status\
              FROM ((filesout o\
              LEFT JOIN sender s ON o.sender = s.code)\
              LEFT JOIN status st ON o.status = st.code)\
              LEFT JOIN type t ON o.type = t.code\
              WHERE o.id_out = ?";  
  req.app.locals.database.fproc.all(req.query, req.params.id, (error, data) => {
    if (error) next(error);
    res.data = data; next();
  });
});

router.get('/recieved/:id', (req, res, next) => {
  req.query = "SELECT i.id_in AS key, i.id_in, i.name_in, i.name_arc, COALESCE(i.date_in, i.date_foms) as date_in, p.name AS protocol, o.type,\
              SUBSTR(REPLACE(i.name_in, SUBSTR(i.name_in, INSTR(i.name_in, '_')), SUBSTR(o.name_old, INSTR(o.name_old, '_'))), LENGTH(i.prot) + 1) AS name_pro\
              FROM filesin i\
              LEFT JOIN protocol p ON i.prot = p.code\
              LEFT JOIN filesout o ON o.id_out = i.id_out\
              WHERE i.id_out = ?\
              ORDER BY i.date_in";  
  req.app.locals.database.fproc.all(req.query, req.params.id, (error, data) => {
    if (error) next(error);
    res.data = data; next();
  });
});

router.post('/download/:type/:id', (req, res, next) => {
  switch (req.params.type) {
    case 'sended': req.query = "SELECT name_out AS name_clean, name_out AS name_real FROM filesout WHERE id_out = ? AND name_arc IS NOT NULL"; break;
    case 'recieved': req.query = "SELECT name_in AS name_clean, name_arc AS name_real, prot FROM filesin WHERE id_in = ? AND name_arc IS NOT NULL"; break;
    case 'promed':
    case 'protocol': req.query = "SELECT filesout.name_old AS name_clean, filesout.name_out AS name_old, filesin.name_in AS name_in, filesin.name_arc AS name_real, filesin.prot, filesout.type\
                                FROM filesin LEFT JOIN filesout ON filesout.id_out = filesin.id_out\
                                WHERE filesin.id_in = ? AND filesin.name_arc IS NOT NULL"; break;
    default: return res.sendStatus(500);
  }
  req.app.locals.database.fproc.get(req.query, req.params.id, (error, data) => {
    if (error) next(error);
    if (data) {
      var fs = require('fs');
      var path = require('path');
      if (req.params.type === 'recieved' && !data.prot) req.params.type = 'unknown';
      var filepath = path.join(req.app.locals.settings.folder('files'), req.params.type, data.name_real);
      if (req.params.type === 'promed') {
        if (!data.prot || data.type === 'H') res.sendStatus(404);
        if (!fs.existsSync(path.join(req.app.locals.settings.folder('files'), 'recieved', data.name_real))) return res.sendStatus(404);
        var fsys = require('../app/filesystem');
        var tempdir1 = fsys.check(req.app.locals.settings.folder('temp'), path.parse(data.name_real).name);
        var tempdir2 = path.join(tempdir1, path.parse(data.name_in).name.substring(data.prot.length));
        fsys.create(tempdir1);
        fsys.create(tempdir2);
        fsys.extract(path.join(req.app.locals.settings.folder('files'), 'recieved', data.name_real), tempdir1);
        fsys.extract(path.join(tempdir1, data.name_in.substring(data.prot.length)), tempdir2);
        var filetype = data.name_clean.substring(0, 2).toUpperCase();
        if (filetype.substring(1, 2) == 'M') filetype = filetype.substring(0, 1); 
        var xmlold = path.parse(data.name_real).name.substring(data.prot.length);
        var xmlnew = xmlold.replace(path.parse(data.name_real).name.substring(path.parse(data.name_real).name.indexOf('_') + 1), path.parse(data.name_clean).name.substring(path.parse(data.name_clean).name.indexOf('_') + 1));
        var filexmlold = xmlold + '.xml';
        var filexmlnew = xmlnew + '.xml';
        var filexmloldl = 'L' + xmlold.substring(filetype.length) + '.xml';
        var filexmlnewl = 'L' + xmlnew.substring(filetype.length) + '.xml';
        fsys.move(path.join(tempdir2, filexmlold), path.join(tempdir2, filexmlnew));
        fsys.move(path.join(tempdir2, filexmloldl), path.join(tempdir2, filexmlnewl));
        var tempxml = fsys.read(path.join(tempdir2, filexmlnew));
        tempxml = tempxml.replace(filexmlold.substring(0, filexmlold.length - 4), filexmlnew.substring(0, filexmlnew.length - 4));
        tempxml = tempxml.replace(filexmloldl.substring(0, filexmloldl.length - 4), filexmlnewl.substring(0, filexmlnewl.length - 4));
        fsys.write(path.join(tempdir2, filexmlnew), tempxml);
        var tempxmll = fsys.read(path.join(tempdir2, filexmlnewl));
        tempxmll = tempxmll.replace(filexmlold.substring(0, filexmlold.length - 4), filexmlnew.substring(0, filexmlnew.length - 4));
        tempxmll = tempxmll.replace(filexmloldl.substring(0, filexmloldl.length - 4), filexmlnewl.substring(0, filexmlnewl.length - 4));
        fsys.write(path.join(tempdir2, filexmlnewl), tempxmll);
        filepath = path.join(tempdir1, xmlnew + '.zip');
        // console.log(filepath);
        fsys.compress(tempdir2, filepath);
        fsys.clear(tempdir2);
        fsys.remove(tempdir2);
        data.name_clean = xmlnew + '.zip';
      }
      if (req.params.type === 'protocol') {
        if (!data.prot) res.sendStatus(404);
        if (!fs.existsSync(path.join(req.app.locals.settings.folder('files'), 'recieved', data.name_real))) return res.sendStatus(404);
        var fsys = require('../app/filesystem');
        var tempdir1 = fsys.check(req.app.locals.settings.folder('temp'), path.parse(data.name_real).name);
        fsys.create(tempdir1);
        fsys.extract(path.join(req.app.locals.settings.folder('files'), 'recieved', data.name_real), tempdir1);
        var xmlold = path.parse(data.name_real).name.substring(data.prot.length);
        if (data.type === 'H') xmlold = path.parse(data.name_old).name;
        filepath = path.join(tempdir1, xmlold + '.doc');
        data.name_clean = xmlold + '.doc';
      }
      if (!fs.existsSync(filepath)) return res.sendStatus(404);
      fs.readFile(filepath, 'binary', (err, file) => {
        if (err) return res.sendStatus(500);
        var stats = fs.statSync(filepath);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Description','File Transfer');
        res.setHeader('Content-Disposition', 'attachment; filename="'+data.name_clean+'"');
        res.setHeader('Content-Length', stats['size']);
        res.write(file, 'binary');
        res.end();
        if (req.params.type === 'promed' || req.params.type === 'protocol') {
          fsys.clear(tempdir1);
          fsys.remove(tempdir1);
        }
      });
    } else {
      return res.sendStatus(404);
    }
  });
});

router.get('/exam/:sender/:type/:year/:month', async (req, res, next) => { req.datatype = 'sqlite';
  var params = {}
  if (req.params.sender === 'all') {
    params = { $year: req.params.year, $month: req.params.month === 'all' ? 13 : req.params.month }
    if (req.params.type === 'adult') {
      req.query = "select sd.dept as name,\
                  COALESCE((SELECT SUM(dds.dv219f) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.dv219f), 0) || ')' AS dv219f,\
                  COALESCE((SELECT SUM(dds.dv219s) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.dv219s), 0) || ')' AS dv219s,\
                  COALESCE((SELECT SUM(dds.dv220f) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.dv220f), 0) || ')' AS dv220f,\
                  COALESCE((SELECT SUM(dds.dv220s) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.dv220s), 0) || ')' AS dv220s,\
                  COALESCE((SELECT SUM(dds.dv325f) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.dv325f), 0) || ')' AS dv325f,\
                  COALESCE((SELECT SUM(dds.dv325s) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.dv325s), 0) || ')' AS dv325s,\
                  COALESCE((SELECT SUM(dds.dv336f) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.dv336f), 0) || ')' AS dv336f,\
                  COALESCE((SELECT SUM(dds.dv336s) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.dv336s), 0) || ')' AS dv336s,\
                  COALESCE((SELECT SUM(dds.pv230f) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.pv230f), 0) || ')' AS pv230f,\
                  COALESCE((SELECT SUM(dds.pv230s) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.pv230s), 0) || ')' AS pv230s\
                  FROM exam dd LEFT JOIN sender sd ON dd.sender = sd.code\
                  WHERE dd.year = $year AND dd.month <= $month\
                  GROUP BY sd.dept ORDER BY sd.dept";
    } else {
      req.query = "select sd.dept as name,\
                  COALESCE((SELECT SUM(dds.ds035f) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.ds035f), 0) || ')' AS ds035f,\
                  COALESCE((SELECT SUM(dds.ds035s) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.ds035s), 0) || ')' AS ds035s,\
                  COALESCE((SELECT SUM(dds.ds223f) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.ds223f), 0) || ')' AS ds223f,\
                  COALESCE((SELECT SUM(dds.ds223s) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.ds223s), 0) || ')' AS ds223s,\
                  COALESCE((SELECT SUM(dds.pd231f) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.pd231f), 0) || ')' AS pd231f,\
                  COALESCE((SELECT SUM(dds.pd231s) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.pd231s), 0) || ')' AS pd231s,\
                  COALESCE((SELECT SUM(dds.pd232f) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.pd232f), 0) || ')' AS pd232f,\
                  COALESCE((SELECT SUM(dds.pd232s) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.pd232s), 0) || ')' AS pd232s,\
                  COALESCE((SELECT SUM(dds.pd233f) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.pd233f), 0) || ')' AS pd233f,\
                  COALESCE((SELECT SUM(dds.pd233s) FROM exam dds JOIN sender sds ON dds.sender = sds.code WHERE sds.dept = sd.dept AND dds.year = $year AND dds.month = $month), 0) || ' (' || COALESCE(SUM(dd.pd233s), 0) || ')' AS pd233s\
                  FROM exam dd LEFT JOIN sender sd ON dd.sender = sd.code\
                  WHERE dd.year = $year AND dd.month <= $month\
                  GROUP BY sd.dept ORDER BY sd.dept";
    }
  } else {
    params = { $year: req.params.year, $sender: req.params.sender }
    if (req.params.type === 'adult') {
      req.query = "SELECT dp.month AS name,\
                  COALESCE(SUM(dp.dv219f), 0) AS dv219f,\
                  COALESCE(SUM(dp.dv219s), 0) AS dv219s,\
                  COALESCE(SUM(dp.dv220f), 0) AS dv220f,\
                  COALESCE(SUM(dp.dv220s), 0) AS dv220s,\
                  COALESCE(SUM(dp.dv325f), 0) AS dv325f,\
                  COALESCE(SUM(dp.dv325s), 0) AS dv325s,\
                  COALESCE(SUM(dp.dv336f), 0) AS dv336f,\
                  COALESCE(SUM(dp.dv336s), 0) AS dv336s,\
                  COALESCE(SUM(dp.pv230f), 0) AS pv230f,\
                  COALESCE(SUM(dp.pv230s), 0) AS pv230s\
                  FROM exam dp LEFT JOIN sender sd ON dp.sender = sd.code\
                  WHERE dp.year = $year AND sd.dept = $sender\
                  GROUP BY dp.month\
                  ORDER BY dp.month";
    } else {
      req.query = "SELECT dp.month AS name, \
                  COALESCE(SUM(dp.ds035f), 0) AS ds035f,\
                  COALESCE(SUM(dp.ds035s), 0) AS ds035s,\
                  COALESCE(SUM(dp.ds223f), 0) AS ds223f,\
                  COALESCE(SUM(dp.ds223s), 0) AS ds223s,\
                  COALESCE(SUM(dp.pd231f), 0) AS pd231f,\
                  COALESCE(SUM(dp.pd231s), 0) AS pd231s,\
                  COALESCE(SUM(dp.pd232f), 0) AS pd232f,\
                  COALESCE(SUM(dp.pd232s), 0) AS pd232s,\
                  COALESCE(SUM(dp.pd233f), 0) AS pd233f,\
                  COALESCE(SUM(dp.pd233s), 0) AS pd233s \
                  FROM exam dp LEFT JOIN sender sd ON dp.sender = sd.code\
                  WHERE dp.year = $year AND sd.dept = $sender\
                  GROUP BY dp.month\
                  ORDER BY dp.month";
    }
  }
  req.app.locals.database.fproc.all(req.query, params, (error, data) => {
    if (error) next(error);
    res.data = data; next();
  });
});

module.exports = router;
