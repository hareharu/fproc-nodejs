var path = require('path');
var fs = require('fs');

var settings = require('./settings');
var fsys = require('./filesystem');
var db = require('./database');
var fn = require('./functions');

var typexml = ['N', 'G'];
var typedis = ['DS', 'DV', 'PD', 'PV'];

var processArchive = async (filepath, filetype, prottype) => {
  if ((prottype == 'SM' || prottype == 'IM') && typedis.includes(filetype)) return; // в сводных по профам/диспансеризации нет xml-файлов
  var filetemp = filepath;
  var ziptemp = path.join(path.parse(filetemp).dir, path.parse(filetemp).name);
  fsys.extract(filetemp,ziptemp);
  if (prottype) {
    var protlength = prottype.length;
    if (prottype == 'DE' && filetype == 'H') protlength = 0;
    filetemp = path.join(ziptemp, path.parse(filetemp).base.substring(protlength));
    ziptemp = path.join(path.parse(filetemp).dir, path.parse(filetemp).name);
    fsys.extract(filetemp,ziptemp);
  }
  var xmlmed = path.join(ziptemp, path.parse(filetemp).name + '.xml');
  var xmlpers = path.join(ziptemp, 'L' + path.parse(filetemp).name.substring(filetype.length) + '.xml');
  fsys.copy(xmlmed, fsys.check(settings.folder('temp'), ((prottype? prottype : 'MO') + '_' + path.parse(xmlmed).base)));
  if (filetype != 'H') fsys.copy(xmlpers, fsys.check(settings.folder('temp'), ((prottype? prottype : 'MO') + '_' + path.parse(xmlpers).base)));
  fsys.clear(ziptemp);
  fsys.remove(ziptemp);
  if (prottype) {
    fsys.clear(path.parse(ziptemp).dir);
    fsys.remove(path.parse(ziptemp).dir);
  }
}

var processReestr = async (filetemp, filetype, prottype, filename, reestrdate, proctime) => {
  var type = await db.fproc.getSync("SELECT short, reestr FROM type WHERE code = ?", [filetype]);
  if (filetype == 'RM') {
    type = {
      reestr: 'диагностических услуг в МО ' + filename.substring(filename.indexOf('RM') + 2, filename.indexOf('RM') + 2 + 6),
      short: 'Внешние в МО ' + filename.substring(filename.indexOf('RM') + 2, filename.indexOf('RM') + 2 + 6),
    }
  }
  var subjectAfter = '';
  var subjectBefore = '';
  if (prottype == 'IM') {
    subjectAfter = ' (инокраевые)';
    type.short = type.short + ' (инокраевые)';
  }
  var filessend = await db.fproc.oneSync("SELECT count(id_in) FROM filesin WHERE name_in = ?", [filename]);
  if (filessend > 0) {
    subjectBefore = 'ПОВТОРНО! ';
    type.short = type.short + ' ПОВТОРНО ' + fn.dateToString(proctime);
  }
  var monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  var month = monthNames[(reestrdate.substring(2, 4) - 1)];
  if (type.short != null) {
    var message = '';
    var sendtofinance = false;
    if (fs.existsSync(settings.get('DirFinance'))) {
      var ziptemp = path.join(path.parse(filetemp).dir, path.parse(filetemp).name);
      fsys.extract(filetemp,ziptemp);
      var prefix = '';
      if (settings.get('PrefFinance').length > 0) prefix = settings.get('PrefFinance') + ' ';
      var reestrdir3 = path.join(settings.get('DirFinance'), prefix + '20' + reestrdate.substring(0, 2));
      fsys.create(reestrdir3);
      reestrdir3 = path.join(reestrdir3, month);
      fsys.create(reestrdir3);
      reestrdir3 = fsys.check(reestrdir3, type.short);
      fsys.create(reestrdir3);
      var files = fs.readdirSync(ziptemp);
      files.forEach( async file => {
        if (!path.parse(file).base.match(new RegExp("^.*\.zip$", 'i'))) {
          message += path.parse(file).base + "\r\n";
          fsys.move(path.join(ziptemp, file), path.join(reestrdir3, path.parse(file).base));
        } else {
          fsys.remove(path.join(ziptemp, file));
        }
      });
      fsys.remove(ziptemp);
      sendtofinance = true;
      message = 'Полученные сводные реестры счетов находятся в папке "...\\' + reestrdir3.substring(settings.get('DirFinance').length - path.parse(settings.get('DirFinance')).dir.length) + '". Список файлов:\r\n\r\n' + message;
    } else {
      if (settings.get('DirFinance').length > 0) {
        message = 'Не удалось передать сводные реестры счетов из файла ' + filename + ' так как папка "' + settings.get('DirFinance') + '" не существует.';
      } else {
        message = 'Не удалось передать сводные реестры счетов из файла ' + filename + ' так как в настройках не указана папка.';
      }
    }
    fn.sendMessage(subjectBefore + 'Сводные реестры счетов на оплату ' + type.reestr + ' за ' + month.toLowerCase() + ' 20' + reestrdate.substring(0, 2) + ' года' + subjectAfter, message, settings.get('NoticeFinance'), sendtofinance);
  }
}

