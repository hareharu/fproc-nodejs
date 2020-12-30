BEGIN TRANSACTION;
ALTER TABLE "sender" RENAME TO "_sender";
CREATE TABLE "sender" (
	"id"		INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"code"		INTEGER,
	"dept"		TEXT,
	"name"		TEXT,
	"dir"		TEXT,
	"types"		TEXT
);
INSERT INTO "sender" ("id", "code", "name", "dept", "types")
	SELECT "id", "code", "name", '', "types"
	FROM "_sender";
DROP TABLE "_sender";
CREATE UNIQUE INDEX "SENDER_ID" ON "sender" ("id");
CREATE INDEX "SENDER_CODE" ON "sender" ("code");
UPDATE "settings" SET "value" = '2' WHERE "name" = 'VerDB';
COMMIT;
