var sqlite = require('sqlite3');

var fproc = new sqlite.Database('fproc.db');
fproc.configure('busyTimeout', 30000);

fproc.execSync = (sql) => {
  return new Promise((resolve, reject) => {
    fproc.exec(sql, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve();
    });
  });
}

fproc.runSync = (sql, params) => {
  return new Promise((resolve, reject) => {
    fproc.run(sql, params, function(err) { // со стрелкой не работает возврат результата выполнения
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(this);
    });
  });
}

fproc.oneSync = (sql, params) => {
  return new Promise((resolve, reject) => {
    fproc.get(sql, params, (err, row) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(row ? row[Object.keys(row)[0]] : null);
    });
  });
}

fproc.getSync = (sql, params) => {
  return new Promise((resolve, reject) => {
    fproc.get(sql, params, (err, row) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(row);
    });
  });
}

fproc.allSync = (sql, params) => {
  return new Promise((resolve, reject) => {
    fproc.all(sql, params, (err, rows) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(rows);
    });
  });
}

var archive = new sqlite.Database('archive.db');
archive.configure('busyTimeout', 30000);

archive.execSync = (sql) => {
  return new Promise((resolve, reject) => {
    archive.exec(sql, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve();
    });
  });
}

archive.oneSync = (sql, params) => {
  return new Promise((resolve, reject) => {
    archive.get(sql, params, (err, row) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(row ? row[Object.keys(row)[0]] : null);
    });
  });
}

module.exports = {
  fproc,
  archive,
};
