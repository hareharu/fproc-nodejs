BEGIN TRANSACTION;
ALTER TABLE "type" RENAME TO "_type";
CREATE TABLE "type" (
	"code"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"name"	TEXT,
	"full"	TEXT,
	"short"	TEXT,
	"reestr"	TEXT
);
INSERT INTO "type" ("code", "name", "full", "short", "reestr")
	SELECT "code", "name", "full", '', ''
	FROM "_type";
DROP TABLE "_type";
UPDATE "type" SET "short" = 'Поликлиника', "reestr" = 'амбулаторно-поликлинической помощи' WHERE "code" = 'V';
UPDATE "type" SET "short" = 'Стационар', "reestr" = 'услуг стационаров круглосуточного и дневного пребывания' WHERE "code" = 'R';
UPDATE "type" SET "short" = 'Дисп. взрослых', "reestr" = 'диспансеризации взрослого населения' WHERE "code" = 'DV';
UPDATE "type" SET "short" = 'Дисп. детей', "reestr" = 'диспансеризации детей-сирот' WHERE "code" = 'DS';
UPDATE "type" SET "short" = 'Проф. взрослых', "reestr" = 'профилактических осмотров взрослых' WHERE "code" = 'PV';
UPDATE "type" SET "short" = 'Проф. детей', "reestr" = 'медицинских осмотров несовершеннолетних' WHERE "code" = 'PD';
UPDATE "type" SET "short" = 'Скорая помощь', "reestr" = 'вызовов скорой медицинской помощи' WHERE "code" = 'H';
UPDATE "type" SET "short" = 'Направления' WHERE "code" = 'N';
UPDATE "type" SET "short" = 'Госпитализации' WHERE "code" = 'G';
CREATE UNIQUE INDEX "TYPE_CODE" ON "type" ("code");
ALTER TABLE "settings" RENAME TO "_settings";
CREATE TABLE "settings" (
	"name"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"value"	TEXT
);
INSERT INTO "settings" ("name", "value")
	SELECT "name", "value"
	FROM "_settings";
DROP TABLE "_settings";
CREATE UNIQUE INDEX "SETTINGS_NAME" ON "settings" ("name");
ALTER TABLE "sender" RENAME TO "_sender";
CREATE TABLE "sender" (
	"code"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"num"	INTEGER,
	"dept"	TEXT,
	"name"	TEXT,
	"dir"	TEXT,
	"types"	TEXT,
	"status"	INTEGER
);
INSERT INTO "sender" ("code", "num", "dept", "name", "dir", "types", "status")
	SELECT 'SENDER'||"id", "code", "dept", "name", "dir", "types", 1
	FROM "_sender";
DROP TABLE "_sender";
CREATE UNIQUE INDEX "SENDER_CODE" ON "sender" ("code");
CREATE INDEX "SENDER_NUM" ON "sender" ("num");
ALTER TABLE "protocol" RENAME TO "_protocol";
CREATE TABLE "protocol" (
	"code"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"name"	TEXT,
	"full"	TEXT
);
INSERT INTO "protocol" ("code", "name", "full")
	SELECT "code", "name", "full"
	FROM "_protocol";
DROP TABLE "_protocol";
CREATE UNIQUE INDEX "PROTOCOL_CODE" ON "protocol" ("code");
ALTER TABLE "status" RENAME TO "_status";
CREATE TABLE "status" (
	"code"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"name"	TEXT,
	"full"	TEXT,
	"color"	TEXT
);
INSERT INTO "status" ("code", "name", "full", "color")
	SELECT "code", "name", "full", ''
	FROM "_status";
DROP TABLE "_status";
UPDATE "status" SET "color" = 'blue' WHERE "code" = 'RE_DB';
UPDATE "status" SET "color" = 'yellow' WHERE "code" in ('NEW','SENDED');
UPDATE "status" SET "color" = 'red' WHERE "code" in ('COPY','INVALID','RE_ERROR','ERROR');
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
ALTER TABLE "filesout" RENAME TO "_filesout";
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
INSERT INTO "filesout" ("id_out", "name_old", "date_old", "name_arc", "soft_name", "soft_ver", "xml_ver", "sender", "type", "name_out", "date_out", "date_send", "status")
	SELECT "id_out", "name_old", "date_old", "name_arc", "soft_name", "soft_ver", "xml_ver", "sender", "type", "name_out", "date_out", "date_send", "status"
	FROM "_filesout";
