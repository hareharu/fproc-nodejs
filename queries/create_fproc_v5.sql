BEGIN TRANSACTION;
CREATE TABLE "type" (
	"code"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"name"	TEXT,
	"full"	TEXT,
	"short"	TEXT,
	"reestr"	TEXT
);
INSERT INTO "type" ("code","name","full","short","reestr") VALUES ('V','Поликлиника','Амбулаторно-поликлиническая помощь','Поликлиника','амбулаторно-поликлинической помощи');
INSERT INTO "type" ("code","name","full","short","reestr") VALUES ('R','Стационар','Услуги стационаров круглосуточного и дневного пребывания','Стационар','услуг стационаров круглосуточного и дневного пребывания');
INSERT INTO "type" ("code","name","full","short","reestr") VALUES ('DV','Диспансеризация взрослых','Диспансеризация взрослого населения','Дисп. взрослых','диспансеризации взрослого населения');
INSERT INTO "type" ("code","name","full","short","reestr") VALUES ('DS','Диспансеризация сирот','Диспансеризация детей-сирот','Дисп. детей','диспансеризации детей-сирот');
INSERT INTO "type" ("code","name","full","short","reestr") VALUES ('PV','Профосмотры взрослых','Профилактические осмотры взрослых','Проф. взрослых','профилактических осмотров взрослых');
INSERT INTO "type" ("code","name","full","short","reestr") VALUES ('PD','Профосмотры детей','Медицинские осмотры несовершеннолетних','Проф. детей','медицинских осмотров несовершеннолетних');
INSERT INTO "type" ("code","name","full","short","reestr") VALUES ('H','Скорая помощь','Вызова скорой медицинской помощи','Скорая помощь','вызовов скорой медицинской помощи');
INSERT INTO "type" ("code","name","full","short","reestr") VALUES ('N','Направления','Направления на госпитализацию для ЕИР','Направления','');
INSERT INTO "type" ("code","name","full","short","reestr") VALUES ('G','Госпитализации','Информация о движении пациентов стационара для ЕИР','Госпитализации','');
CREATE UNIQUE INDEX "TYPE_CODE" ON "type" ("code");
CREATE TABLE "settings" (
	"name"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"value"	TEXT
);
CREATE UNIQUE INDEX "SETTINGS_NAME" ON "settings" ("name");
CREATE TABLE "sender" (
	"code"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"num"	INTEGER,
	"dept"	TEXT,
	"name"	TEXT,
	"dir"	TEXT,
	"types"	TEXT,
	"status"	INTEGER
);
CREATE UNIQUE INDEX "SENDER_CODE" ON "sender" ("code");
CREATE INDEX "SENDER_NUM" ON "sender" ("num");
CREATE TABLE "protocol" (
	"code"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"name"	TEXT,
	"full"	TEXT
);
INSERT INTO "protocol" ("code","name","full") VALUES ('DB','Предварительный','Ежедневный ответ от ТФОМС при ПАК (предварительный)');
INSERT INTO "protocol" ("code","name","full") VALUES ('DE','Окончательный','Ежедневный ответ от ТФОМС при ПАК (окончательный)');
INSERT INTO "protocol" ("code","name","full") VALUES ('SM','Сводный','Сводный ежемесячный по застрахованным в крае');
INSERT INTO "protocol" ("code","name","full") VALUES ('IM','Сводный (Инокраевые)','Сводный ежемесячный по инокраевым');
INSERT INTO "protocol" ("code","name","full") VALUES ('FM','Финальный','Окончательный (финальный) ежемесячный с результатами МЭК от СМО');
INSERT INTO "protocol" ("code","name","full") VALUES ('ER','Отказы','Дополнительные отказы');
INSERT INTO "protocol" ("code","name","full") VALUES ('CR','Экспертиза','Сведения о проведенных экспертизах (а также о случаях снятия с оплаты по письмам МО)');
CREATE UNIQUE INDEX "PROTOCOL_CODE" ON "protocol" ("code");
CREATE TABLE "status" (
	"code"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"name"	TEXT,
	"full"	TEXT,
	"color"	TEXT
);
INSERT INTO "status" ("code","name","full","color") VALUES ('NEW','Ожидает отправки','Файл обработан и перемещен в папку для отправки','yellow');
INSERT INTO "status" ("code","name","full","color") VALUES ('COPY','Файл был отправлен ранее','Данный файл уже отправлялся ранее тем же отправителем','red');
INSERT INTO "status" ("code","name","full","color") VALUES ('INVALID','Ошибка при валидации','Файл не прошел проверку на соответствие схеме обмена','red');
INSERT INTO "status" ("code","name","full","color") VALUES ('SENDED','Отправлен в ТФОМС','Файл отправлен в ТФОМС через ViPNet','yellow');
INSERT INTO "status" ("code","name","full","color") VALUES ('RE_DB','Предварительный протокол','Получен предварительный протокол из ЦОР','blue');
INSERT INTO "status" ("code","name","full","color") VALUES ('RE_DE','Окончательный протокол','Получен окончательный протокол из ЦОР','');
INSERT INTO "status" ("code","name","full","color") VALUES ('RE_ER','Дополнительный протокол','Получен протокол с дополнительными отказами','');
INSERT INTO "status" ("code","name","full","color") VALUES ('RE_ERROR','Ошибка обработки в ЦОР','Произошла ошибка во время обработки файла в ЦОР','red');
INSERT INTO "status" ("code","name","full","color") VALUES ('ERROR','Ошибка обработки файла','Произошла ошибка во время обработки файла','red');
INSERT INTO "status" ("code","name","full","color") VALUES ('WRONG','Некорректный файл','Файл не соответствует формату и не будет обработан','red');
CREATE UNIQUE INDEX "STATUS_CODE" ON "status" ("code");
CREATE TABLE "event" (
	"code"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"name"	TEXT,
	"full"	TEXT,
	"color"	TEXT
);
INSERT INTO "event" ("code","name","full","color") VALUES ('ERROR','Ошибка','Критическая ошибка при обработке файла','red');
INSERT INTO "event" ("code","name","full","color") VALUES ('WARNING','Предупреждение','Ошибка в дополнительной обработке','yellow');
INSERT INTO "event" ("code","name","full","color") VALUES ('PROCESS','Обработка','Результат выполнения обработки файла','');
INSERT INTO "event" ("code","name","full","color") VALUES ('SYSTEM','Система','Системное событие','blue');
CREATE UNIQUE INDEX "EVENT_CODE" ON "event" ("code");
CREATE TABLE "log" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"stamp"	TEXT,
	"event"	TEXT,
	"message"	TEXT,
	"details"	TEXT,
	"funcname" TEXT
);
CREATE UNIQUE INDEX "LOG_ID" ON "log" ("id");
CREATE INDEX "LOG_EVENT" ON "log" ("event");
CREATE TABLE "filesout" (
	"id_out"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"name_old"	TEXT,
	"date_old"	TEXT,
	"name_arc"	TEXT,
	"soft_name"	TEXT,
	"soft_ver"	TEXT,
	"xml_ver"	TEXT,
	"sender"	TEXT,
	"type"	TEXT,
	"name_out"	TEXT,
	"date_out"	TEXT,
	"date_send"	TEXT,
	"status"	TEXT
);
CREATE UNIQUE INDEX "FILESOUT_ID_OUT" ON "filesout" ("id_out");
CREATE INDEX "FILESOUT_TYPE" ON "filesout" ("type");
CREATE INDEX "FILESOUT_STATUS" ON "filesout" ("status");
CREATE INDEX "FILESOUT_SENDER" ON "filesout" ("sender");
CREATE INDEX "FILESOUT_DATE_OUT" ON "filesout" ("date_out");
CREATE TABLE "filesin" (
	"id_in"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"id_out"	INTEGER,
	"name_in"	TEXT,
	"date_in"	TEXT,
	"date_foms"	TEXT,
	"name_arc"	TEXT,
	"type"	TEXT,
	"prot"	TEXT
);
CREATE UNIQUE INDEX "FILESIN_ID_IN" ON "filesin" ("id_in");
CREATE INDEX "FILESIN_TYPE" ON "filesin" ("type");
CREATE INDEX "FILESIN_PROT" ON "filesin" ("prot");
CREATE INDEX "FILESIN_ID_OUT" ON "filesin" ("id_out");
CREATE TABLE "exam" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"id_out"	INTEGER,
	"year"	INTEGER,
	"month"	INTEGER,
	"sender"	TEXT,
	"note"	TEXT,
	"dv220f"	INTEGER,
	"dv220s"	INTEGER,
	"dv325f"	INTEGER,
	"dv325s"	INTEGER,
	"ds035f"	INTEGER,
	"ds035s"	INTEGER,
	"ds223f"	INTEGER,
	"ds223s"	INTEGER,
	"pv230f"	INTEGER,
	"pv230s"	INTEGER,
	"pd231f"	INTEGER,
	"pd231s"	INTEGER,
	"pd232f"	INTEGER,
	"pd232s"	INTEGER,
	"pd233f"	INTEGER,
	"pd233s"	INTEGER
);
CREATE UNIQUE INDEX "EXAM_ID" ON "exam" ("id");
CREATE INDEX "EXAM_SENDER" ON "exam" ("sender");
CREATE INDEX "EXAM_YEAR" ON "exam" ("year");
CREATE INDEX "EXAM_MONTH" ON "exam" ("month");
INSERT INTO "settings" ("name","value") VALUES ('VerDB', '5');
COMMIT;
