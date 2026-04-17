const QRCode = require("qrcode");

const generateQRCode = async (data) => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return await QRCode.toDataURL(payload);
};

module.exports = { generateQRCode };