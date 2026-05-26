const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const hasCloudinaryConfig = () => (
  Boolean(process.env.CLOUDINARY_CLOUD_NAME)
  && Boolean(process.env.CLOUDINARY_API_KEY)
  && Boolean(process.env.CLOUDINARY_API_SECRET)
);

/**
 * Upload a single image buffer to Cloudinary
 * @param {Buffer} buffer - Image file buffer from Multer
 * @param {string} folder - Cloudinary folder (e.g., 'aurenza/products')
 * @returns {Object} { url, publicId }
 */
const uploadImage = (buffer, folder = 'aurenza/products') => {
  if (!hasCloudinaryConfig()) {
    const error = new Error('Image upload service is not configured. Please set Cloudinary environment variables.');
    error.statusCode = 500;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error || !result?.secure_url || !result?.public_id) {
          const uploadError = new Error('Image upload failed. Please try again.');
          uploadError.statusCode = 502;
          return reject(uploadError);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

/**
 * Upload multiple images in parallel
 * @param {Array} files - Array of Multer file objects (each has .buffer)
 * @param {string} folder - Cloudinary folder
 * @returns {Array} Array of { url, publicId }
 */
const uploadMultiple = async (files, folder = 'aurenza/products') => {
  const uploadPromises = files.map((file) => uploadImage(file.buffer, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete an image from Cloudinary by public ID
 * @param {string} publicId - Cloudinary public ID
 */
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

/**
 * Extract the public ID from a Cloudinary URL
 * @param {string} url - Full Cloudinary URL
 * @returns {string} Public ID
 */
const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    const relevantParts = parts.slice(uploadIndex + 2);
    const lastPart = relevantParts[relevantParts.length - 1];
    relevantParts[relevantParts.length - 1] = lastPart.replace(/\.[^/.]+$/, '');
    return relevantParts.join('/');
  } catch {
    return null;
  }
};

module.exports = {
  uploadImage,
  uploadMultiple,
  deleteImage,
  getPublicIdFromUrl,
};
