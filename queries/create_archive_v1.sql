BEGIN TRANSACTION;
CREATE TABLE "arc_med" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"file"	TEXT,
	"prot"	TEXT,
	"type"	TEXT,
	"date"	TEXT,
	"year"	TEXT,
	"month"	TEXT,
	"id_zap"	TEXT,
	"id_pac"	TEXT,
	"date_b"	TEXT,
	"date_e"	TEXT,
	"date_1"	TEXT,
	"date_2"	TEXT,
	"id_med_usl"	TEXT,
	"prvs"	TEXT,
	"code_md"	TEXT,
	"vidpom"	TEXT,
	"lpu_1"	TEXT,
	"podr"	TEXT,
	"ds1"	TEXT,
	"vis_ob"	TEXT,
	"usl_ok"	TEXT,
	"code_usl"	TEXT,
	"code_mes1"	TEXT,
	"code_mes2"	TEXT,
	"idsp"	TEXT,
	"ed_col"	TEXT,
	"tarif"	TEXT,
	"sumv"	TEXT,
	"oplata"	TEXT,
	"sump"	TEXT,
	"sank"	TEXT,
	"comment_z"	TEXT,
	"comment_s"	TEXT,
	"proctime"	TEXT
);
CREATE UNIQUE INDEX "ARC_MED_ID" ON "arc_med" ("id");
CREATE INDEX "ARC_MED_OPLATA" ON "arc_med" ("oplata");
CREATE INDEX "ARC_MED_DATE" ON "arc_med" ("date");
CREATE INDEX "ARC_MED_ID_PAC" ON "arc_med" ("id_pac");
CREATE INDEX "ARC_MED_ID_MED_USL" ON "arc_med" ("id_med_usl");
CREATE INDEX "ARC_MED_TYPE" ON "arc_med" ("type");
CREATE INDEX "ARC_MED_DATE_B" ON "arc_med" ("date_b");
CREATE INDEX "ARC_MED_DATE_E" ON "arc_med" ("date_e");
CREATE TABLE "arc_pac" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"file"	TEXT,
	"prot"	TEXT,
	"type"	TEXT,
	"date"	TEXT,
	"id_pac"	TEXT,
	"fam"	TEXT,
	"im"	TEXT,
	"ot"	TEXT,
	"w"	TEXT,
	"dr"	TEXT,
	"snils"	TEXT,
	"okatog"	TEXT,
	"okatop"	TEXT,
	"p_city"	TEXT,
	"id_ul"	TEXT,
	"ul"	TEXT,
	"dom"	TEXT,
	"kv"	TEXT,
	"result"	TEXT,
	"codsk"	TEXT,
	"npolis"	TEXT,
	"code_p"	TEXT,
	"vpolis"	TEXT,
	"date_n"	TEXT,
	"comment_p"	TEXT,
	"proctime"	TEXT,
	"doctype"	TEXT,
	"docser"	TEXT,
	"docnum"	TEXT,
	"docdate"	TEXT,
	"docorg"	TEXT
);
CREATE UNIQUE INDEX "ARC_PAC_ID" ON "arc_pac" ("id");
CREATE INDEX "ARC_PAC_DATE" ON "arc_pac" ("date");
CREATE INDEX "ARC_PAC_OT" ON "arc_pac" ("ot");
CREATE INDEX "ARC_PAC_IM" ON "arc_pac" ("im");
CREATE INDEX "ARC_PAC_FAM" ON "arc_pac" ("fam");
CREATE INDEX "ARC_PAC_ID_PAC" ON "arc_pac" ("id_pac");
CREATE TABLE "settings" (
	"name"	TEXT NOT NULL PRIMARY KEY UNIQUE,
	"value"	TEXT
);
CREATE UNIQUE INDEX "SETTINGS_NAME" ON "settings" ("name");
INSERT INTO "settings" ("name","value") VALUES ('VerDB', '1');
COMMIT;
