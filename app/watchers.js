var chokidar = require('chokidar');
var async = require('async');
var path = require('path');
var fs = require('fs');

var fn = require('./functions');
var db = require('./database');
var settings = require('./settings');
var process = require('./processfile');
var processarc = require('./processarc');

var archiveCargo = async.cargo(async(tasks, callback) => {
  for (var i = 0; i < tasks.length; i++) {
    await processarc.archive(tasks[i].path);
  }
  callback();
}, 5);

var inboxCargo = async.cargo(async(tasks, callback) => {
  for (var i = 0; i < tasks.length; i++) {
    await onProcessInbox(tasks[i].path);
  }
  callback();
}, 1);

var outboxCargo = async.cargo(async(tasks, callback) => {
  for (var i = 0; i < tasks.length; i++) {
    await onProcessOutbox(tasks[i].path);
  }
  callback();
}, 1);

var senderCargo = async.cargo(async(tasks, callback) => {
  for (var i = 0; i < tasks.length; i++) {
    await onProcessSender(tasks[i].path, tasks[i].sender);
  }
  callback();
}, 1);

var timerID = null;

var watch = (type, sender) => { // создание вотчера
  var folder = '';
  switch (type) {
    case 'inbox':
    case 'outbox': folder = settings.get('DirViPNet'); break;
    case 'archive': folder = settings.folder('temp'); break;
    case 'sender': folder = sender.dir; break;
  }
  if (folder == '') return undefined;
  if (type != 'archive') {
    var indir = path.join(folder, 'Входящие');
    var outdir = path.join(folder, 'Исходящие');
    if (!fs.existsSync(folder)) {
      fn.eventLog('Папка "' + folder + '" не существует', 'Невозможно создать вотчер', 'warning', 'watchers.watch');
      return undefined;
    }
    if (!fs.existsSync(indir)) fs.mkdirSync(indir);
    if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);
    if (type == 'inbox') {
      folder = indir;
    } else {
      folder = outdir;
    }
  }
  var watcher = chokidar.watch(folder, { depth: 0, awaitWriteFinish: false, persistent: true });
  watcher.on('error', (error) => fn.eventLog(error, 'Во время обработки файла произошла ошибка', 'error', 'watchers.watch'));
  switch (type) {
    case 'inbox':
      watcher.on('add', (path) => inboxCargo.push({path}));
      fn.eventLog('Обработка входящих файлов запущена', 'Обработка входящих файлов', 'system', 'watchers.watch');
      break;
    case 'outbox':
      if (testFiles()) { // если в OUTBOX есть файлы - включаем таймер
        timerID = setTimeout(onTimer, settings.get('IntervalFirst') * 60000);
      }
      watcher.on('unlink', (path) => outboxCargo.push({path}));
      fn.eventLog('Обработка отправленых файлов запущена', 'Обработка отправленых файлов', 'system', 'watchers.watch');
      break;
    case 'archive':
      watcher.on('add', (path) => archiveCargo.push({path}));
      fn.eventLog('Обработка архива случаев ОМС запущена', 'Обработка архива реестров', 'system', 'watchers.watch');
      break;
    case 'sender':
      watcher.on('add', (path) => senderCargo.push({path, sender}));
      fn.eventLog('Обработка исходящих файлов для отправителя ' + sender.name + ' запущена', 'Обработка исходящих файлов', 'system', 'watchers.watch');
      break;
  }
  return watcher;
}

var close = (watcher, type, sender) => { // уничтожение вотчера
  return new Promise((resolve) => {
    watcher.close().then(() => {
      switch (type) {
        case 'inbox':
          fn.eventLog('Обработка входящих файлов остановлена', 'Обработка входящих файлов', 'system', 'watchers.close');
          break;
        case 'outbox':
          clearTimeout(timerID);
          timerID = null;
          fn.eventLog('Обработка отправленых файлов остановлена', 'Обработка отправленых файлов', 'system', 'watchers.close');
          break;
        case 'archive':
          fn.eventLog('Обработка архива случаев ОМС становлена', 'Обработка архива реестров', 'system', 'watchers.close');
          break;
        case 'sender':
          fn.eventLog('Обработка исходящих файлов для отправителя ' + sender.name + ' остановлена', 'Обработка исходящих файлов', 'system', 'watchers.close');
          break;
      }
      resolve(undefined);
    });
  });
}

var onProcessInbox = async (fullpath) => { // событие - создание файла в папке для входящих из ЦОР
  fn.eventLog(await process.inbox(fullpath), 'Обработка входящих файлов', 'process', 'watchers.onProcessInbox');
}

var onProcessOutbox = async (fullpath) => { // событие - удаление файла в основной папке для исходящих (випнет забрал файл)
  await process.outbox(fullpath);
  if (!testFiles()) { // если других фалов нет - выключаем таймер
    clearTimeout(timerID);
    timerID = null;
  }
}

var onProcessSender = async (fullpath, sender) => { // событие - создание файла в папке отправителя
  var types = sender.types.split(',').join('|');
  var test = path.parse(fullpath).base.match(new RegExp("^("+types+")M[0-9]{6}T24_[0-9]*\.(zip|xml)$", 'i'));
  if (test) {
    fn.eventLog(await process.sender(fullpath, sender), 'Обработка исходящих файлов', 'process', 'watchers.onProcessSender');
    if (timerID == null && testFiles()) { // если таймер выключен - включаем
      timerID = setTimeout(onTimer, settings.get('IntervalFirst') * 60000);
    }
  }
}

