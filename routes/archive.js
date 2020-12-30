var router = require('express').Router();

router.post('/file/:name?', (req, res, next) => {
  var query = "SELECT *, CASE WHEN sump > 0 THEN NULL ELSE 'red' END AS rowcolor FROM (\
              SELECT date_1, date_2, code_md, MAX(sump) AS sump, fam, im, ot, dr, MAX(comment_z) AS comment_z\
              FROM arc_med LEFT JOIN arc_pac ON arc_pac.id_pac = arc_med.id_pac WHERE arc_med.file LIKE ?\
              GROUP BY date_1, date_2, code_md, fam, im, ot, dr\
              )";
  req.app.locals.database.archive.all(query, '%_' + req.params.name, async (error, rows) => {
    if (error) return next(error);
    res.data = rows; next();
  });
});

router.post('/archive/:type/:datefrom?/:dateto?', (req, res, next) => {
  // " + (req.params.datefrom && req.params.dateto && " AND date_e >= ? AND date_b <= ?") + "\
  var where = "";
  switch (req.params.type) {
    case 'app': where = " AND arc_med.type = 'V' "; break;
    case 'po': where = " AND arc_med.type IN ('DV', 'DS', 'PV', 'PD') "; break;
    case 'st': where = " AND arc_med.type = 'R' "; break;
    case 'smp': where = " AND arc_med.type = 'H' "; break;
  }       
  var query = "SELECT *, arc_med.type as type, arc_pac.comment_p||' / '||arc_med.comment_z||' / '||arc_med.comment_s as comment,\
              arc_med.id_zap AS rowgroup,\
              CASE WHEN NOT arc_med.sank = '0' THEN 'red' ELSE NULL END AS rowcolor\
              FROM (SELECT arc_pac.id AS pac_id, arc_med.id AS med_id, MAX(arc_med.date)\
              FROM arc_pac LEFT JOIN arc_med ON arc_med.id_pac = arc_pac.id_pac "+where+"\
              WHERE UPPER(arc_pac.fam) LIKE ? AND UPPER(arc_pac.im) LIKE ? AND UPPER(arc_pac.ot) LIKE ?\
              GROUP BY arc_med.id_med_usl) actual\
              LEFT JOIN arc_pac ON arc_pac.id = actual.pac_id\
              LEFT JOIN arc_med ON arc_med.id = actual.med_id\
              LEFT JOIN MU ON MU.IDMU = arc_med.podr\
              LEFT JOIN DOC ON DOC.PCOD = arc_med.code_md\
              LEFT JOIN APV ON APV.VIS_OBN = arc_med.vis_ob\
              AND (arc_med.date_e < SUBSTR(APV.CLDATE,7)||'-'||SUBSTR(APV.CLDATE,4,2)||'-'||SUBSTR(APV.CLDATE,1,2) OR APV.CLDATE IS NULL)\
              AND arc_med.date_e >= SUBSTR(APV.BGDATE,7)||'-'||SUBSTR(APV.BGDATE,4,2)||'-'||SUBSTR(APV.BGDATE,1,2)\
              LEFT JOIN KSG_KSG ON KSG_KSG.KSG_KSG_CODE = COALESCE(arc_med.code_mes2, arc_med.code_mes1) AND KSG_KSG.IDFFOMS_V006_F = arc_med.usl_ok\
              AND (arc_med.date_e < SUBSTR(KSG_KSG.CLDATE,7)||'-'||SUBSTR(KSG_KSG.CLDATE,4,2)||'-'||SUBSTR(KSG_KSG.CLDATE,1,2) OR KSG_KSG.CLDATE IS NULL)\
              AND arc_med.date_e >= SUBSTR(KSG_KSG.BGDATE,7)||'-'||SUBSTR(KSG_KSG.BGDATE,4,2)||'-'||SUBSTR(KSG_KSG.BGDATE,1,2)\
              LEFT JOIN MESMKB ON MESMKB.MES = COALESCE(arc_med.code_mes2, arc_med.code_mes1) AND MESMKB.MKB_FOND = arc_med.ds1\
              AND (arc_med.date_e < substr(MESMKB.CLDATE,7)||'-'||substr(MESMKB.CLDATE,4,2)||'-'||substr(MESMKB.CLDATE,1,2) OR MESMKB.CLDATE IS NULL)\
              AND arc_med.date_e >= substr(MESMKB.BGDATE,7)||'-'||substr(MESMKB.BGDATE,4,2)||'-'||substr(MESMKB.BGDATE,1,2)\
              LEFT JOIN OKSO ON OKSO.IDNSPEC = arc_med.code_usl\
              AND (arc_med.date_e < SUBSTR(OKSO.CLDATE,7)||'-'||SUBSTR(OKSO.CLDATE,4,2)||'-'||SUBSTR(OKSO.CLDATE,1,2) OR OKSO.CLDATE IS NULL)\
              AND arc_med.date_e >= SUBSTR(OKSO.BGDATE,7)||'-'||SUBSTR(OKSO.BGDATE,4,2)||'-'||SUBSTR(OKSO.BGDATE,1,2)\
              LEFT JOIN TMUSL ON TMUSL.S_KOD = arc_med.code_usl\
              AND (arc_med.date_e < substr(TMUSL.CLDATE,7)||'-'||substr(TMUSL.CLDATE,4,2)||'-'||substr(TMUSL.CLDATE,1,2) OR TMUSL.CLDATE IS NULL)\
              AND arc_med.date_e >= substr(TMUSL.BGDATE,7)||'-'||substr(TMUSL.BGDATE,4,2)||'-'||substr(TMUSL.BGDATE,1,2)\
              LEFT JOIN FFOMS_V009 ON FFOMS_V009.IDRMP = arc_med.usl_ok\
              AND (arc_med.date_e < substr(FFOMS_V009.CLDATE,7)||'-'||substr(FFOMS_V009.CLDATE,4,2)||'-'||substr(FFOMS_V009.CLDATE,1,2) OR FFOMS_V009.CLDATE IS NULL)\
              AND arc_med.date_e >= substr(FFOMS_V009.BGDATE,7)||'-'||substr(FFOMS_V009.BGDATE,4,2)||'-'||substr(FFOMS_V009.BGDATE,1,2)\
              WHERE arc_med.type IS NOT NULL\
              ORDER BY arc_med.date_b, arc_med.id_zap, arc_med.date_1";
  var params = [ req.body.surname.toUpperCase() + '%', req.body.name.toUpperCase() + '%', req.body.patronymic.toUpperCase() + '%' ];
  if (req.params.datefrom && req.params.dateto) {
    params.push(req.params.datefrom);
    params.push(req.params.dateto);
  }
  req.app.locals.database.archive.all(query, params, async (error, rows) => {
    if (error) return next(error);
    var names = await req.app.locals.database.fproc.allSync("SELECT code, name FROM type UNION SELECT code, name FROM protocol");
    rows.forEach(row => {
      row.doctor = row.DOC;
      row.podr = row.MU;
      row.prof = row.OKSO + ', ' + row.APV;
      if (row.TMUSL !== null) row.prof = row.TMUSL;
      if (row.ADDNAME !== null) row.prof = row.ADDNAME;
      if (row.KSG_KSG !== null) row.prof = row.KSG_KSG;
      if (row.type === 'H') {
        switch (row.vidpom) {
          case '1': row.prof = 'Неотложная медицинская помощь'; break;
          case '2': row.prof = 'Скорая медицинская помощь'; break;
          case '3': row.prof = 'Санитарно-авиационная'; break;
        }
        row.prof = row.prof + ', ' + row.FFOMS_V009;
      }
      row.prot = names[names.findIndex(name => name.code === row.prot)] ? names[names.findIndex(name => name.code === row.prot)].name : '-';
      row.type = names[names.findIndex(name => name.code === row.type)] ? names[names.findIndex(name => name.code === row.type)].name : '-';
      row.rowgroupname = row.fam + ' ' + row.im + ' ' + row.ot + ' ' + req.app.locals.functions.dateToString(new Date(row.dr)) + ' - ' + row.type + ' в период с ' + req.app.locals.functions.dateToString(new Date(row.date_b)) + ' по ' + req.app.locals.functions.dateToString(new Date(row.date_e)) + ' (' + row.prot + ')';
    });
    res.data = rows; next();
  });
});

module.exports = router;
