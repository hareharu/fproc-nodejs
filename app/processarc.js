var path = require('path');
var fs = require('fs');

var fsys = require('./filesystem');
var fn = require('./functions');
var db = require('./database');

var archive = async (filefull) => { // очень "временное" решение; нужно переделать все к чертям, уровняв структуру хранения с блоками в xml
  if (path.parse(filefull).base.match(new RegExp("^[A-Z]{2}_[A-Z]{1,2}(M[0-9]{6}T24|T24M[0-9]{6})_[0-9]*(|_[0-9]*)\.xml$", 'i'))) {
    var done = false;
    try {
      var proctime = fn.dateToStamp(new Date());
      var query = 'BEGIN TRANSACTION;\r\n';
      var prot = path.parse(filefull).base.substring(0,2);
      var type = path.parse(filefull).base.substring(3,5);
      if (type.substring(1, 2) == 'T' || type.substring(1, 2) == 'M') type = type.substring(0, 1);
      var date = fn.dateToStamp(fs.statSync(filefull).mtime);
      var file = path.parse(filefull).name;
      var ROOT = await fsys.parse(filefull);
      if (type != 'H' && type != 'L') {
        var year = parseInt(ROOT.ZL_LIST.SCHET[0].YEAR[0], 10);
        var month = parseInt(ROOT.ZL_LIST.SCHET[0].MONTH[0].substring(2, 4), 10);
        ROOT.ZL_LIST.SCHET.forEach(SCHET => {
          SCHET.ZAP.forEach(ZAP => {
            var id_zap = ZAP.ID_ZAP[0];
            var id_pac = ZAP.PACIENT[0].ID_PAC[0];
            ZAP.SLUCH.forEach(SLUCH => {
              var date_b = SLUCH.DATE_1[0];
              var date_e = SLUCH.DATE_2[0];
              var comment_z = SLUCH.COMENTL ? SLUCH.COMENTL[0] : null;
              if (SLUCH.SANK) { 
                comment_z = SLUCH.SANK[0].COMENTSL ? SLUCH.SANK[0].COMENTSL[0] : isNullOrUndefined;
              }
              if (type == 'V' || type == 'R') {
                SLUCH.SLUCH_MED.forEach(SLUCH_MED => {
                  var DATA = { proctime, file, prot, type, date, year, month, id_zap, id_pac, date_b, date_e, comment_z }   
                  DATA.ID_MED_USL = SLUCH_MED.ID_MED_USL ? SLUCH_MED.ID_MED_USL[0] : null;
                  DATA.USL_OK = SLUCH_MED.USL_OK ? SLUCH_MED.USL_OK[0] : null;
                  DATA.DATE_1 = SLUCH_MED.DATE_1 ? SLUCH_MED.DATE_1[0] : null;
                  DATA.DATE_2 = SLUCH_MED.DATE_2 ? SLUCH_MED.DATE_2[0] : null;
                  DATA.PRVS = SLUCH_MED.PRVS ? SLUCH_MED.PRVS[0] : null;
                  DATA.CODE_MD = SLUCH_MED.CODE_MD ? SLUCH_MED.CODE_MD[0] : null;
                  DATA.VIDPOM = SLUCH_MED.VIDPOM ? SLUCH_MED.VIDPOM[0] : null;
                  DATA.LPU_1 = SLUCH_MED.LPU_1 ? SLUCH_MED.LPU_1[0] : null;
                  DATA.PODR = SLUCH_MED.PODR ? SLUCH_MED.PODR[0] : null;
                  DATA.DS1 = SLUCH_MED.DS1 ? SLUCH_MED.DS1[0] : null;
                  DATA.VIS_OB = SLUCH_MED.VIS_OB ? SLUCH_MED.VIS_OB[0] : null;
                  DATA.CODE_USL = SLUCH_MED.CODE_USL ? SLUCH_MED.CODE_USL[0] : null;
                  DATA.CODE_MES1 = SLUCH_MED.CODE_MES1 ? SLUCH_MED.CODE_MES1[0] : null;
                  DATA.CODE_MES2 = SLUCH_MED.CODE_MES2 ? SLUCH_MED.CODE_MES2[0] : null;
                  DATA.IDSP = SLUCH_MED.IDSP ? SLUCH_MED.IDSP[0] : null;
                  DATA.ED_COL = SLUCH_MED.ED_COL ? SLUCH_MED.ED_COL[0] : null;
                  DATA.TARIF = SLUCH_MED.TARIF ? SLUCH_MED.TARIF[0] : null;
                  DATA.SUMV = SLUCH_MED.SUMV ? SLUCH_MED.SUMV[0] : null;
                  DATA.OPLATA = SLUCH_MED.OPLATA ? SLUCH_MED.OPLATA[0] : null;
                  DATA.SUMP = SLUCH_MED.SUMP ? SLUCH_MED.SUMP[0] : null;
                  DATA.SANK = SLUCH_MED.SANK_IT ? SLUCH_MED.SANK_IT[0] : null;
                  if (SLUCH_MED.SANK) { 
                    if (SLUCH_MED.SANK[0].S_SUM) DATA.SANK = SLUCH_MED.SANK[0].S_SUM[0];
                    DATA.COMMENT_S = SLUCH_MED.SANK[0].COMENTSL ? SLUCH_MED.SANK[0].COMENTSL[0] : null;
                  } else {
                    DATA.COMMENT_S = null;
                  }
                  query += insertQuery('arc_med', DATA);
                });
              } else {
                SLUCH.OSM.forEach((OSM, index) => {     
                  var DATA = { proctime, file, prot, type, date, year, month, id_zap, id_pac, date_b, date_e, comment_z }
                  DATA.COMMENT_S = OSM.COMENTOSM ? OSM.COMENTOSM[0] : null;
                  DATA.ID_MED_USL = OSM.ID_OL ? OSM.ID_OL[0] : null;
                  DATA.DATE_1 = OSM.DLOOK ? OSM.DLOOK[0] + 'T00:00:00' : null;
                  DATA.DATE_2 = OSM.DLOOK ? OSM.DLOOK[0] + 'T00:00:00' : null;
                  DATA.PRVS = OSM.PRVS ? OSM.PRVS[0] : null;
                  DATA.CODE_MD = OSM.PCOD ? OSM.PCOD[0] : null;
                  DATA.VIDPOM = OSM.VIDPOM ? OSM.VIDPOM[0] : null;
                  DATA.LPU_1 = SLUCH.LPU_1 ? SLUCH.LPU_1[0] : null;
                  DATA.PODR = SLUCH.LPU_1 ? SLUCH.LPU_1[0] : null;
                  DATA.DS1 = OSM.SDIAG ? OSM.SDIAG[0].LMKB[0] : null;
                  DATA.VIS_OB = SLUCH.VIS_OBN ? SLUCH.VIS_OBN[0] : null;
                  DATA.CODE_USL = OSM.CODE_USL ? OSM.CODE_USL[0] : null;
                  DATA.CODE_MES1 = null;
                  DATA.CODE_MES2 = null;
                  DATA.IDSP = SLUCH.IDSP ? SLUCH.IDSP[0] : null;
                  DATA.ED_COL = null;
                  DATA.OPLATA = SLUCH.OPLATA ? SLUCH.OPLATA[0] : null;
                  if (index == 1) {
                    DATA.TARIF = SLUCH.TARIF ? SLUCH.TARIF[0] : null;
                    DATA.SUMV = SLUCH.SUMV ? SLUCH.SUMV[0] : null;
                    DATA.SUMP = SLUCH.SUMP ? SLUCH.SUMP[0] : null;
                    DATA.SANK = SLUCH.SANK_IT ? SLUCH.SANK_IT[0] : null;  
                  } else {
                    DATA.TARIF = 0;
                    DATA.SUMV = 0;
                    DATA.SUMP = 0;
                    DATA.SANK = 0;  
                  }
                  DATA.USL_OK = null;
                  query += insertQuery('arc_med', DATA);
                });
              }
            });
          });
        });
      } else {
        if (type != 'H') {
          ROOT.PERS_LIST.PERS.forEach(PERS => {
            var DATA = { proctime, file, prot, type, date }
            DATA.COMMENT_P = PERS.COMENTP ? PERS.COMENTP[0] : null;
            DATA.ID_PAC = PERS.ID_PAC ? PERS.ID_PAC[0] : null;
            DATA.FAM = PERS.FAM ? PERS.FAM[0] : null;
            DATA.IM = PERS.IM ? PERS.IM[0] : null;
            DATA.OT = PERS.OT ? PERS.OT[0] : null;
            DATA.W = PERS.W ? (PERS.W[0] == '1' ? 'М' : 'Ж' ) : null;
            DATA.DR = PERS.DR ? PERS.DR[0] : null;
            DATA.SNILS = PERS.SNILS ? PERS.SNILS[0] : null;
            DATA.OKATOG = PERS.OKATOG ? PERS.OKATOG[0] : null;
            DATA.OKATOP = PERS.OKATOP ? PERS.OKATOP[0] : null;
            DATA.P_CITY = PERS.P_CITY ? PERS.P_CITY[0] : null;
            DATA.ID_UL = PERS.ID_UL ? PERS.ID_UL[0] : null;
            DATA.UL = PERS.UL ? PERS.UL[0] : null;
            DATA.DOM = PERS.DOM ? PERS.DOM[0] : null;
            DATA.KV = PERS.KV ? PERS.KV[0] : null;
            if (PERS.DOCUM) {
              DATA.DOCTYPE = PERS.DOCUM[0].DOCTYPE ? PERS.DOCUM[0].DOCTYPE[0] : null;
              DATA.DOCSER = PERS.DOCUM[0].DOCSER ? PERS.DOCUM[0].DOCSER[0] : null;
              DATA.DOCNUM = PERS.DOCUM[0].DOCNUM ? PERS.DOCUM[0].DOCNUM[0] : null;
              DATA.DOCDATE = PERS.DOCUM[0].DOCDATE ? PERS.DOCUM[0].DOCDATE[0] : null;
              DATA.DOCORG = PERS.DOCUM[0].DOCORG ? PERS.DOCUM[0].DOCORG[0] : null;
            } else {
              DATA.DOCTYPE = null;
              DATA.DOCSER = null;
              DATA.DOCNUM = null;
              DATA.DOCDATE = null;
              DATA.DOCORG = null;
            }
            if (PERS.OSPR) {
              DATA.RESULT = PERS.OSPR[0].RESULT ? PERS.OSPR[0].RESULT[0] : null;
              DATA.CODSK = PERS.OSPR[0].CODSK_OUR ? PERS.OSPR[0].CODSK_OUR[0] : null;
              DATA.NPOLIS = PERS.OSPR[0].NPOLIS_OUR ? PERS.OSPR[0].NPOLIS_OUR[0] : null;
              DATA.CODE_P = PERS.OSPR[0].CODE_POUR ? PERS.OSPR[0].CODE_POUR[0] : null;
              DATA.VPOLIS = PERS.OSPR[0].VPOLIS_OUR ? PERS.OSPR[0].VPOLIS_OUR[0] : null;
              DATA.DATE_N = PERS.OSPR[0].DATE_N_OUR ? PERS.OSPR[0].DATE_N_OUR[0] : null;
            } else {
              DATA.RESULT = null;
              DATA.CODSK = null;
              DATA.NPOLIS = null;
              DATA.CODE_P = null;
              DATA.VPOLIS = null;
              DATA.DATE_N = null;
            }
            query += insertQuery('arc_pac', DATA);
          });
        } else {
          ROOT.ZL_LIST.ZAP.forEach(ZAP => {
            var DATA_p = { proctime, file, prot, type, date }
            var DATA_m = { proctime, file, prot, type, date }
            DATA_p.ID_PAC = file + '_' + ZAP.N_ZAP[0];
            DATA_p.FAM = ZAP.PERS[0].FAM ? ZAP.PERS[0].FAM[0] : null;
            DATA_p.IM = ZAP.PERS[0].IM ? ZAP.PERS[0].IM[0] : null;
            DATA_p.OT = ZAP.PERS[0].OT ? ZAP.PERS[0].OT[0] : null;
            DATA_p.DR = ZAP.PERS[0].DR ? ZAP.PERS[0].DR[0] : null;
            DATA_p.W = ZAP.PERS[0].W ? ZAP.PERS[0].W[0] : null;
            DATA_p.OKATOG = ZAP.PERS[0].OKATOG ? ZAP.PERS[0].OKATOG[0] : null;
            DATA_p.DOCTYPE = ZAP.PERS[0].DOCTYPE ? ZAP.PERS[0].DOCTYPE[0] : null;
            DATA_p.DOCSER = ZAP.PERS[0].DOCSER ? ZAP.PERS[0].DOCSER[0] : null;
            DATA_p.DOCNUM = ZAP.PERS[0].DOCNUM ? ZAP.PERS[0].DOCNUM[0] : null;
            DATA_p.DOCDATE = ZAP.PERS[0].DOCDATE ? ZAP.PERS[0].DOCDATE[0] : null;
            DATA_p.DOCORG = ZAP.PERS[0].DOCORG ? ZAP.PERS[0].DOCORG[0] : null;
            if (ZAP.STR_OMS) {
              DATA_p.CODSK = ZAP.STR_OMS[0].SMO ? ZAP.STR_OMS[0].SMO[0] : null;
              DATA_p.vpolis = ZAP.STR_OMS[0].VPOLIS ? ZAP.STR_OMS[0].VPOLIS[0] : null;
              DATA_p.NPOLIS = ZAP.STR_OMS[0].NPOLIS ? ZAP.STR_OMS[0].NPOLIS[0] : null;
              DATA_p.code_P = ZAP.STR_OMS[0].KOD_MO_ATTACH ? ZAP.STR_OMS[0].KOD_MO_ATTACH[0] : null;
            } else {
              DATA_p.CODSK = null;
              DATA_p.vpolis = null;
              DATA_p.NPOLIS = null;
              DATA_p.code_P = null;
            }
            DATA_p.date_n = null;
            DATA_p.SNILS = null;
            DATA_p.OKATOP = null;
            DATA_p.comment_p = null;
            DATA_p.result = null;
            DATA_p.p_city = null;
            DATA_p.id_ul = null;
            DATA_p.ul = null;
            DATA_p.dom = null;
            DATA_p.kv = null;
            DATA_m.ID_ZAP = file + '_' + ZAP.N_ZAP[0];
            DATA_m.ID_PAC = file + '_' + ZAP.N_ZAP[0];
            DATA_m.ID_MED_USL = ZAP.SLUCH[0].ID_MED[0];
            if (ZAP.ERR) {
              DATA_m.OPLATA = '0';
              DATA_m.comment_z = ZAP.ERR[0].COMM ? ZAP.ERR[0].COMM[0] : null;
            } else {
              DATA_m.OPLATA = '1';
              DATA_m.comment_z = null;
            }
            DATA_m.COMMENT_S = null;
            DATA_m.PRVS = null;
            DATA_m.LPU_1 = null;
            DATA_m.PODR = null;
            DATA_m.VIS_OB = null;
            DATA_m.CODE_USL =  null;
            DATA_m.CODE_MES1 = null;
            DATA_m.CODE_MES2 = null;
            DATA_m.IDSP = null;
            DATA_m.ED_COL = null;
            DATA_m.TARIF = null;
            if (ZAP.SLUCH) {
              DATA_m.date_b = ZAP.SLUCH[0].CALL_TIME ? ZAP.SLUCH[0].CALL_TIME[0].substring(0,10) : null;
              if (!DATA_m.date_b || DATA_m.date_b.length == 0) DATA_m.date_b = ZAP.SLUCH[0].DEP_TIME ? ZAP.SLUCH[0].DEP_TIME[0].substring(0,10) : null;
              DATA_m.date_e = ZAP.SLUCH[0].COM_TIME ? ZAP.SLUCH[0].COM_TIME[0].substring(0,10) : null; 
              DATA_m.DATE_1 = ZAP.SLUCH[0].CALL_TIME ? ZAP.SLUCH[0].CALL_TIME[0] : null;
              if (!DATA_m.DATE_1 || DATA_m.DATE_1.length == 0) DATA_m.DATE_1 = ZAP.SLUCH[0].DEP_TIME ? ZAP.SLUCH[0].DEP_TIME[0].substring(0,10) : null;
              DATA_m.DATE_2 = ZAP.SLUCH[0].COM_TIME ? ZAP.SLUCH[0].COM_TIME[0] : null;
              DATA_m.VIDPOM = ZAP.SLUCH[0].KDVHLP ? ZAP.SLUCH[0].KDVHLP[0] : null;
              DATA_m.DS1 = ZAP.SLUCH[0].DIAG ? ZAP.SLUCH[0].DIAG[0] : null;
              DATA_m.CODE_MD = ZAP.SLUCH[0].CODE_MD ? ZAP.SLUCH[0].CODE_MD[0] : null;
              DATA_m.USL_OK = ZAP.SLUCH[0].KDRES_CH ? ZAP.SLUCH[0].KDRES_CH[0] : null;
            } else {
              DATA_m.date_b = null;
              DATA_m.date_e = null; 
              DATA_m.DATE_1 = null;
              DATA_m.DATE_2 = null;
              DATA_m.VIDPOM = null;
              DATA_m.DS1 = null;
              DATA_m.CODE_MD = null;
              DATA_m.USL_OK = null;
            }
            if (ZAP.SCHET) {
              DATA_m.year = ZAP.SCHET[0].DSCHET ? parseInt(ZAP.SCHET[0].DSCHET[0].substring(0,4), 10) : null;
              DATA_m.month = ZAP.SCHET[0].DSCHET ? parseInt(ZAP.SCHET[0].DSCHET[0].substring(5,7), 10) : null;
              DATA_m.SUMV = ZAP.SCHET[0].SUMMAV ? ZAP.SCHET[0].SUMMAV[0] : null;
              DATA_m.SUMP = ZAP.SCHET[0].SUMMAP ? ZAP.SCHET[0].SUMMAP[0] : null;
              DATA_m.SANK = ZAP.SCHET[0].SANK_MEK ? ZAP.SCHET[0].SANK_MEK[0] : null;
            } else {
              DATA_m.year = ROOT.ZL_LIST.ZGLV[0].DATA ? parseInt(ROOT.ZL_LIST.ZGLV[0].DATA[0].substring(0,4), 10) : null;
              DATA_m.month = ROOT.ZL_LIST.ZGLV[0].DATA ? parseInt(ROOT.ZL_LIST.ZGLV[0].DATA[0].substring(5,7), 10) : null;
              DATA_m.SUMV = null;
              DATA_m.SUMP = null;
              DATA_m.SANK = null;
            }
            query += insertQuery('arc_med', DATA_m);
            query += insertQuery('arc_pac', DATA_p);
          });
        }
      }
      query += 'END TRANSACTION;\r\n';
      await db.archive.execSync(query);
      done = true;
    } catch(error) {
      fn.eventLog(error, 'Не удалось выполнить обработку архива', 'warning', 'processarc.archive');
    } finally {
      if (done) fsys.remove(filefull); 
    }
  }
}

var insertQuery = (table, row) => {
  var columns = '';
  var values = '';
  for (var name in row) {
    columns += '"' + name + '", ';
    if (row[name]) {
      values += '\'' + row[name] + '\', ';
    } else {
      values += 'NULL, ';
    }
  }
  columns = columns.substring(0, columns.length - 2);
  values = values.substring(0, values.length - 2);
  return 'INSERT INTO "' + table + '" (' + columns + ') VALUES (' + values + ');\r\n';
};

module.exports = {
  archive,
};
