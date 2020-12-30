var task = process.argv[2] || 'start';
var forever = require('forever');

switch (task) {
  case 'start':
    forever.list(false, function (err, list) {
      var isrunning = false;
      for (var process in list) {
        if (list[process].cwd == __dirname) {
          isrunning = true;
        }
      }
      if (!isrunning) {
        forever.startDaemon('app/server.js', {
          cwd: __dirname,
          silent: false,
          max: 3,
          args: [],
          env: { NODE_ENV: 'production', FPROC_VERSION: require('./package.json').version },
        });
        console.log('Обработчик реестров запущен');
      } else {
        console.log('Обработчик реестров уже запущен');
      }
    });
    break;
  case 'stop':
    forever.list(false, function (err, list) {
      var index = undefined;
      for (var process in list) {
        if (list[process].cwd == __dirname) {
          index = process;
        }
      }
      if (index != undefined) {
        forever.stop(index);
        console.log('Обработчик реестров остановлен');
      } else {
        console.log('Обработчик реестров не запущен');
      }
    });
    break;
  case 'list':
    forever.list(false, function (err, list) {
      console.dir(list);
    });
    break;
}
