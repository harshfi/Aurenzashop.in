const multer = require('multer');

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error('Only JPG, PNG, and WEBP images are allowed.');
    error.statusCode = 400;
    return cb(error, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter,
});

const hasSignature = (buffer, signature, offset = 0) => {
  if (!buffer || buffer.length < offset + signature.length) return false;
  return signature.every((byte, index) => buffer[offset + index] === byte);
};

const detectImageType = (buffer) => {
  if (hasSignature(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (hasSignature(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (hasSignature(buffer, [0x52, 0x49, 0x46, 0x46]) && hasSignature(buffer, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }

  return null;
};

const validateUploadedImages = (req, _res, next) => {
  const files = req.files || [];

  for (const file of files) {
    const detectedType = detectImageType(file.buffer);

    if (!detectedType || detectedType !== file.mimetype) {
      const error = new Error('Invalid image file detected. Please upload genuine JPG, PNG, or WEBP images.');
      error.statusCode = 400;
      return next(error);
    }
  }

  next();
};

module.exports = {
  upload,
  validateUploadedImages,
};
