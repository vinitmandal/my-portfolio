const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const resolveResumePath = (filePath) => {
  const prefix = '/uploads/resume/';
  if (typeof filePath !== 'string' || !filePath.startsWith(prefix)) return null;
  const filename = filePath.slice(prefix.length);
  if (!filename || path.basename(filename) !== filename) return null;
  return path.join(__dirname, '..', 'uploads', 'resume', filename);
};

const removeFile = async (filePath) => {
  const absolutePath = resolveResumePath(filePath);
  if (!absolutePath) return;
  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

const removeNewUpload = async (file) => {
  if (!file?.path) return;
  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

const getResume = async (_req, res, next) => {
  try {
    const [resume] = await pool.execute('SELECT * FROM resume ORDER BY uploaded_at DESC LIMIT 1');
    if (resume.length === 0) {
      return res.status(404).json({ success: false, message: 'No resume uploaded yet.' });
    }
    res.json({ success: true, data: resume[0] });
  } catch (error) {
    next(error);
  }
};

const downloadResume = async (_req, res, next) => {
  try {
    const [resume] = await pool.execute('SELECT * FROM resume ORDER BY uploaded_at DESC LIMIT 1');
    if (resume.length === 0) {
      return res.status(404).json({ success: false, message: 'No resume uploaded yet.' });
    }

    const filePath = resolveResumePath(resume[0].file_path);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Resume file not found on server.' });
    }
    res.download(filePath, resume[0].original_name);
  } catch (error) {
    next(error);
  }
};

const previewResume = async (_req, res, next) => {
  try {
    const [resume] = await pool.execute('SELECT * FROM resume ORDER BY uploaded_at DESC LIMIT 1');
    if (resume.length === 0) {
      return res.status(404).json({ success: false, message: 'No resume uploaded yet.' });
    }

    const filePath = resolveResumePath(resume[0].file_path);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Resume file not found on server.' });
    }

    const configuredOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const frameOrigin = new URL(configuredOrigin).origin;
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${frameOrigin}`);
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
    return res.status(400).json({ success: false, message: 'No resume file provided.' });
  }
  if (req.file.originalname.length > 255) {
    await removeNewUpload(req.file);
    return res.status(400).json({ success: false, message: 'Resume filename must be 255 characters or fewer.' });
  }

  let connection;
  try {
    const filePath = `/uploads/resume/${req.file.filename}`;
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [oldResumes] = await connection.execute('SELECT id, file_path FROM resume FOR UPDATE');
    const [result] = await connection.execute(
      'INSERT INTO resume (file_path, original_name) VALUES (?, ?)',
      [filePath, req.file.originalname]
    );
    await connection.execute('DELETE FROM resume WHERE id <> ?', [result.insertId]);
    const [rows] = await connection.execute('SELECT * FROM resume WHERE id = ?', [result.insertId]);
    await connection.commit();

    let warning = '';
    for (const oldResume of oldResumes) {
      if (oldResume.file_path !== filePath) {
        try {
          await removeFile(oldResume.file_path);
        } catch (cleanupError) {
          warning = 'Resume replaced; an older file could not be removed from storage.';
          console.error('Replaced resume cleanup failed:', cleanupError.message);
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
    if (connection) await connection.rollback();
    try {
      await removeNewUpload(req.file);
    } catch (cleanupError) {
      console.error('Failed resume upload cleanup:', cleanupError.message);
    }
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getResume, downloadResume, previewResume, uploadResume };
