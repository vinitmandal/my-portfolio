const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const getSafeDocumentPath = (filePath) => {
  const prefix = '/uploads/certifications/';
  if (typeof filePath !== 'string' || !filePath.startsWith(prefix)) return null;
  const filename = filePath.slice(prefix.length);
  if (!filename || path.basename(filename) !== filename) return null;
  return path.join(__dirname, '..', 'uploads', 'certifications', filename);
};

const removeFile = (filePath) => {
  const absolutePath = getSafeDocumentPath(filePath);
  if (absolutePath && fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
};

const removeNewUpload = (file) => {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
};

// GET /api/certifications
const getCertifications = async (req, res, next) => {
  try {
    const [certifications] = await pool.execute('SELECT * FROM certifications ORDER BY display_order ASC');
    res.json({ success: true, data: certifications });
  } catch (error) {
    next(error);
  }
};

// POST /api/certifications
const createCertification = async (req, res, next) => {
  try {
    const { name, issuing_organization, completion_date, credential_url, image_url, display_order } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO certifications (name, issuing_organization, completion_date, credential_url, image_url, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      [name, issuing_organization, completion_date || null, credential_url || null, image_url || null, display_order || 0]
    );

    const [cert] = await pool.execute('SELECT * FROM certifications WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Certification created successfully.',
      data: cert[0],
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/certifications/:id
const updateCertification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, issuing_organization, completion_date, credential_url, image_url, display_order } = req.body;

    const [existing] = await pool.execute('SELECT id, image_url FROM certifications WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Certification not found.' });
    }

    await pool.execute(
      'UPDATE certifications SET name = ?, issuing_organization = ?, completion_date = ?, credential_url = ?, image_url = ?, display_order = ? WHERE id = ?',
      [
        name,
        issuing_organization,
        completion_date || null,
        credential_url || null,
        image_url === undefined ? existing[0].image_url : image_url || null,
        Number(display_order) || 0,
        id,
      ]
    );

    const [updated] = await pool.execute('SELECT * FROM certifications WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Certification updated successfully.',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/certifications/:id
const deleteCertification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id, image_url FROM certifications WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Certification not found.' });
    }

    await pool.execute('DELETE FROM certifications WHERE id = ?', [id]);
    let warning = '';
    try {
      removeFile(existing[0].image_url);
    } catch (cleanupError) {
      warning = 'Certification deleted, but its old document could not be removed from storage.';
      console.error('Deleted certification document cleanup failed:', cleanupError.message);
    }

    res.json({ success: true, message: warning || 'Certification deleted successfully.', warning });
  } catch (error) {
    next(error);
  }
};

const uploadCertificationDocument = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No certification document provided.' });
  }
  if (req.file.originalname.length > 255) {
    removeNewUpload(req.file);
    return res.status(400).json({ success: false, message: 'Filename must be 255 characters or fewer.' });
  }

  let saved = false;
  try {
    const [existing] = await pool.execute('SELECT id, image_url FROM certifications WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      removeNewUpload(req.file);
      return res.status(404).json({ success: false, message: 'Certification not found.' });
    }

    const documentPath = `/uploads/certifications/${req.file.filename}`;
    await pool.execute('UPDATE certifications SET image_url = ? WHERE id = ?', [documentPath, req.params.id]);
    saved = true;
    let warning = '';
    try {
      removeFile(existing[0].image_url);
    } catch (cleanupError) {
      warning = 'Document saved; the previous document could not be removed from storage.';
      console.error('Replaced certification document cleanup failed:', cleanupError.message);
    }
    res.json({
      success: true,
      message: warning || 'Certification document uploaded successfully.',
      data: { image_url: documentPath },
      warning,
    });
  } catch (error) {
    if (!saved) removeNewUpload(req.file);
    next(error);
  }
};

module.exports = {
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  uploadCertificationDocument,
};
