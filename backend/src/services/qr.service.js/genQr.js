const QRCode = require("qrcode");

const generateQRCode = async (data) => {
  return await QRCode.toDataURL(JSON.stringify(data));
};

module.exports = { generateQRCode };