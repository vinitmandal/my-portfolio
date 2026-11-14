
const multer = require('multer');

const imageFormats = {
  '.jpg': {
    mime: 'image/jpeg',
    matches: (bytes) =>
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff,
  },
  '.jpeg': {
    mime: 'image/jpeg',
    matches: (bytes) =>
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff,
  },
  '.png': {
    mime: 'image/png',
    matches: (bytes) =>
      bytes.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      ),
  },
  '.gif': {
    mime: 'image/gif',
    matches: (bytes) =>
      bytes.toString('ascii', 0, 6) === 'GIF87a' ||
      bytes.toString('ascii', 0, 6) === 'GIF89a',
  },
  '.webp': {
    mime: 'image/webp',
    matches: (bytes) =>
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP',
  },
};

const pdfFormats = {
  '.pdf': {
    mime: 'application/pdf',
    matches: (bytes) => bytes.toString('ascii', 0, 5) === '%PDF-',
  },
};

const createFileUpload = ({
  folder,
  prefix,
  formats,
  maxBytes = 5 * 1024 * 1024,
}) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes,
      files: 1,
    },
    fileFilter: (_req, file, callback) => {
      const extension = require('path')
        .extname(file.originalname)
        .toLowerCase();

      const format = formats[extension];

      if (!format || file.mimetype !== format.mime) {
        const error = new Error(
          'The file extension and MIME type must match an allowed file type.'
        );
        error.statusCode = 400;
        return callback(error);
      }

      callback(null, true);
    },
  });

  const validateSignature = (req, res, next) => {
    if (!req.file) return next();

    const extension = require('path')
      .extname(req.file.originalname)
      .toLowerCase();

    const format = formats[extension];

    if (
      !format ||
      !format.matches(req.file.buffer.subarray(0, 12))
    ) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded file content does not match an allowed file type.',
      });
    }

    next();
  };

  return { upload, validateSignature };
};

module.exports = {
  createFileUpload,
  imageFormats,
  pdfFormats,
};
