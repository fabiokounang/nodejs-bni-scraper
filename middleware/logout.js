const axios = require("axios");
const headers = require("../helper/headers");

module.exports = async (referer, prevUrl, mbparam, result) => {
  try {
    await axios({
      method: 'POST',
      url: referer,
      withCredentials: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": "ibank.bni.co.id",
        "Referer": prevUrl,
        ...headers
      },
      data: {
        Num_Field_Err: "Please enter digits only!",
        Mand_Field_Err: "Mandatory field is empty!",
        LogOut: "Keluar",
        mbparam: mbparam,
        uniqueURLStatus: "disabled",
        imc_service_page: "LoginRs",
        Alignment: "LEFT",
        page: "LoginRs",
        locale: "bh",
        PageName: "SignOffUrlRq",
        serviceType: "Dynamic"
      }
    });
  
    await axios({
      method: 'POST',
      url: referer,
      withCredentials: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": "ibank.bni.co.id",
        "Referer": prevUrl,
        ...headers
      },
      data: {
        Num_Field_Err: "Please enter digits only!",
        Mand_Field_Err: "Mandatory field is empty!",
        __LOGOUT__: "Keluar",
        mbparam: mbparam,
        uniqueURLStatus: "disabled",
        imc_service_page: "SignOffUrlRq",
        Alignment: "LEFT",
        page: "SignOffUrlRq",
        locale: "bh",
        PageName: "LoginRs",
        serviceType: "Dynamic"
      }
    });
    return { status: true, data: result };
  } catch (error) {
    return { status: false, error: error.message || error.stack || JSON.stringify(error) };
  }
}