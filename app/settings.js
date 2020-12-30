var path = require('path');
var fs = require('fs');
var db = require('./database');
var fn = require('./functions');

var settings = {
  DirViPNet: { type: 'text', group: 'primary', default: '', name: 'Папка для ViPNet', description: 'Папка для ViPNet' },
  MOfederal: { type: 'number', group: 'primary', default: 0, name: 'Федеральный код', description: 'Федеральный код МО' },
  MOregional: { type: 'number', group: 'primary', default: 0, name: 'Региональный код', description: 'Региональный код МО' },
  Validate: { type: 'toggle', group: 'primary', default: false, name: 'Валидация файлов', description: 'Проводить валидацию перед отправкой' },
  IntervalFirst: { type: 'number', group: 'primary', default: 5, name: 'Первая проверка', description: 'Задержка перед первой проверкой неотправленных файлов' },
  IntervalSecond: { type: 'number', group: 'primary', default: 15, name: 'Повторные проверки', description: 'Задержка перед повторными проверками неотправленных файлов' },
  ProcessProf: { type: 'toggle', group: 'process', default: false, name: 'Профосмотры', description: 'Наполнение таблицы "exam" для внешнего отчета по филиалам' },
  ProcessReestr: { type: 'toggle', group: 'process', default: false, name: 'Реестры на оплату', description: 'Копирование сводных счетов-реестров в папку для бухгалтерии' },
  ProcessArchive: { type: 'toggle', group: 'process', default: false, name: 'Архив реестров', description: 'Наполнение архива случаев ОМС (дополнительная база данных "archive")' },
  DirFinance: { type: 'text', group: 'finance', default: '', name: 'Папка', description: 'Папка для сч.-реестров' },
  PrefFinance: { type: 'text', group: 'finance', default: '', name: 'Префикс', description: 'Префикс для подпапок' },
  SMTPrecipientFinance: { type: 'text', group: 'finance', default: '', name: 'Адрес', description: 'Адрес для сч.-реестров' },
  SendMail: { type: 'toggle', group: 'mail', default: false, name: 'Включено', description: 'Отправлять уведомления по электронной почте' },
  SMTPserver: { type: 'text', group: 'mail', default: '', name: 'Сервер', description: 'Сервер SMTP' },
  SMTPport: { type: 'number', group: 'mail', default: 25, name: 'Порт', description: 'Порт SMTP' },
  SMTPuseTLS: { type: 'toggle', group: 'mail', default: false, name: 'Протокол TLS', description: 'Использовать протокол TLS' },
  SMTPuseLogin: { type: 'toggle', group: 'mail', default: false, name: 'Авторизация', description: 'Использовать логин и пароль' },
  SMTPlogin: { type: 'text', group: 'mail', default: '', name: 'Логин', description: 'Логин' },
  SMTPpassword: { type: 'password', group: 'mail', default: '', name: 'Пароль', description: 'Пароль' },
  SMTPsender: { type: 'text', group: 'mail', default: '', name: 'Отправитель', description: 'Адрес отправителя' },
  SMTPrecipientMain: { type: 'text', group: 'mail', default: '', name: 'Получатель', description: 'Адрес получателя' },
  SMTPrecipients: { type: 'text', group: 'notice', default: '', name: 'Адреса', description: 'Дополнительные адреса для уведомлений (через запятую)' },  
  NoticeOutbox: { type: 'toggle', group: 'notice', default: false, name: 'Неотправленные', description: 'Уведомлять о неотправленных файлах' },
  NoticeG: { type: 'toggle', group: 'notice', default: false, name: 'Госпитализации', description: 'Уведомлять об отправке файлов с госпитализациями' },
  NoticeValidation: { type: 'toggle', group: 'notice', default: false, name: 'Валидация', description: 'Уведомлять о неудачной валидации файлов' },
  NoticeFinance: { type: 'toggle', group: 'notice', default: false, name: 'Счета-реестры', description: 'Уведомлять о получении счетов-реестров' },
  NoticeError: { type: 'toggle', group: 'notice', default: false, name: 'Ошибки', description: 'Уведомлять о возникновении ошибок в работе' },
}

var folders = {
  system: ['app', 'public', 'routes', 'queries', 'views'],
  inroot: ['files', 'schemas', 'temp'],
  files: ['archive', 'expert', 'final', 'recieved', 'reestr', 'sended', 'unknown'],
}

