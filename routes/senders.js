var router = require('express').Router();

router.get('/', (req, res, next) => {
  var query = "SELECT *, \
              CASE WHEN status = 0 THEN 'Отключен' ELSE 'Активен' END AS statusname,\
              CASE WHEN status = 0 THEN 'red' ELSE 'green' END AS rowcolor\
              FROM sender ORDER BY num, name"
  req.app.locals.database.fproc.all(query, (error, rows) => {
    if (error) return next(error);
    res.render('senders', {
      title: 'Отправители',
      senders: rows,
    });
  });
});

router.get('/edit/:code', async (req, res, next) => {
  var row = await req.app.locals.database.fproc.getSync("SELECT * FROM sender WHERE code = UPPER(?)", req.params.code);
  if (!row) {
    if (req.params.code != 'new') return next(new Error('Отправитель с кодом ' + req.params.code + ' не существует'));
    var max = await req.app.locals.database.fproc.oneSync("SELECT MAX(num) FROM sender");
    row = { code: 'NEW', num: max + 1, dept: '', name: 'Новый отправитель', dir: '', types: '' }
  }
  var types = await req.app.locals.database.fproc.allSync("SELECT * FROM type");
  var stypes = row.types.split(',');
  types.forEach(type => {
    if (stypes.includes(type.code)) {
      row[type.code] = true;
    } else {
      row[type.code] = false;
    }
  });
  res.render('sender', {
    title: 'Отправитель',
    sender: row,
    types: types,
    back: 'senders', 
    status: 1,
    apikey: process.env.APIKEY != undefined,
  });
});

router.post('/delete', async (req, res, next) => {
  var count = await req.app.locals.database.fproc.oneSync("SELECT COUNT(*) FROM filesout WHERE sender = ?", [req.body.code]);
  if (count > 0) return next(new Error('Невозможно удалить отправителя с кодом ' + req.body.code + ' - есть отправленные файлы'));
  await req.app.locals.database.fproc.runSync("DELETE FROM sender WHERE code = ?", [req.body.code]);
  res.redirect('../../senders');
});

router.post('/save', async (req, res, next) => {
  var types = await req.app.locals.database.fproc.allSync("SELECT * FROM type");
  var stypes = [];
  types.forEach(type => {
    if (req.body[type.code]) stypes.push(type.code);
  });
  req.body.types = stypes.join(',');
  if (req.body.num > 99) req.body.num = 99;
  if (req.body.name.length == 0) req.body.name = 'Без имени';
  if (req.body.code == 'NEW') {
    var temp = await req.app.locals.database.fproc.runSync("INSERT INTO sender (status, num, dept, name, dir, types, code) VALUES (?, ?, ?, ?, ?, ?, (SELECT 'SENDER'||(COALESCE(MAX(CAST(SUBSTR(code, 7) AS INTEGER))+1,1)) FROM sender))", [req.body.status, req.body.num, req.body.dept, req.body.name, req.body.dir, req.body.types]);
    req.body.code = await req.app.locals.database.fproc.oneSync("SELECT code FROM sender WHERE ROWID = ?", [temp.lastID]);
  } else {
    await req.app.locals.database.fproc.runSync("UPDATE sender SET status = ?, num = ?, dept = ?, name = ?, dir = ?, types = ? WHERE code = ?", [req.body.status, req.body.num, req.body.dept, req.body.name, req.body.dir, req.body.types, req.body.code]);
  }
  await req.app.locals.watchers.restart('sender', req.body);
  res.redirect('../../senders');
});

module.exports = router;
