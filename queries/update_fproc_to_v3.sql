BEGIN TRANSACTION;
CREATE TABLE "status" (
	"id"		INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"code"		TEXT,
	"name"		TEXT,
	"full"		TEXT
);
INSERT INTO "status" ("code","name","full") VALUES ('NEW','Ожидает отправки','Файл обработан и перемещен в папку для отправки');
INSERT INTO "status" ("code","name","full") VALUES ('COPY','Файл был отправлен ранее','Данный файл уже отправлялся ранее тем же отправителем');
INSERT INTO "status" ("code","name","full") VALUES ('INVALID','Ошибка при валидации','Файл не прошел проверку на соответствие схеме обмена');
INSERT INTO "status" ("code","name","full") VALUES ('SENDED','Отправлен в ЦОР','Файл отправлен в ЦОР через ViPNet');
INSERT INTO "status" ("code","name","full") VALUES ('RE_DB','Предварительный протокол','Получен предварительный протокол из ЦОР');
INSERT INTO "status" ("code","name","full") VALUES ('RE_DE','Окончательный протокол','Получен окончательный протокол из ЦОР');
INSERT INTO "status" ("code","name","full") VALUES ('RE_ER','Дополнительный протокол','Получен протокол с дополнительными отказами');
INSERT INTO "status" ("code","name","full") VALUES ('RE_ERROR','Ошибка обработки в ЦОР','Произошла ошибка во время обработки файла в ЦОР');
INSERT INTO "status" ("code","name","full") VALUES ('ERROR','Ошибка обработки файла','Произошла ошибка во время обработки файла');
CREATE UNIQUE INDEX "STATUS_ID" ON "status" ("id");
CREATE INDEX "STATUS_CODE" ON "status" ("code");
ALTER TABLE "filesout" ADD "status"	TEXT;
CREATE INDEX "FILESOUT_STATUS" ON "filesout" ("status");
UPDATE "filesin" SET "prot" = 'DE' WHERE "prot" = 'H';
UPDATE "filesout" SET "status" = 'NEW';
UPDATE "filesout" SET "status" = 'SENDED' WHERE "date_send" IS NOT NULL;
UPDATE "filesout" SET "status" = 'RE_DB' WHERE EXISTS (SELECT * FROM "filesin" WHERE filesin.prot = 'DB' AND filesin.id_out = filesout.id_out);
UPDATE "filesout" SET "status" = 'RE_DE' WHERE EXISTS (SELECT * FROM "filesin" WHERE filesin.prot = 'DE' AND filesin.id_out = filesout.id_out);
UPDATE "filesout" SET "status" = 'RE_ER' WHERE EXISTS (SELECT * FROM "filesin" WHERE filesin.prot = 'ER' AND filesin.id_out = filesout.id_out);
UPDATE "filesout" SET "status" = 'RE_ERROR' WHERE EXISTS (SELECT * FROM "filesin" WHERE filesin.prot = 'VE' AND filesin.id_out = filesout.id_out);
UPDATE "filesin" SET "prot" = NULL WHERE "prot" = 'VE';
UPDATE "settings" SET "value" = '3' WHERE "name" = 'VerDB';
COMMIT;
