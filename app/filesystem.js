var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var iconv = require('iconv-lite');
var admZip = require('adm-zip');

var copy = (fullpathfrom, fullpathto) => { // копирование файла
  fs.copyFileSync(fullpathfrom, fullpathto);
  return true;
}

var move = (fullpathfrom, fullpathto) => { // перемещение файла
  fs.copyFileSync(fullpathfrom, fullpathto);
  fs.unlinkSync(fullpathfrom);
  return true;
}

var remove = (fullpath) => { // удаление файла или папки
  if (fs.lstatSync(fullpath).isDirectory()) {
    fs.rmdirSync(fullpath);
  } else {
    fs.unlinkSync(fullpath);
  }
}

var clear = (fullpath) => { // удаление всех файлов из папки
  var files = fs.readdirSync(fullpath);
  var allfiles = true;
  files.forEach( file => {
    if (fs.lstatSync(path.join(fullpath, file)).isDirectory()) allfiles = false;
  });
  if (allfiles) files.forEach( file => fs.unlinkSync(path.join(fullpath, file)));
}

var create = (fullpath) => { // создание папки, если она не существует
  if (!fs.existsSync(fullpath)) {
    fs.mkdirSync(fullpath);
  }
}

var extract = (fullpathfrom, fullpathto) => { // распаковка zip-архива
  var zip = new admZip(fullpathfrom);
  zip.getEntries().forEach(entry => {
    entry.entryName = iconv.decode(entry.rawEntryName, 'cp866');
  })
  zip.extractAllTo(fullpathto, true);
}

var compress = (fullpathfrom, fullpathto) => { // укаковка zip-архива
  var zip = new admZip();
  var files = fs.readdirSync(fullpathfrom);
  files.forEach( file => {
    if (!fs.lstatSync(path.join(fullpathfrom, file)).isDirectory()) zip.addLocalFile(path.join(fullpathfrom, file));
  });
  zip.writeZip(fullpathto);
}

var check = (folder, name) => { // проверка имени; возвращает имя либо имя с добавлением _Х, если такой файл/папка уже существует
  var isfolder = path.parse(name).ext.length != 4; // жуткий костыль - стыд-стыд
  var count = 1;
  var newname = path.join(folder, name);
  while (fs.existsSync(newname)) {
    if (isfolder) {
      newname = path.join(folder, name + "_" + count);
    } else {
      newname = path.join(folder, path.parse(name).name + "_" + count + path.parse(name).ext);
    }
    count += 1;
  }
  return newname;
}

var parse = (fullpath) => { // парсинг xml-файла в js-объект
  var parser = new xml2js.Parser({ /*explicitArray: false*/ });
  var string = fs.readFileSync(fullpath);
  string = iconv.decode(string, 'win1251');
  return new Promise((resolve, reject) => {
    parser.parseString(string, (error, result) => {
      if (error) {
        reject(error);
      } else {
        // console.dir(result);
        resolve(result);
      }
    });
  });
}

var sleep = (seconds = 1) => { // пауза на указанное количество секунд
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

var open = async (fullpath, timeout = 60) => { // попытка открыть файл; возвращает false если не удается получить доступ к файлу за указанное время
  timeout = timeout * 1000;
  var startTime = (new Date()).getTime();
  var result = null;
  return new Promise(async resolve => {
    while (result == null) {
      try {
        var fd = fs.openSync(fullpath, 'r+');
        fs.closeSync(fd);
        result = true;
      } catch(error) {
        // console.log('#####', error.code, fullpath);
        if (error.code === 'ENOENT') result = false;
        var elapsedTime = (new Date()).getTime() - startTime;
        if (elapsedTime > timeout) result = false;
      }
      await sleep();
    }
    resolve(result);
  });
}

var read = (fullpath) => { // чтение содержимого файла в строку
  var content = fs.readFileSync(fullpath);
  return iconv.decode(content, 'win1251');
}

var write = (fullpath, string) => { // запись строки в файл
  var content = iconv.encode(string, 'win1251');
  fs.writeFileSync(fullpath, content);
}

module.exports = {
  copy,
  move,
  remove,
  clear,
  create,
  extract,
  compress,
  check,
  parse,
  open,
  read,
  write,
};
