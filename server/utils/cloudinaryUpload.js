
const crypto = require('crypto');
const path = require('path');
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (
  file,
  {
    folder,
    prefix,
    resourceType = 'image',
  }
) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error('No file buffer provided.'));
    }

    const extension = path.extname(file.originalname).toLowerCase();

    const publicId = `${prefix}-${crypto.randomUUID()}${
      resourceType === 'raw' ? extension : ''
    }`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `portfolio/${folder}`,
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};

const deleteFromCloudinary = async (
  publicId,
  resourceType = 'image'
) => {
  if (!publicId) return null;

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