var createdirs = (dirs) => {
  folders = { root: path.parse(__dirname).dir };
  dirs.system.forEach(dir => {
    folders[dir] = path.join(folders['root'], dir);
  });
  dirs.inroot.forEach(dir => {
    var fullpath = path.join(folders['root'], dir);
    if (!fs.existsSync(fullpath)) fs.mkdirSync(fullpath);
    folders[dir] = fullpath;
  });
  dirs.files.forEach(dir => {
    var fullpath = path.join(folders['root'], path.join('files', dir));
    if (!fs.existsSync(fullpath)) fs.mkdirSync(fullpath);
    folders[dir] = fullpath;
  });
}

var folder = (name) => {
  return folders[name];
}

var createdb = async (dbname) => {
  var test = await db[dbname].oneSync("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'");
  if (!test) {
    var dbversion = 0;
    var sqlfiles = fs.readdirSync(folders['queries']);
    sqlfiles.forEach( sqlfile => {
      if (sqlfile.indexOf('create_' + dbname + '_v') == 0) {
        var version = path.parse(sqlfile).name.substring(9 + dbname.length);
        version = parseInt(version, 10);
        if (version > dbversion) dbversion = version;
      }
    });
    var createsql = fs.readFileSync(path.join(folders['queries'], 'create_' + dbname + '_v' + dbversion + '.sql'));
    await db[dbname].execSync(createsql.toString());
  }
}

var updatedb = async (dbname) => {
  var actualversion = 1;
  var sqlfiles = fs.readdirSync(folders['queries']);
  sqlfiles.forEach( sqlfile => {
    if (sqlfile.indexOf('update_' + dbname + '_to_v') == 0) {
      var version = path.parse(sqlfile).name.substring(12 + dbname.length);
      version = parseInt(version, 10);
      if (version > actualversion) actualversion = version;
    }
  });
  var currentversion = await db[dbname].oneSync("SELECT value FROM settings WHERE name = 'VerDB'");
  if (!currentversion) currentversion = 0;
  currentversion = parseInt(currentversion, 10);
  if (currentversion != actualversion) {
    for (var i = currentversion + 1; i <= actualversion; i++) {
      var updatesql = fs.readFileSync(path.join(folders['queries'], 'update_' + dbname + '_to_v' + i + '.sql'));
      await db[dbname].execSync(updatesql.toString());
    }
    fn.eventLog('База данных "' + dbname + '" обновлена до версии ' + actualversion + '.', 'Обновление базы данных', 'system', 'settings.updatedb');
  }
}

var convert = (key, value) => {
  switch (settings[key].type) {
    case 'number': return parseInt(value, 10);
    case 'toggle': return value == '1';
    default: return value;
  }
}

var load = async () => {
  var rows = await db.fproc.allSync("SELECT * FROM settings WHERE NOT name = 'VerDB'");
  for (var key in settings) {
    var row = rows[rows.findIndex(row => row.name == key)];
    if (row) {
      settings[key].value = convert(key, row.value);
    } else {
      await db.fproc.runSync("INSERT INTO settings (name, value)  VALUES (?, ?)", [key, settings[key].default]);
      settings[key].value = settings[key].default;
    }
  }
  if (settings['SMTPpassword'].value.length > 0 && fn.decrypt(settings['SMTPpassword'].value).length == 0) {
    fn.eventLog('Неудалось проверить пароль SMTP. Пароль будет сброшен.', 'Ошибка при расшифровке пароля', 'warning', 'settings.load');
    await db.fproc.runSync("UPDATE settings SET value = '' WHERE name = 'SMTPpassword'", []);
    settings['SMTPpassword'].value = '';
  }
  rows.forEach(async (row) => {
    if (!settings[row.name]) await db.fproc.runSync("DELETE FROM settings WHERE name = ?", [row.name]);
  });
}

var get = (key) => {
  return settings[key].value;
}

var set = async (key, value) => {
  var result = await db.fproc.runSync("UPDATE settings SET value = ? WHERE name = ?", [value, key]);
  settings[key].value = convert(key, value);
  return result;
}

var setAll = async (values) => {
  var vipnetchanged = false;
  for (var key in values) {
    if (key != 'apikey' && convert(key, values[key]) != settings[key].value) {
      if (key == 'DirViPNet') vipnetchanged = true;
      if (key == 'SMTPpassword') {
        await set(key, fn.encrypt(values[key]));
      } else {
        await set(key, values[key]);
      }
    }
  }
  return vipnetchanged;
}

var getAll = () => {
  return settings;
}

var init = async () => {
  createdirs(folders);
  await createdb('fproc');
  await updatedb('fproc');
  await createdb('archive');
  await updatedb('archive');
  await load();
  fn.eventLog('Приложение готово к работе', 'Инициализация', 'system', 'settings.init');
}

module.exports = {
  folder,
  load,
  get,
  set,
  getAll,
  setAll,
  init,
};
