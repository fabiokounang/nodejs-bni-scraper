const axios = require('axios');
const cheerio = require('cheerio');

const login = require("./middleware/login");
const logout = require("./middleware/logout");

const headers = require("./helper/headers");

module.exports = class BNI {
  static async getBalance (username, password) {
    try {
      const result = await login(username, password);
      if (!result.status) throw new Error('Failed get balance');

      const responseBalance = await axios({
        method: 'GET',
        url: result.data.balanceUrl,
        headers: {
          "Host": "ibank.bni.co.id",
          "Referer": result.data.urlRekening,
          ...headers
        }
      });
      
    
      let $ = cheerio.load(responseBalance.data);
      const urlPageBalance = $('#form').attr('action');
      const objPageBalance = {
        "Num_Field_Err": "Please enter digits only!",
        "Mand_Field_Err": "Mandatory field is empty!",
        "MAIN_ACCOUNT_TYPE": "OPR",
        "AccountIDSelectRq": "Lanjut",
        "AccountRequestType": "ViewBalance",
        "mbparam": result.data.mbparam,
        "uniqueURLStatus": "disabled",
        "imc_service_page": "AccountTypeSelectRq",
        "Alignment": "LEFT",
        "page": "AccountTypeSelectRq",
        "locale": "bh",
        "PageName": "BalanceInqRq",
        "serviceType": "Dynamic"
      }
      const responsePageBalance = await axios({
        url: urlPageBalance,
        method: 'POST',
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Host": "ibank.bni.co.id",
          "Referer": result.data.balanceUrl,
          ...headers
        },
        data: objPageBalance
      });

      const $pageBalance = cheerio.load(responsePageBalance.data);
      const acc1 = $pageBalance('#ACC_1 #ACC_1_column1 #acc1_span2 #acc1').attr('value');
      const opr = $pageBalance('#MAIN_ACCOUNT_TYPE').attr('value');
      if (!acc1 || !opr) throw new Error('Failed get balance (acc / opr');
      let prevUrl = $pageBalance('form').attr('action');
      const objDetailBalance = {
        Num_Field_Err: "Please enter digits only!",
        Mand_Field_Err: "Mandatory field is empty!",
        acc1: acc1,
        BalInqRq: "Lanjut",
        MAIN_ACCOUNT_TYPE: opr,
        mbparam: result.data.mbparam,
        uniqueURLStatus: "disabled",
        imc_service_page: "AccountIDSelectRq",
        Alignment: "LEFT",
        page: "AccountIDSelectRq",
        locale: "bh",
        PageName: "AccountTypeSelectRq",
        serviceType: "Dynamic"
      }

      const responseDetailBalance = await axios({
        url: prevUrl,
        method: 'POST',
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Host": "ibank.bni.co.id",
          "Referer": urlPageBalance,
          ...headers
        },
        data: objDetailBalance
      });
      const $balance = cheerio.load(responseDetailBalance.data);
      const balance = $balance('#Row5_5_column2 #H').text();
      await logout(result.data.referer, prevUrl, result.data.mbparam);
      return {
        status: result.status,
        data: {
          balance: balance && balance.includes('IDR') ? Number(balance.split('IDR')[1].split('.').join('').split(',')[0]) : 0
        }
      }
    } catch (error) {
      return { status: false, error: error.message }
    }
  }

  static async getMutation (username, password, filterFrom, filterTo) {
    try {
      const result = await login(username, password);
      if (!result.status) throw new Error('Failed get mutation');

      const responseMutasi = await axios({
        method: 'GET',
        url: result.data.mutasiRekeningUrl,
        headers: {
          "Host": "ibank.bni.co.id",
          "Referer": result.data.urlRekening,
          ...headers
        }
      });
      const $ = cheerio.load(responseMutasi.data);
      const urlMutasi = $('form').attr('action');
      const mutasiPage = await axios({
        method: 'POST',
        url: urlMutasi,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Host": "ibank.bni.co.id",
          "Referer": result.data.mutasiRekeningUrl,
          ...headers
        },
        data: {
          Num_Field_Err: "Please enter digits only!",
          Mand_Field_Err: "Mandatory field is empty!",
          MAIN_ACCOUNT_TYPE: "OPR",
          AccountIDSelectRq: "Lanjut",
          AccountRequestType: "Query",
          mbparam: result.data.mbparam,
          uniqueURLStatus: "disabled",
          imc_service_page: "AccountTypeSelectRq",
          Alignment: "LEFT",
          page: "AccountTypeSelectRq",
          locale: "bh",
          PageName: "TranHistoryRq",
          serviceType: "Dynamic",
        }
      });

      const $getmutasi = cheerio.load(mutasiPage.data);
      const prevUrl = $getmutasi('form').attr('action');
      const acc1 = $getmutasi('#ACC_1 #ACC_1_column1 #acc1_span2 #acc1').attr('value');
      const opr = $getmutasi('#MAIN_ACCOUNT_TYPE').attr('value');

      const responseGetMutasi = await axios({
        method: 'POST',
        url: prevUrl,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Host": "ibank.bni.co.id",
          "Referer": urlMutasi,
          ...headers
        },
        data: {
          Num_Field_Err: "Please enter digits only!",
          Mand_Field_Err: "Mandatory field is empty!",
          acc1: acc1,
          TxnPeriod: "LastMonth",
          Search_Option: "TxnPrd",
          txnSrcFromDate: filterFrom, // "20-Oct-2022"
          txnSrcToDate: filterTo, // "21-Oct-2022"
          FullStmtInqRq: "Lanjut",
          MAIN_ACCOUNT_TYPE: opr,
          mbparam: result.data.mbparam,
          uniqueURLStatus: "disabled",
          imc_service_page: "AccountIDSelectRq",
          Alignment: "LEFT",
          page: "AccountIDSelectRq",
          locale: "bh",
          PageName: "AccountIDSelectRq",
          serviceType: "Dynamic"
        }
      });

      const $mutasiLog = cheerio.load(responseGetMutasi.data);
      await logout(result.data.referer, prevUrl, result.data.mbparam);

      const resultLog = [];
      $mutasiLog('.Commondiv table.CommonTableClass td').each((i, element) => {
        const title = $mutasiLog(element).children('.BodytextCol1');
        const value = $mutasiLog(title).siblings('span');
        if (title.text() && value.text()) resultLog.push(value.text());
      });

      if (resultLog.length <= 0) {
        return {
          status: true,
          data: {
            no_rek: '',
            values: []
          }
        }
      }

      const noRek = resultLog[0]; // no rek
      let fixLog = [];
      const log = resultLog.slice(1);
      for (let i = 0; i < log.length; i+=5) {
        fixLog.push({
          date: log[i],
          description: log[i + 1],
          tipe: log[i + 2],
          bill: log[i + 3],
          balance: log[i + 4],
        });
      }

      return { 
        status: true, 
        data: {
          no_rek: noRek,
          values: fixLog
        } 
      }

    } catch (error) {
      return { status: false, error: error.message }
    }
  }
}