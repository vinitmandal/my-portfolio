
const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../utils/cloudinaryUpload');

const resolveResumePath = (filePath) => {
  const prefix = '/uploads/resume/';

  if (typeof filePath !== 'string' || !filePath.startsWith(prefix)) {
    return null;
  }

  const filename = filePath.slice(prefix.length);

  if (!filename || path.basename(filename) !== filename) {
    return null;
  }

  return path.join(__dirname, '..', 'uploads', 'resume', filename);
};

const getCloudinaryPublicId = (fileUrl) => {
  try {
    const parsedUrl = new URL(fileUrl);

    if (parsedUrl.hostname !== 'res.cloudinary.com') return null;

    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    const uploadIndex = segments.indexOf('upload');

    if (
      uploadIndex === -1 ||
      segments[uploadIndex - 1] !== 'raw'
    ) {
      return null;
    }

    let publicIdSegments = segments.slice(uploadIndex + 1);

    if (/^v\d+$/.test(publicIdSegments[0] || '')) {
      publicIdSegments = publicIdSegments.slice(1);
    }

    return publicIdSegments.length
      ? decodeURIComponent(publicIdSegments.join('/'))
      : null;
  } catch {
    return null;
  }
};

const removeStoredResume = async (filePath) => {
  if (typeof filePath !== 'string' || !filePath) return;

  const publicId = getCloudinaryPublicId(filePath);

  if (publicId) {
    await deleteFromCloudinary(publicId, 'raw');
    return;
  }

  const absolutePath = resolveResumePath(filePath);

  if (absolutePath) {
    try {
      await fs.promises.unlink(absolutePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
};

const getLatestResume = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM resume ORDER BY uploaded_at DESC LIMIT 1'
  );

  return rows[0] || null;
};

const getResume = async (_req, res, next) => {
  try {
    const resume = await getLatestResume();

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume uploaded yet.',
      });
    }

    res.json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
};

const downloadResume = async (_req, res, next) => {
  try {
    const resume = await getLatestResume();

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume uploaded yet.',
      });
    }

    if (getCloudinaryPublicId(resume.file_path)) {
      return res.redirect(302, resume.file_path);
    }

    const filePath = resolveResumePath(resume.file_path);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on server.',
      });
    }

    res.download(filePath, resume.original_name);
  } catch (error) {
    next(error);
  }
};

const previewResume = async (_req, res, next) => {
  try {
    const resume = await getLatestResume();

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume uploaded yet.',
      });
    }

    if (getCloudinaryPublicId(resume.file_path)) {
      return res.redirect(302, resume.file_path);
    }

    const filePath = resolveResumePath(resume.file_path);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on server.',
      });
    }

    const configuredOrigin =
      process.env.CORS_ORIGIN || 'http://localhost:5173';

    const frameOrigin = new URL(configuredOrigin).origin;

    res.removeHeader('X-Frame-Options');
    res.setHeader(
      'Content-Security-Policy',
      `frame-ancestors 'self' ${frameOrigin}`
    );

    res.type('application/pdf');

    res.sendFile(filePath, (error) => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
};

const uploadResume = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No resume file provided.',
    });
  }

  if (req.file.originalname.length > 255) {
    return res.status(400).json({
      success: false,
      message: 'Resume filename must be 255 characters or fewer.',
    });
  }

  let connection;
  let uploadedResume = null;

  try {
    // Upload PDF to Cloudinary
    uploadedResume = await uploadToCloudinary(req.file, {
      folder: 'resume',
      prefix: 'resume',
      resourceType: 'raw',
    });

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [oldResumes] = await connection.execute(
      'SELECT id, file_path FROM resume FOR UPDATE'
    );

    const [result] = await connection.execute(
      'INSERT INTO resume (file_path, original_name) VALUES (?, ?)',
      [uploadedResume.url, req.file.originalname]
    );

    await connection.execute(
      'DELETE FROM resume WHERE id <> ?',
      [result.insertId]
    );

    const [rows] = await connection.execute(
      'SELECT * FROM resume WHERE id = ?',
      [result.insertId]
    );

    await connection.commit();

    let warning = '';

    for (const oldResume of oldResumes) {
      if (oldResume.file_path !== uploadedResume.url) {
        try {
          await removeStoredResume(oldResume.file_path);
        } catch (cleanupError) {
          warning = 'Resume replaced; an older file could not be removed from storage.';
          console.error(
            'Replaced resume cleanup failed:',
            cleanupError.message
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      message: warning || 'Resume uploaded successfully.',
      data: rows[0],
      warning,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Resume transaction rollback failed:', rollbackError.message);
      }
    }

    if (uploadedResume?.publicId) {
      try {
        await deleteFromCloudinary(uploadedResume.publicId, 'raw');
      } catch (cleanupError) {
        console.error(
          'New resume cleanup failed:',
          cleanupError.message
        );
      }
    }

    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getResume,
  downloadResume,
  previewResume,
  uploadResume,
};
