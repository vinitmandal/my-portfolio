const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const imageFormats = {
  '.jpg': { mime: 'image/jpeg', matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  '.jpeg': { mime: 'image/jpeg', matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  '.png': { mime: 'image/png', matches: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  '.gif': { mime: 'image/gif', matches: (bytes) => bytes.toString('ascii', 0, 6) === 'GIF87a' || bytes.toString('ascii', 0, 6) === 'GIF89a' },
  '.webp': { mime: 'image/webp', matches: (bytes) => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' },
};

const pdfFormats = {
  '.pdf': { mime: 'application/pdf', matches: (bytes) => bytes.toString('ascii', 0, 5) === '%PDF-' },
};

const createFileUpload = ({ folder, prefix, formats, maxBytes = 5 * 1024 * 1024 }) => {
  const destination = path.join(__dirname, '..', 'uploads', folder);
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => {
        fs.mkdir(destination, { recursive: true }, (error) => callback(error, destination));
      },
      filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${prefix}-${crypto.randomUUID()}${extension}`);
      },
    }),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, callback) => {
      const format = formats[path.extname(file.originalname).toLowerCase()];
      if (!format || file.mimetype !== format.mime) {
        const error = new Error('The file extension and MIME type must match an allowed file type.');
        error.statusCode = 400;
        callback(error);
        return;
      }
      callback(null, true);
    },
  });

  const validateSignature = async (req, res, next) => {
    if (!req.file) return next();

    try {
      const format = formats[path.extname(req.file.originalname).toLowerCase()];
      const fileHandle = await fs.promises.open(req.file.path, 'r');
      const header = Buffer.alloc(12);
      let bytesRead;
      try {
        ({ bytesRead } = await fileHandle.read(header, 0, header.length, 0));
      } finally {
        await fileHandle.close();
      }

      if (!format || !format.matches(header.subarray(0, bytesRead))) {
        await fs.promises.unlink(req.file.path);
        return res.status(400).json({ success: false, message: 'The uploaded file content does not match an allowed file type.' });
      }
      next();
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Invalid upload cleanup failed:', cleanupError.message);
        }
      }
      next(error);
    }
  };

  return { upload, validateSignature };
};

module.exports = { createFileUpload, imageFormats, pdfFormats };
