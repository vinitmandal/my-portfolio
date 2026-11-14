
const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../utils/cloudinaryUpload');

// Get safe path for existing local documents
const getSafeDocumentPath = (filePath) => {
  const prefix = '/uploads/certifications/';

  if (typeof filePath !== 'string' || !filePath.startsWith(prefix)) {
    return null;
  }

  const filename = filePath.slice(prefix.length);

  if (!filename || path.basename(filename) !== filename) {
    return null;
  }

  return path.join(
    __dirname,
    '..',
    'uploads',
    'certifications',
    filename
  );
};

// Extract Cloudinary public ID from a raw PDF URL
const getCloudinaryPublicId = (fileUrl) => {
  try {
    const parsedUrl = new URL(fileUrl);

    if (parsedUrl.hostname !== 'res.cloudinary.com') {
      return null;
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    const uploadIndex = segments.indexOf('upload');

    if (
      uploadIndex === -1 ||
      segments[uploadIndex - 1] !== 'raw'
    ) {
      return null;
    }

    let publicIdSegments = segments.slice(uploadIndex + 1);

    // Remove Cloudinary version segment if present
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

// Remove old local or Cloudinary document
const removeStoredDocument = async (fileUrl) => {
  if (typeof fileUrl !== 'string' || !fileUrl) return;

  const publicId = getCloudinaryPublicId(fileUrl);

  if (publicId) {
    await deleteFromCloudinary(publicId, 'raw');
    return;
  }

  const absolutePath = getSafeDocumentPath(fileUrl);

  if (absolutePath && fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

// GET /api/certifications
const getCertifications = async (req, res, next) => {
  try {
    const [certifications] = await pool.execute(
      'SELECT * FROM certifications ORDER BY display_order ASC'
    );

    res.json({
      success: true,
      data: certifications,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/certifications
const createCertification = async (req, res, next) => {
  try {
    const {
      name,
      issuing_organization,
      completion_date,
      credential_url,
      image_url,
      display_order,
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO certifications
      (name, issuing_organization, completion_date, credential_url, image_url, display_order)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        issuing_organization,
        completion_date || null,
        credential_url || null,
        image_url || null,
        display_order || 0,
      ]
    );

    const [cert] = await pool.execute(
      'SELECT * FROM certifications WHERE id = ?',
      [result.insertId]
    );

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

    const {
      name,
      issuing_organization,
      completion_date,
      credential_url,
      image_url,
      display_order,
    } = req.body;

    const [existing] = await pool.execute(
      'SELECT id, image_url FROM certifications WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found.',
      });
    }

    await pool.execute(
      `UPDATE certifications
      SET name = ?, issuing_organization = ?, completion_date = ?,
      credential_url = ?, image_url = ?, display_order = ?
      WHERE id = ?`,
      [
        name,
        issuing_organization,
        completion_date || null,
        credential_url || null,
        image_url === undefined
          ? existing[0].image_url
          : image_url || null,
        Number(display_order) || 0,
        id,
      ]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM certifications WHERE id = ?',
      [id]
    );

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

    const [existing] = await pool.execute(
      'SELECT id, image_url FROM certifications WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found.',
      });
    }

    await pool.execute(
      'DELETE FROM certifications WHERE id = ?',
      [id]
    );

    let warning = '';

    try {
      await removeStoredDocument(existing[0].image_url);
    } catch (cleanupError) {
      warning = 'Certification deleted, but its old document could not be removed from storage.';
      console.error(
        'Certification document cleanup failed:',
        cleanupError.message
      );
    }

    res.json({
      success: true,
      message: warning || 'Certification deleted successfully.',
      warning,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/certifications/:id/document
const uploadCertificationDocument = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No certification document provided.',
    });
  }

  if (req.file.originalname.length > 255) {
    return res.status(400).json({
      success: false,
      message: 'Filename must be 255 characters or fewer.',
    });
  }

  let uploadedDocument = null;

  try {
    const [existing] = await pool.execute(
      'SELECT id, image_url FROM certifications WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found.',
      });
    }

    // Upload PDF to Cloudinary as a raw resource
    uploadedDocument = await uploadToCloudinary(req.file, {
      folder: 'certifications',
      prefix: 'certificate',
      resourceType: 'raw',
    });

    // Save Cloudinary URL in the existing image_url column
    await pool.execute(
      'UPDATE certifications SET image_url = ? WHERE id = ?',
      [uploadedDocument.url, req.params.id]
    );

    let warning = '';

    // Delete previous document only after successful DB update
    try {
      await removeStoredDocument(existing[0].image_url);
    } catch (cleanupError) {
      warning = 'Document saved, but the previous document could not be removed from storage.';
      console.error(
        'Replaced certification document cleanup failed:',
        cleanupError.message
      );
    }

    res.json({
      success: true,
      message: warning || 'Certification document uploaded successfully.',
      data: {
        image_url: uploadedDocument.url,
      },
      warning,
    });
  } catch (error) {
    // Remove newly uploaded Cloudinary document if DB update fails
    if (uploadedDocument?.publicId) {
      try {
        await deleteFromCloudinary(
          uploadedDocument.publicId,
          'raw'
        );
      } catch (cleanupError) {
        console.error(
          'Failed to clean up new Cloudinary document:',
          cleanupError.message
        );
      }
    }

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
