BEGIN TRANSACTION;
ALTER TABLE "exam" RENAME TO "_exam";
CREATE TABLE "exam" (
	"id"		INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"id_out"	INTEGER,
	"year"		INTEGER,
	"month"		INTEGER,
	"sender"	INTEGER,
	"note"		TEXT,
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
	SELECT "id", "id_out", "re_year", "re_mon", "sender", "note", "dv220f", "dv220s", "dv325f", "dv325s", 0, 0, "ds223f", "ds223s", "pv230f", "pv230s", "pd231f", "pd231s", "pd232f", "pd232s", "pd233f", "pd233s"
	FROM "_exam";
DROP TABLE "_exam";
CREATE UNIQUE INDEX "EXAM_ID" ON "exam" ("id");
CREATE INDEX "EXAM_SENDER" ON "exam" ("sender");
CREATE INDEX "EXAM_MONTH" ON "exam" ("month");
CREATE INDEX "EXAM_YEAR" ON "exam" ("year");
UPDATE "settings" SET "value" = '1' WHERE "name" = 'VerDB';
COMMIT;
