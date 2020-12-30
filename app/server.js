if (require('dotenv').config({ path:'.env' }).error) {
  console.error('Невозможно прочитать файл конфигурации');
  process.exit(0);
}

if (!process.env.PORT) {
  console.error('В файле конфигурации не указан порт');
  process.exit(0);
}

process.env.STARTINBOX = !process.env.STARTINBOX || process.env.STARTINBOX.toLowerCase() == 'true';
process.env.STARTOUTBOX = !process.env.STARTOUTBOX || process.env.STARTOUTBOX.toLowerCase() == 'true';
process.env.STARTARCHIVE = !process.env.STARTARCHIVE || process.env.STARTARCHIVE.toLowerCase() == 'true';
process.env.STARTSENDERS = process.env.STARTSENDERS && process.env.STARTSENDERS.toLowerCase() == 'true';

var server = async () => {
  await require('./settings').init();
  var app = require('./express');
  var http = require('http');
  var server = http.createServer(app);
  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        console.error('Порт ' + process.env.PORT + ' требует расширенных прав');
        process.exit(0);
      case 'EADDRINUSE':
        console.error('Порт ' + process.env.PORT + ' уже используется');
        process.exit(0);
      default:
        throw error;
    }
  });
  server.listen(process.env.PORT);
}

server();