DROP TABLE "_filesout";
CREATE UNIQUE INDEX "FILESOUT_ID_OUT" ON "filesout" ("id_out");
CREATE INDEX "FILESOUT_TYPE" ON "filesout" ("type");
CREATE INDEX "FILESOUT_STATUS" ON "filesout" ("status");
CREATE INDEX "FILESOUT_SENDER" ON "filesout" ("sender");
CREATE INDEX "FILESOUT_DATE_OUT" ON "filesout" ("date_out");
ALTER TABLE "filesin" RENAME TO "_filesin";
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
INSERT INTO "filesin" ("id_in", "id_out", "name_in", "date_in", "date_foms", "name_arc", "type", "prot")
	SELECT "id_in", "id_out", "name_in", NULL, "date_in", "name_arc", "type", "prot"
	FROM "_filesin";
DROP TABLE "_filesin";
CREATE UNIQUE INDEX "FILESIN_ID_IN" ON "filesin" ("id_in");
CREATE INDEX "FILESIN_TYPE" ON "filesin" ("type");
CREATE INDEX "FILESIN_PROT" ON "filesin" ("prot");
CREATE INDEX "FILESIN_ID_OUT" ON "filesin" ("id_out");
ALTER TABLE "exam" RENAME TO "_exam";
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
INSERT INTO "exam" ("id", "id_out", "year", "month", "sender", "note", "dv220f", "dv220s", "dv325f", "dv325s", "ds035f", "ds035s", "ds223f", "ds223s", "pv230f", "pv230s", "pd231f", "pd231s", "pd232f", "pd232s", "pd233f", "pd233s")
	SELECT "id", "id_out", "year", "month", "sender", "note", "dv220f", "dv220s", "dv325f", "dv325s", "ds035f", "ds035s", "ds223f", "ds223s", "pv230f", "pv230s", "pd231f", "pd231s", "pd232f", "pd232s", "pd233f", "pd233s"
	FROM "_exam";
DROP TABLE "_exam";
CREATE UNIQUE INDEX "EXAM_ID" ON "exam" ("id");
CREATE INDEX "EXAM_SENDER" ON "exam" ("sender");
CREATE INDEX "EXAM_YEAR" ON "exam" ("year");
CREATE INDEX "EXAM_MONTH" ON "exam" ("month");
UPDATE "filesin" SET "id_out" = NULL WHERE "id_out" = '0';
UPDATE "exam" SET "id_out" = NULL WHERE "id_out" = '0';
UPDATE "filesout" SET "sender" = (SELECT "code" FROM "sender" WHERE "num" = "sender");
UPDATE "exam" SET "sender" = (SELECT "code" FROM "sender" WHERE "num" = "sender");
UPDATE "filesout" SET "date_old" = SUBSTR("date_old",1,10)||'T'||SUBSTR("date_old",12,8)||'.000+07:00' WHERE "date_old" IS NOT NULL;
UPDATE "filesout" SET "date_out" = SUBSTR("date_out",1,10)||'T'||SUBSTR("date_out",12,8)||'.000+07:00' WHERE "date_out" IS NOT NULL;
UPDATE "filesout" SET "date_send" = SUBSTR("date_send",1,10)||'T'||SUBSTR("date_send",12,8)||'.000+07:00' WHERE "date_send" IS NOT NULL;
UPDATE "filesin" SET "date_in" = SUBSTR("date_in",1,10)||'T'||SUBSTR("date_in",12,8)||'.000+07:00' WHERE "date_in" IS NOT NULL;
UPDATE "filesin" SET "date_foms" = SUBSTR("date_foms",1,10)||'T'||SUBSTR("date_foms",12,8)||'.000+07:00' WHERE "date_foms" IS NOT NULL;
UPDATE "settings" SET "value" = '1' WHERE UPPER("value") = 'TRUE';
UPDATE "settings" SET "value" = '0' WHERE UPPER("value") = 'FALSE';
UPDATE "settings" SET "name" = 'SMTPuseTLS' WHERE "name" = 'SMTPuseSSL';
UPDATE "settings" SET "value" = '5' WHERE "name" = 'VerDB';
COMMIT;