var onTimer = () => { // событие - истечение таймера неотправки файлов (випнет не забирает файлы из основной папки для исходящих)
  timerID == null;
  var dirfull = path.join(settings.get('DirViPNet'), 'Исходящие');
  if (testFiles()) {
    var proctime = new Date();
    var datetime = fn.dateToString(proctime, true);
    var message = 'По состоянию на ' + datetime + ' следующие файлы находятся в папке "' + dirfull + '": ';
    var files = fs.readdirSync(dirfull);
    files.forEach(file => message += file + ', ');
    message = message.substring(0, message.length - 2);
    message += '.';
    fn.eventLog('Випнет  не забирает файлы из папки "' + dirfull + '"', 'Сбой в отправке файлов', 'warning', 'watchers.onTimer');
    fn.sendMessage('Сбой в отправке файлов', message, settings.get('NoticeOutbox'));
    timerID = setTimeout(onTimer, settings.get('IntervalSecond') * 60000); // перезапускаяем таймер с большим интервалом, чтобы избежать спама уведомлениями
  }
}

var testFiles = () => { // проверка наличия файлов в основнйо папке для исходящих
  var num = 0;
  var files = fs.readdirSync(path.join(settings.get('DirViPNet'), 'Исходящие'));
  files.forEach(file => {
    if (file.match(new RegExp("^[A-Z]{1,2}M[0-9]{6}T24_[0-9]{10}\.(zip|xml)$"))) num += 1;
  });
  return num > 0;
}

var watchers = []; // контейнер для вотчеров
var senders = undefined;

var start = async (type) => { // запуск вотчера
  switch (type) {
    case 'inbox':
    case 'outbox':
    case 'archive':
      if (!watchers[type]) watchers[type] = watch(type);
      break;
    case 'senders':
      var activesenders = await db.fproc.allSync('SELECT * FROM sender WHERE status = 1');
      if (!watchers.senders) watchers.senders = [];
      senders = [];
      activesenders.forEach(sender => {
        if (!watchers.senders[sender.code]) watchers.senders[sender.code] = watch('sender', sender);
        if (watchers.senders[sender.code]) senders.push(sender);
      });
      break;
  }
}

var stop = async (type) => { // остановка вотчера
  switch (type) {
    case 'inbox':
    case 'outbox':
    case 'archive':
      if (watchers[type]) watchers[type] = await close(watchers[type], type);
      break;
    case 'senders':
      if (watchers.senders) {
        for (watcher in watchers.senders) {
          if (watchers.senders[watcher]) {
            var sender = senders[senders.findIndex(sender => sender.code == watcher)];
            watchers.senders[watcher] = await close(watchers.senders[watcher], 'sender', sender);
          }
        }
        senders = undefined;
      }
      break;
  }
}

var restart = async (type, newsender) => { // перезапуск вотчера
  switch (type) {
    case 'inbox':
    case 'outbox':
      if (watchers[type]) {
        await close(watchers[type], type);
        watchers[type] = watch(type);
      } else { // принудительный запуск для случаев когда вотчер не работал из-за отсутствующей папки
        if ((type == 'inbox' && process.env.STARTINBOX) || (type == 'outbox' && process.env.STARTOUTBOX)) watchers[type] = watch(type);
      }
      break;
    case 'sender':
      if (senders) {
        senders[senders.findIndex(sender => sender.code == newsender.code)] = newsender;
        if (watchers.senders) {
          if (watchers.senders[newsender.code]) watchers.senders[newsender.code] = await close(watchers.senders[newsender.code], 'sender', newsender);
          senders = senders.filter(sender => sender.code != newsender.code );
          if (newsender.status == 1) watchers.senders[newsender.code] = watch('sender', newsender);
          if (watchers.senders[newsender.code]) senders.push(newsender);
        }
      }
      break;  
  }
}

var status = () => { // информация о текущем состоянии вотчеров
  var active = {
    inbox: watchers.inbox != undefined,
    outbox: watchers.outbox != undefined,
    archive: watchers.archive != undefined,
    senders: watchers.senders != undefined,
    all: false 
  };
  if (active.senders) {
    active.senders = false;
    Object.keys(watchers.senders).forEach(key => {
      if (watchers.senders[key] != undefined) active.senders = true;
    })
  }
  if (active.inbox && active.senders) active.all = true;
  var action = {};
  for (var watcher in active) {
    action[watcher] =  active[watcher] ? 'stop' : 'start';
  }
  var folders = [];
  if (active.archive) folders.push(settings.folder('temp'));
  if (active.inbox) folders.push(path.join(settings.get('DirViPNet'), 'Входящие'));
  if (active.outbox) folders.push(path.join(settings.get('DirViPNet'), 'Исходящие'));
  if (active.senders) senders.forEach( sender => folders.push(path.join(sender.dir, 'Исходящие')));
  return { active, action, folders };
}

module.exports = {
  start,
  stop,
  restart,
  status,
};
