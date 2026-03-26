const cloudinary = require("../../config/cloudinary");

const uploadQR = async (base64) => {
  try {
    const res = await cloudinary.uploader.upload(base64, {
      folder: "qr_codes"
    });

    return res.secure_url;

  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    throw err;
  }
};

module.exports = { uploadQR };