var processProf = async (filetemp, prottype, id_out, sender) => {
  var prof = { dv219f: 0, dv219s: 0, dv220f: 0, dv220s: 0, dv325f: 0, dv325s: 0, dv336f: 0, dv336s: 0, pv230f: 0, pv230s: 0, ds035f: 0, ds035s: 0, ds223f: 0, ds223s: 0, pd231f: 0, pd231s: 0, pd232f: 0, pd232s: 0, pd233f: 0, pd233s: 0 };
  var ziptemp = path.join(path.parse(filetemp).dir, path.parse(filetemp).name);
  var filetemp2 = path.join(ziptemp, path.parse(filetemp).base.substring(prottype.length));
  var ziptemp2 = path.join(path.parse(filetemp2).dir, path.parse(filetemp2).name);
  fsys.extract(filetemp,ziptemp);
  fsys.extract(filetemp2,ziptemp2);
  var root = await fsys.parse(path.join(ziptemp2, path.parse(filetemp2).name + '.xml'));
  var re_year = 0;
  var re_mon = 0;
  re_year = parseInt(root.ZL_LIST.SCHET[0].YEAR[0], 10);
  re_mon = parseInt(root.ZL_LIST.SCHET[0].MONTH[0].substring(2, 4), 10);
  root.ZL_LIST.SCHET.forEach(SCHET => {
    SCHET.ZAP.forEach(ZAP => {
      ZAP.SLUCH.forEach(SLUCH => {
        var num_lap = parseInt(SLUCH.NUM_LAP[0], 10);
        var oplata = parseInt(SLUCH.OPLATA[0], 10);
        var vis_obn = parseInt(SLUCH.VIS_OBN[0], 10);
          if (oplata == 1 || prottype == 'ER') {
            if (num_lap == 1) {
              switch (vis_obn) {
                case 219: prof['dv219f'] += 1; break;
                case 220: prof['dv220f'] += 1; break;
                case 325: prof['dv325f'] += 1; break;
                case 336: prof['dv336f'] += 1; break;
                case 230: prof['pv230f'] += 1; break;
                case 35:  prof['ds035f'] += 1; break;
                case 223: prof['ds223f'] += 1; break;
                case 231: prof['pd231f'] += 1; break;
                case 232: prof['pd232f'] += 1; break;
                case 233: prof['pd233f'] += 1; break;
                default:
              }
            } else if (num_lap == 2) {
              switch (vis_obn)  {
                case 219: prof['dv219s'] += 1; break;
                case 220: prof['dv220s'] += 1; break;
                case 325: prof['dv325s'] += 1; break;
                case 336: prof['dv336s'] += 1; break;
                case 230: prof['pv230s'] += 1; break;
                case 35:  prof['ds035s'] += 1; break;
                case 223: prof['ds223s'] += 1; break;
                case 231: prof['pd231s'] += 1; break;
                case 232: prof['pd232s'] += 1; break;
                case 233: prof['pd233s'] += 1; break;
                default:
              }
            }
          }
      });
    });
  });
  fsys.clear(ziptemp2);
  fsys.remove(ziptemp2);
  var filessend = await db.fproc.oneSync('SELECT count(id_out) FROM exam WHERE id_out = ?', [id_out]);
  if (filessend == 0) {
    await db.fproc.runSync("INSERT INTO exam (id_out, sender, year, month, dv219f, dv219s, dv220f, dv220s, dv325f, dv325s, dv336f, dv336s, pv230f, pv230s, ds035f, ds035s, ds223f, ds223s, pd231f, pd231s, pd232f, pd232s, pd233f, pd233s) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id_out, sender, re_year, re_mon, prof['dv219f'], prof['dv219s'], prof['dv220f'], prof['dv220s'], prof['dv325f'], prof['dv325s'], prof['dv336f'], prof['dv336s'], prof['pv230f'], prof['pv230s'], prof['ds035f'], prof['ds035s'], prof['ds223f'], prof['ds223s'], prof['pd231f'], prof['pd231s'], prof['pd232f'], prof['pd232s'], prof['pd233f'], prof['pd233s']]);
  } else {
    if (prottype == 'ER') {
      current = await db.fproc.getSync("SELECT dv219f, dv219s, dv220f, dv220s, dv325f, dv325s, dv336f, dv336s, pv230f, pv230s, ds035f, ds035s, ds223f, ds223s, pd231f, pd231s, pd232f, pd232s, pd233f, pd233s FROM exam WHERE id_out = ?", [id_out]);
      prof.forEach( vis => prof[vis] = current[vis] - prof[vis]);
    }
    await db.fproc.runSync("UPDATE exam SET sender = ?, year = ?, month = ?, dv219f = ?, dv219s = ?, dv220f = ?, dv220s = ?, dv325f = ?, dv325s = ?, dv336f = ?, dv336s = ?, pv230f = ?, pv230s = ?, ds035f = ?, ds035s = ?, ds223f = ?, ds223s = ?, pd231f = ?, pd231s = ?, pd232f = ?, pd232s = ?, pd233f = ?, pd233s = ? WHERE id_out = ?", [sender, re_year, re_mon, prof['dv219f'], prof['dv219s'], prof['dv220f'], prof['dv220s'], prof['dv325f'], prof['dv325s'], prof['dv336f'], prof['dv336s'], prof['pv230f'], prof['pv230s'], prof['ds035f'], prof['ds035s'], prof['ds223f'], prof['ds223s'], prof['pd231f'], prof['pd231s'], prof['pd232f'], prof['pd232s'], prof['pd233f'], prof['pd233s'], id_out]);
  }
  fsys.clear(ziptemp);
  fsys.remove(ziptemp);
}

var inbox = async (filefull) => { // обработка входящих файлов
  try {
    var file = await fsys.open(filefull);
    if (!file) return 'Превышено время ожидания при получении файла ' + path.parse(filefull).base;
    var filename = path.parse(filefull).base;
    var fileext = path.parse(filefull).ext.toLowerCase();
    if (filename.match(new RegExp("^[a-z]{1,4}(T24|M[0-9]{6})M[0-9]{6}_[0-9]*(_copy[0-9]{1,}|)\.zip$", 'i'))) {
      if ((filename.split('_copy').length - 1) > 0) {
        filename = filename.substring(0, filename.indexOf('_copy')) + fileext; // убираем "_copyX" добавленное випнетом к имени файла
      }
      var proctime = new Date();
      var tempdir = fsys.check(settings.folder('temp'), path.parse(filename).name);
      var filecreate = fs.statSync(filefull).mtime;
      var filetemp = path.join(tempdir, filename);
      var mocode = filename.substring(filename.lastIndexOf('M') + 1, filename.lastIndexOf('M') + 1 + 6);
      if (mocode == fn.padLeft(settings.get('MOfederal'), 6) || mocode == fn.padLeft(settings.get('MOregional'), 6)) {
        fsys.create(tempdir);
        var copyok = fsys.move(filefull, filetemp);
        if (!copyok) {
          return 'Входящий файл ' + path.parse(filefull).base + ' занят другим процессом';
        }
        var prottype = filename.substring(0, 2).toUpperCase();
        var filetype = filename.substring(2, 4).toUpperCase();
        var filenum = filename.substring(filename.indexOf('_') + 1, filename.indexOf(path.parse(filefull).ext));
        if (filename.match(new RegExp("^[a-z]{1,2}T24M[0-9]{6}_[0-9]*\.zip$", 'i'))) {
          filetype = filename.substring(0, 2).toUpperCase();
          if (filename.match(new RegExp("^HT24M[0-9]{6}_[0-9]*\.zip$", 'i'))) {
            prottype = 'DE'; // костыль для СМП, так как у ежедневных протоколов нет префикса DB/DE
          } else {
            prottype = null; // файл возвращеный ЦОРом при несоответствии файла схеме обмена
          }
        }
        if (filetype.substring(1, 2) == 'T') {
          filetype = filetype.substring(0, 1); // подрезаем тип для фалов не с диспансеризацией и профосмотрами
        }
        var sender = await db.fproc.getSync("SELECT sender.code, sender.num, sender.dir, sender.name FROM filesout LEFT JOIN sender ON sender.code = filesout.sender WHERE filesout.type = ? AND filesout.name_out LIKE ?", [filetype, '%_' + filenum + '.zip']);
        if (!sender) {
          sender = { code: null, name: 'неизвестный отправитель', dir: settings.folder('unknown') }
        }
        if (settings.get('ProcessArchive') && prottype != null && filetype != 'RM') { // дополнительная обработка для архива случаев ОМС
          try {
            await processArchive(filetemp, filetype, prottype);
          } catch(error) {
            fn.eventLog(error, 'Не удалось выполнить обработку processArchive', 'warning', 'processfile.inbox');
          }
        }
        var id_out = await db.fproc.oneSync("SELECT id_out FROM filesout WHERE type = ? AND name_out like ?", [filetype, '%_' + filenum + '.zip']);
        if (prottype == 'DE' || prottype == 'DB' || prottype == 'ER') {
          var filearc = fsys.check(settings.folder('recieved'), filename);
          fsys.copy(filetemp, filearc);
          if (settings.get('ProcessProf') && typedis.includes(filetype)) { // дополнительная обработка для файлов с диспансеризацией и профосмотрами
            try {
              await processProf(filetemp, prottype, id_out, sender.code);
            } catch(error) {
              fn.eventLog(error, 'Не удалось выполнить обработку processProf', 'warning', 'processfile.inbox');
            }
          }
          fsys.move(filetemp, fsys.check(path.join(sender.dir, 'Входящие'), filename));
          fsys.remove(tempdir);
          await db.fproc.runSync("UPDATE filesout SET status = ? WHERE id_out = ?" , ['RE_' + prottype, id_out]);                    
          await db.fproc.runSync("INSERT INTO filesin (name_arc, id_out, name_in, date_in, date_foms, type, prot) VALUES (?, ?, ?, ?, ?, ?, ?)", [path.parse(filearc).base, id_out, filename, fn.dateToStamp(proctime), fn.dateToStamp(filecreate), filetype, prottype]);
          return 'Получен файл ' + filename + ' для ' + sender.name;
        } else if (prottype == 'SM' || prottype == 'IM' || prottype == 'FM' || prottype == 'CR') {
          var reestrdate = filename.substring(filename.indexOf('_') + 1, filename.indexOf('_') + 1 + 4);
          var reestrdir;
          switch (prottype) {
            case 'FM': reestrdir = path.join(settings.folder('final'), reestrdate); break;
            case 'CR': reestrdir = path.join(settings.folder('expert'), reestrdate); break;
            default: reestrdir = path.join(settings.folder('reestr'), reestrdate);
          }
          fsys.create(reestrdir);
          var filearc = fsys.check(settings.folder('recieved'), filename);
          fsys.copy(filetemp, filearc);          
          if (settings.get('ProcessReestr') && (prottype == 'SM' || prottype == 'IM')) { // дополнительная обработка для файлов сводных счетов-реестров
            try {
              await processReestr(filetemp, filetype, prottype, filename, reestrdate, proctime);
            } catch(error) {
              fn.eventLog(error, 'Не удалось выполнить обработку processReestr', 'warning', 'processfile.inbox');
            }
            if (filetype == 'RM') filetype = 'R'; // исправляем тип для внешних услуг
          }
          fsys.move(filetemp, fsys.check(reestrdir, filename));
          await db.fproc.runSync("INSERT INTO filesin (name_arc, id_out, name_in, date_in, date_foms, type, prot) VALUES (?, ?, ?, ?, ?, ?, ?)", [path.parse(filearc).base, 0, filename, fn.dateToStamp(proctime), fn.dateToStamp(filecreate), filetype, prottype]);
          fsys.remove(tempdir);
          return 'Получен реестр ' + filename;
        } else if (prottype == null) {
          var filearc = fsys.check(settings.folder('unknown'), filename);
          fsys.move(filetemp, filearc);
          await db.fproc.runSync("UPDATE filesout SET status = 'RE_ERROR' WHERE id_out = ?", [id_out]);
          await db.fproc.runSync("INSERT INTO filesin (name_arc, id_out, name_in, date_in, date_foms, type) VALUES (?, ?, ?, ?, ?, ?)", [path.parse(filearc).base, id_out, filename, fn.dateToStamp(proctime), fn.dateToStamp(filecreate), filetype]);
          fsys.remove(tempdir);
          return 'Файл ' + filename + ' не прошел валидацию в ЦОР';
        } else {
          fsys.move(filetemp, fsys.check(settings.folder('unknown'), filename));
          fsys.remove(tempdir);
          return 'Получен файл ' + filename + ' неизвестного типа';
        }
      } else {
        fsys.move(filefull, fsys.check(settings.folder('unknown'), filename));
        return 'Файл ' + filename + ' предназначен для МО ' + mocode;
      }
    } else {
      fsys.move(filefull, fsys.check(settings.folder('unknown'), filename));
      return 'Входящий файл ' + filename + ' не соответсвует маске';
    }
  } catch(error) { // ловим все для чего нет отдельных исключений
    fn.eventLog(error, 'Ошибка при обработке входящего файла', 'error', 'processfile.inbox');
    return 'При получении файла ' + path.parse(filefull).base + ' произошла ошибка';
  }
}

var outbox = async (filefull) => { // обработка файлов отправленных випнетом из папки OUTBOX
  var filename = path.parse(filefull).base;
  if (filename.match(new RegExp("^[A-Z]{1,2}M[0-9]{6}T24_[0-9]{10}\.(zip|xml)$"))) {
    var filesend = new Date();
    await db.fproc.runSync("UPDATE filesout SET date_send = ?, status = 'SENDED' WHERE name_out = ?", [fn.dateToStamp(filesend), filename]);
    if (filename.match(new RegExp("^GM[0-9]{6}T24_[0-9]{10}\.xml$"))) {
      var sender = await db.fproc.getSync("SELECT sender.name FROM filesout LEFT JOIN sender ON sender.code = filesout.sender WHERE filesout.name_out = ?", [filename]);
      var datetime = fn.dateToString(filesend, true);
      var message = 'Файл с госпитализациями ' + filename + ' от ' + sender.name + ' был отправлен ' + datetime + '.';
      fn.sendMessage('Отправлен файл с госпитализациями', message, settings.get('NoticeG'));
    }
  } else {
    // некорректный файл забран из OUTBOX
  }
}

var sender = async (filefull, sender) => { // обработка исходящих файлов
  try {
    var file = await fsys.open(filefull);
    if (!file) return 'Превышено время ожидания при отправке файла ' + path.parse(filefull).base;
    var filename = path.parse(filefull).base;
    if (!filename.match(new RegExp("^[a-z]{1,2}M("+fn.padLeft(settings.get('MOfederal'), 6)+"|"+fn.padLeft(settings.get('MOregional'), 6)+")T24_[0-9]*\.(zip|xml)$", 'i'))) {
      return 'Исходящий файл ' + filename + ' не соответсвует маске';
    }
    var proctime = new Date();
    var tempdir = fsys.check(settings.folder('temp'), path.parse(filename).name);
    var filedate = proctime.getFullYear().toString().substring(2) + fn.padLeft(proctime.getMonth() + 1) + fn.padLeft(proctime.getDate());
    var filecreate = fs.statSync(filefull).mtime;
    var fileext = path.parse(filefull).ext.toLowerCase();
    var filenamew = path.parse(filefull).name;
    var filetemp = path.join(tempdir, filename);
    var codemo = filename.substring(filename.toUpperCase().indexOf('M') + 1, filename.toUpperCase().indexOf('M') + 1 + 6);
    fsys.create(tempdir);
    if (!fsys.move(filefull, filetemp)) { // забираем файл во временную папку
      return 'Исходящий файл ' + path.parse(filefull).base + ' занят другим процессом';
    }
    var filearc = fsys.check(settings.folder('archive'), filename);
    fsys.copy(filetemp, filearc); // делаем копию нетронутого файла в папку archive
    var filetype = filename.substring(0, 2).toUpperCase();
    if (filetype.substring(1, 2) == 'M') filetype = filetype.substring(0, 1); // подрезаем тип для файлов не по диспансеризации/профам
    // проверяем, отправляли ли уже сегодня этот файл
    var filessend = await db.fproc.oneSync("SELECT count(name_old) FROM filesout WHERE sender = ? AND type = ? AND name_old = ? AND date_old = ?", [sender.code, filetype, filename, fn.dateToStamp(filecreate)]);
    if (filessend > 0) {
      await db.fproc.runSync("INSERT INTO filesout (status, name_arc, name_old, date_old, sender, type, date_out) VALUES (?, ?, ?, ?, ?, ?, ?)", ['COPY', path.parse(filearc).base, filename, fn.dateToStamp(filecreate), sender.code, filetype, fn.dateToStamp(proctime)]);
      return 'Файл ' + filename + ' уже отправлен';
    }
    // определяем порядковый номер файла данного типа за сегоднящний день
    var filenum = await db.fproc.oneSync("SELECT MAX(CAST(SUBSTR(name_out, 22 , 2) AS INTEGER)) + 1 FROM filesout WHERE name_out like ?", [filetype + 'M' + codemo + 'T24_' + filedate + fn.padLeft(sender.num) + '%']);
    if (filenum == null) filenum = 1;
    var filever = '';
    var pover = '';
    var poname = '';
    var newfilename = 'M' + codemo + 'T24_' + filedate + fn.padLeft(sender.num) + fn.padLeft(filenum);
    var filenamesend = filetype + newfilename + fileext;
    var filexmlold = filenamew.toUpperCase() + '.xml';
    var filexmlnew = filetype + newfilename + '.xml';
    var filexmloldl = 'L' + filenamew.toUpperCase().substring(filetype.length) + '.xml';
    var filexmlnewl = 'L' + newfilename + '.xml';
    if (typexml.includes(filetype)) { // блок для файлов с направлениями/госпитализациями
      if (fileext == '.zip') { // распаковываем, если файл в архиве
        var ziptemp = path.join(path.parse(filetemp).dir, path.parse(filetemp).name);
        fsys.extract(filetemp, ziptemp); // распаковываем архив
        fsys.remove(filetemp); // удаляем исходный архив - он нам больше не нужен
        fsys.move(path.join(ziptemp, filexmlold), path.join(path.parse(filetemp).dir, path.parse(filetemp).name + '.xml')); // перемещаем распакованный файл на место архива
        fsys.remove(ziptemp); // удаляем временную папку
        filetemp = path.join(path.parse(filetemp).dir, path.parse(filetemp).name + '.xml');
        filenamesend = path.parse(filenamesend).name + '.xml';
      }
      var root = await fsys.parse(filetemp); // читаем версию файла и по
      try {
        filever = root.ZL_LIST.ZGLV[0].VERSION[0];
        pover =  root.ZL_LIST.ZGLV[0].VERSION_PO[0];
      } catch(error) {
        fn.eventLog(error, 'Не удалось прочитать версию файла/по', 'warning', 'processfile.sender');
      }
      var tempxml = fsys.read(filetemp);
      fsys.move(filetemp, path.join(tempdir, filenamesend)); // переименовыввем файл
      tempxml = tempxml.replace(filexmlold.substring(0, filexmlold.length - 4), filexmlnew.substring(0, filexmlnew.length - 4)); // заменяем имя файла внутри файла
      fsys.write(path.join(tempdir, filenamesend), tempxml); // сохраняем готовый к отправке файл
      if (settings.get('Validate')) { // проверка на соответствие схеме обмена
        if (await fn.validate(path.join(tempdir, filenamesend), path.join(settings.folder('schemas'), filetype == 'G' ? 'Hospital6.xsd' : 'Polyclinic6.xsd'), sender, settings.get('NoticeValidation'))) {
          await db.fproc.runSync("INSERT INTO filesout (status, name_arc, name_old, date_old, soft_name, soft_ver, xml_ver, sender, type, date_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", ['INVALID', path.parse(filearc).base, filename, fn.dateToStamp(filecreate), poname, pover, filever, sender.code, filetype, fn.dateToStamp(proctime)]);
          return 'Файл ' + path.parse(filefull).base + ' не соответствует схеме обмена';
        }
      }   
    } else { // блок для всех остальных файлов (кроме направлений и госпитализаций)
      var ziptemp = path.join(path.parse(filetemp).dir, path.parse(filetemp).name);
      fsys.extract(filetemp, ziptemp); // распаковываем архив
      fsys.remove(filetemp); // удаляем исходный архив - он нам больше не нужен
      // обрабатывваем XML-файл с персональными данными (переименовываем, заменяем имена файлов внутри файла, сохраняем
      fsys.move(path.join(ziptemp, filexmloldl), path.join(ziptemp, filexmlnewl));
      var tempxmll = fsys.read(path.join(ziptemp, filexmlnewl));
      tempxmll = tempxmll.replace(filexmlold.substring(0, filexmlold.length - 4), filexmlnew.substring(0, filexmlnew.length - 4));
      tempxmll = tempxmll.replace(filexmloldl.substring(0, filexmloldl.length - 4), filexmlnewl.substring(0, filexmlnewl.length - 4));
      fsys.write(path.join(ziptemp, filexmlnewl), tempxmll);
      // обрабатывваем XML-файл с медицинскими данными
      fsys.move(path.join(ziptemp, filexmlold), path.join(ziptemp, filexmlnew));
      var tempxml = fsys.read(path.join(ziptemp, filexmlnew));
      tempxml = tempxml.replace(filexmlold.substring(0, filexmlold.length - 4), filexmlnew.substring(0, filexmlnew.length - 4));
      tempxml = tempxml.replace(filexmloldl.substring(0, filexmloldl.length - 4), filexmlnewl.substring(0, filexmlnewl.length - 4));
      var root = await fsys.parse(path.join(ziptemp, filexmlnew)); // читаем версию файла и по
      if (filetype != 'H') {
        try{
          filever = root.ZL_LIST.$.VERSION;
          poname = root.ZL_LIST.$.PONAME
          pover = root.ZL_LIST.$.POVER;
        } catch(error) {
          fn.eventLog(error, 'Не удалось прочитать версию файла/по', 'warning', 'processfile.sender');
        }
      } else {
        try {
          filever = root.ZL_LIST.ZGLV[0].VERSION[0];
          poname = root.ZL_LIST.ZGLV[0].PONAME[0];
          pover = root.ZL_LIST.ZGLV[0].POVER[0];
        } catch(error) {
          fn.eventLog(error, 'Не удалось прочитать версию файла/по', 'warning', 'processfile.sender');
        }
      }
      fsys.write(path.join(ziptemp, filexmlnew), tempxml);
      if (settings.get('Validate')) { // проверка на соответствие схеме обмена
        var invalid = false;
        if (filetype == 'H') {
          if (await fn.validate(path.join(ziptemp, filexmlnew), path.join(settings.folder('schemas'), 'smp.xsd'), sender, settings.get('NoticeValidation')) || await fn.validate(path.join(ziptemp, filexmlnewl), path.join(settings.folder('schemas'), 'SMP_Person.xsd'), sender, settings.get('NoticeValidation'))) { invalid = true; }
        } else {
          if (typedis.includes(filetype)) {
            if (await fn.validate(path.join(ziptemp, filexmlnew), path.join(settings.folder('schemas'), 'DD_Med.xsd'), sender, settings.get('NoticeValidation')) || await fn.validate(path.join(ziptemp, filexmlnewl), path.join(settings.folder('schemas'), 'DD_Person.xsd'), sender, settings.get('NoticeValidation'))) { invalid = true; }
          } else {
            if (await fn.validate(path.join(ziptemp, filexmlnew), path.join(settings.folder('schemas'), 'List.xsd'), sender, settings.get('NoticeValidation')) || await fn.validate(path.join(ziptemp, filexmlnewl), path.join(settings.folder('schemas'), 'Person.xsd'), sender, settings.get('NoticeValidation'))) { invalid = true; }
          }
        }
        if (invalid) {
          // fsys.clear(ziptemp);
          // fsys.remove(ziptemp); // удаляем папку с распакованными XML-файлами, для аккуратности
          await db.fproc.runSync("INSERT INTO filesout (status, name_arc, name_old, date_old, soft_name, soft_ver, xml_ver, sender, type, date_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", ['INVALID', path.parse(filearc).base, filename, fn.dateToStamp(filecreate), poname, pover, filever, sender.code, filetype, fn.dateToStamp(proctime)]);
          return 'Файл ' + path.parse(filefull).base + ' не соответствует схеме обмена';
        }
      }
      fsys.compress(ziptemp, path.join(tempdir, filenamesend)); // запаковываем файлы в архив
      fsys.clear(ziptemp);
      fsys.remove(ziptemp); // удаляем временную папку
    }
    // отдаем файл випнету
    if (!fs.existsSync(path.join(settings.get('DirViPNet'), 'Исходящие', filenamesend))) {
      if (settings.get('ProcessArchive') && !typexml.includes(filetype)) { // дополнительная обработка для архива случаев ОМС
        try {
          await processArchive(path.join(tempdir, filenamesend), filetype);
        } catch(error) {
          fn.eventLog(error, 'Не удалось выполнить обработку processArchive', 'warning', 'processfile.sender');
        }
      }
      fsys.copy(path.join(tempdir, filenamesend), fsys.check(settings.folder('sended'), filenamesend)); // копируем итоговый файл в папку sended
      fsys.move(path.join(tempdir, filenamesend), path.join(settings.get('DirViPNet'), 'Исходящие', filenamesend)); // перемещаем в папку OUTBOX для випнета
      fsys.remove(tempdir); // удаляем временную папку
      poname = poname.split('\'').join('\'\'');
      pover = pover.split('\'').join('\'\'');
      filever = filever.split('\'').join('\'\'');
      await db.fproc.runSync("INSERT INTO filesout (status, name_arc, name_old, date_old, soft_name, soft_ver, xml_ver, sender, type, name_out, date_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", ['NEW', path.parse(filearc).base, filename, fn.dateToStamp(filecreate), poname, pover, filever, sender.code, filetype, filenamesend, fn.dateToStamp(proctime)]);
      return 'Отправлен файл ' + filenamesend + ' от ' + sender.name;
    } else { // такой исход крайне маловероятен, может возникнуть при некоректном определении порядкового номера для файла
      return 'Файл ' + filenamesend + ' уже находится в OUTBOX';
    }
  } catch(error) { // ловим все для чего нет отдельных исключений
    fn.eventLog(error, 'Ошибка при обработке исходящего файла', 'error', 'processfile.sender');
    return 'При отправке файла ' + path.parse(filefull).base + ' произошла ошибка';
  }
}

module.exports = {
  inbox,
  outbox,
  sender,
};
