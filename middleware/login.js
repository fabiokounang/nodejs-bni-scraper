const axios = require("axios");
const cheerio = require('cheerio');

const headers = require("../helper/headers");
const { host, origin, applicationUrlEncoded, welcomeBni, sessionOver, informasiSaldo, mutasiRekening, mobilePage, suspended, fiveMin } = require("../helper/variable");

module.exports = async (username, password) => {
  try {

    // 1) validasi credential
    if (!username) throw new Error('Username required');
    if (!password) throw new Error('Password required');

    // 2) get halaman utama bni
    const mainPage = await axios({
      method: 'GET',
      url: mobilePage,
      withCredentials: true,
      Host: host,
      Origin: origin,
      headers: {
        'Content-Type': applicationUrlEncoded,
        ...headers
      }
    });

    const $ = cheerio.load(mainPage.data);
    const urlLogin = $('#RetailUser').attr('href');

    // 3) get halaman form bni
    const loginPage = await axios({
      method: 'GET',
      url: urlLogin,
      withCredentials: true,
      headers: {
        'Content-Type': applicationUrlEncoded,
        ...headers
      }
    });

    const $login = cheerio.load(loginPage.data);
    const urlSubmitLogin = $login('#form').attr('action');
    if (!urlSubmitLogin) throw new Error('Username / password wrong');

    // 4) submit login credential bni
    const responseLogin = await axios({
      method: 'POST',
      url: urlSubmitLogin,
      withCredentials: true,
      headers: {
        ...headers,
        'Content-Type': applicationUrlEncoded,
        "Referer": urlLogin
      },
      data: {
        Num_Field_Err: 'Please enter digits only!',
        Mand_Field_Err: 'Mandatory field is empty!',
        CorpId: username,
        PassWord: password,
        __AUTHENTICATE__: 'Login',
        CancelPage: 'HomePage.xml',
        USER_TYPE: '1',
        MBLocale: 'bh',
        language: 'bh',
        AUTHENTICATION_REQUEST: 'True',
        __JS_ENCRYPT_KEY__: '',
        JavaScriptEnabled: 'N',
        deviceID: '',
        machineFingerPrint: '',
        deviceType: '',
        browserType: '',
        uniqueURLStatus: 'disabled',
        imc_service_page: 'SignOnRetRq',
        Alignment: 'LEFT',
        page: 'SignOnRetRq',
        locale: 'en',
        PageName: urlLogin.split('?')[1].split('&')[0].split('=')[1],
        formAction: 'urlSubmitLogin',
        serviceType: 'Dynamic',
        mConnectUrl: 'FMB',
      }
    });

    if (responseLogin.data.includes(welcomeBni)) throw new Error('Failed login, please check your username and password');
    if (responseLogin.data.includes(sessionOver)) throw new Error('Your session is over, please try again in 5 minutes');
    if (responseLogin.data.includes(suspended)) throw new Error('Your account is suspended (3 times miss password), please try to forget password');
    if (responseLogin.data.includes(fiveMin)) throw new Error('Please try again in 5 minutes');

    const $loginRes = cheerio.load(responseLogin.data);
    const referer = $loginRes('#form').attr('action'); // dipakai untuk masuk ke halaman rekening dan logout

    const rekeningButton = $loginRes('#divindex2 > table > tbody > tr > td#MBMenuList_td > a');
    let urlRekening = rekeningButton.attr('href');
    let balanceUrl = null;
    let mutasiRekeningUrl = null;
    let mbparam = null;

    if (!rekeningButton) throw new Error('Failed login, rekening menu not found');
    if (!urlRekening) throw new Error('Failed login, rekening url not found');

    const responseRekeningPage = await axios({
      method: 'GET',
      url: urlRekening,
      withCredentials: true,
      headers: {
        ...headers,
        "Host": host,
        "Referer": referer
      }
    });
    
    const $mutasi = cheerio.load(responseRekeningPage.data);      
    $mutasi('#AccountMenuList_td').map((i, card) => {
      if($mutasi(card).html().includes(informasiSaldo)) {
        balanceUrl = $mutasi(card).children('a').attr('href');
        mbparam = new URLSearchParams(balanceUrl).get('mbparam');
      }
      if($mutasi(card).html().includes(mutasiRekening)) {
        mutasiRekeningUrl = $mutasi(card).children('a').attr('href');
        mbparam = new URLSearchParams(mutasiRekeningUrl).get('mbparam');
      }
    });
    
    return { 
      status: true, 
      data: {
        referer,
        urlRekening,
        mutasiRekeningUrl,
        mbparam,
        balanceUrl
      } 
    };
  } catch (error) {
    return { status: false, error: error.message }
  }
}
