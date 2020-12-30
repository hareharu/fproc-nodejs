var fs = require('fs');
var db = require('./database');
var settings = require('./settings');
var iconv = require('iconv-lite');
var aes = require('crypto-js/aes');
var utf8 = require('crypto-js/enc-utf8');

var dateToString = (date, withtime = false) => { // возвращает дату в виде строки
  var string = padLeft(date.getDate()) + '.' + padLeft(date.getMonth() + 1) + '.' + date.getFullYear()
  if (withtime) string += ' ' + padLeft(date.getHours()) + ':' + padLeft(date.getMinutes()) + ':' + padLeft(date.getSeconds());
  return string;
}

var dateToStamp = (date) => { // возвращает дату в виде штампа времени
  return date.getFullYear() + '-' + padLeft(date.getMonth() + 1) + '-' + padLeft(date.getDate()) + 'T' + padLeft(date.getHours()) + ':' + padLeft(date.getMinutes()) + ':' + padLeft(date.getSeconds()) + '.' + padLeft(date.getMilliseconds(), 3) + (date.getTimezoneOffset() < 0 ? '+' : '-') + padLeft(Math.floor(Math.abs(date.getTimezoneOffset()) / 60)) + ':' + padLeft(Math.abs(date.getTimezoneOffset()) % 60);
}

var getDates = () => { // возвращает объект с датами для использования в веб-интерфейсе
  var dates = {};
  var day = new Date();
  dates.today = dateToStamp(day).substring(0, 10);
  day.setDate(day.getDate() - 1);
  dates.yesterday = dateToStamp(day).substring(0, 10);
  day.setDate(day.getDate() - 6);
  dates.lastweek = dateToStamp(day).substring(0, 10);
  return dates;
}

var timestamp = () => { // штамп времени
  var ts = require('timestamp-zoned');
  return ts.getTimestamp();
}

var encrypt = (string) => { // шифрование строки
  if (!process.env.CRYPTOKEY) {
    eventLog('Пароль для SMTP не будет сохранен так как в файле конфигурации не задан параметр CRYPTOKEY', 'Ключ шифрования не задан', 'warning', 'functions.encrypt');
    return '';
  }
  if (string.length == 0) return string;
  return aes.encrypt(string, process.env.CRYPTOKEY).toString();
}

var decrypt = (string) => { // расшифровка строки
  if (string.length == 0) return string;
  return aes.decrypt(string, process.env.CRYPTOKEY || '').toString(utf8);
}

var padLeft = (number, length = 2, symbol = '0') => { // добивание строки нулями до указанной длины
  var output = number.toString();
  while (output.length < length) output = symbol + output; 
  return output;
}

var validate = async (fullpath, schema, sender, notify) => { // сверка XML-файла по схеме, возвращает true если обнаружена ошибка
  var javac = process.env.JAVA_HOME ? process.env.JAVA_HOME + '/bin/javac' : 'javac';
  if (process.env.JAVA_HOME && !fs.existsSync(javac) && !fs.existsSync(javac + '.exe')) {
    eventLog('Валидация невозможна так как в системе отсутствует JDK или не задан параметр JAVA_HOME', 'Не удалось обнаружить JDK', 'warning', 'functions.validate');
    return false;
  }
  var message = '';
  if (fs.existsSync(schema)) {
    var xml = fs.readFileSync(fullpath);
    xml = iconv.decode(xml, 'win1251');
    xml = iconv.encode(xml, 'ascii');
    var validator = require('xsd-schema-validator');
    return new Promise(resolve => {
      validator.validateXML(xml, schema, (error, result) => {
        if (!result.valid) {
          result.messages.forEach(msg => message += msg + '\r\n');
          var messagetext = 'При проверке файла "' + fullpath + '" от ' + sender.name + ' на соответствие схеме обмена обнаружены ошибки:\r\n\r\n' + message;
          eventLog(messagetext, 'Файл не прошел валидацию', 'warning', 'functions.validate');
          sendMessage('Файл не прошел валидацию', messagetext, notify);
        }
        resolve(!result.valid);
      });
    });
  } else {
    eventLog('Валидация невозможна так как отсутствует файл схемы "' + schema + '"', 'Отсутсвует XSD-схема', 'warning', 'functions.validate');
    return false;
  }
}

var sendMessage = (subject, message, sendtoall = false, sendtofinance = false) => { // отправка уведомления по электронной почте
  if (settings.get('SendMail')) {
    var nodemailer = require('nodemailer');
    var options = {
      host: settings.get('SMTPserver'),
      port: settings.get('SMTPport'),
      secure: settings.get('SMTPuseTLS'),
    }
    if (settings.get('SMTPuseLogin')) {
      options.auth = {
        user: settings.get('SMTPlogin'),
        pass: fn.decrypt(settings.get('SMTPpassword')),
      }
    }
    var transporter = nodemailer.createTransport(options);
    var recipients = settings.get('SMTPrecipientMain');
    if (sendtoall) {
      if (settings.get('SMTPrecipients').length > 0) {
        recipients += ',' + settings.get('SMTPrecipients');
      }
    }
    if (sendtofinance){
      if (settings.get('SMTPrecipientFinance'). length > 0) {
        recipients += ',' + settings.get('SMTPrecipientFinance');
      }
    }
    var mailOptions = {
      from: 'Обработчик реестров <' + settings.get('SMTPsender') + '>',
      to: recipients,
      subject: subject,
      text: message
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) eventLog(error, 'Не удалось отправить сообщение', 'warning', 'functions.sendMessage');
    });
  }
}

var eventLog = (details, message = 'Во время работы приложения произошла ошибка', event = 'error', funcname = null) => { // регистрация события в журнале
  if (process.env.NODE_ENV != 'production') console.log(details);
  if (details.stack != undefined) details = details.stack
  try {
    db.fproc.run("INSERT INTO log (stamp, message, event, details, funcname) VALUES (?, ?, ?, ?, ?)", [timestamp(), message, event.toUpperCase(), details, funcname]);
  } catch {
    var filename = 'error_' + timestamp().substring(0, 23).split(':').join('.').split('.').join('-') + '.txt';
    fs.appendFile(filename, details, (error) => { if (error) throw error });
  }
  if (event == 'error') sendMessage(message, details, settings.get('NoticeError'));
  if (event == 'process') fs.appendFile('fproc.log', dateToString(new Date(), true)+' '+ details + '\r\n', (error) => { if (error) throw error });
}

module.exports = {
  dateToString,
  dateToStamp,
  getDates,
  timestamp,
  encrypt,
  decrypt,
  padLeft,
  validate,
  sendMessage,
  eventLog,
};
