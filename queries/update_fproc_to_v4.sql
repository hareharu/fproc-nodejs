BEGIN TRANSACTION;
UPDATE "status" SET "name" = 'Отправлен в ТФОМС', "full" = 'Файл отправлен в ТФОМС через ViPNet' WHERE "code" = 'SENDED';
UPDATE "settings" SET "value" = '4' WHERE "name" = 'VerDB';
COMMIT;
