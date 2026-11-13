const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const getSafeImagePath = (imagePath) => {
  const prefix = '/uploads/images/';
  if (typeof imagePath !== 'string' || !imagePath.startsWith(prefix)) return null;
  const filename = imagePath.slice(prefix.length);
  if (!filename || path.basename(filename) !== filename) return null;
  return path.join(__dirname, '..', 'uploads', 'images', filename);
};

const removeUploadedFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
};

// GET /api/profile
const getProfile = async (req, res, next) => {
  try {
    const [profile] = await pool.execute('SELECT * FROM profile LIMIT 1');
    const [socialLinks] = await pool.execute('SELECT * FROM social_links ORDER BY display_order ASC');

    res.json({
      success: true,
      data: {
        profile: profile[0] || null,
        socialLinks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/profile
const updateProfile = async (req, res, next) => {
  try {
    const { full_name, title, subtitle, introduction, about_text, available_for_opportunities } = req.body;

    const [existing] = await pool.execute('SELECT id FROM profile LIMIT 1');

    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO profile (full_name, title, subtitle, introduction, about_text, available_for_opportunities)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [full_name, title, subtitle || null, introduction || null, about_text || null, available_for_opportunities ?? true]
      );
    } else {
      await pool.execute(
        `UPDATE profile SET full_name = ?, title = ?, subtitle = ?, introduction = ?, about_text = ?, available_for_opportunities = ? WHERE id = ?`,
        [full_name, title, subtitle || null, introduction || null, about_text || null, available_for_opportunities ?? true, existing[0].id]
      );
    }

    const [updated] = await pool.execute('SELECT * FROM profile LIMIT 1');

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (_req, res, next) => {
  try {
    const [existing] = await pool.execute('SELECT id, profile_image FROM profile LIMIT 1');
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    await pool.execute('DELETE FROM profile WHERE id = ?', [existing[0].id]);
    const imagePath = getSafeImagePath(existing[0].profile_image);
    let warning = '';
    try {
      if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    } catch (cleanupError) {
      warning = 'Profile deleted, but the old photo could not be removed from storage.';
      console.error('Deleted profile photo cleanup failed:', cleanupError.message);
    }
    res.json({ success: true, message: warning || 'Profile deleted.', warning });
  } catch (error) {
    next(error);
  }
};

// POST /api/profile/image
const uploadProfileImage = async (req, res, next) => {
  let saved = false;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    const [existing] = await pool.execute('SELECT id, profile_image FROM profile LIMIT 1');
    if (existing.length === 0) {
      removeUploadedFile(req.file);
      return res.status(409).json({ success: false, message: 'Create the profile record before uploading a photo.' });
    }

    const imagePath = `/uploads/images/${req.file.filename}`;
    await pool.execute('UPDATE profile SET profile_image = ? WHERE id = ?', [imagePath, existing[0].id]);
    saved = true;
    const oldImage = getSafeImagePath(existing[0].profile_image);
    let warning = '';
    try {
      if (oldImage && fs.existsSync(oldImage)) fs.unlinkSync(oldImage);
    } catch (cleanupError) {
      warning = 'Photo saved; the previous photo could not be removed from storage.';
      console.error('Replaced profile photo cleanup failed:', cleanupError.message);
    }

    res.json({
      success: true,
      message: warning || 'Profile image uploaded successfully.',
      data: { profile_image: imagePath },
      warning,
    });
  } catch (error) {
    if (!saved && req.file) removeUploadedFile(req.file);
    next(error);
  }
};

module.exports = { getProfile, updateProfile, deleteProfile, uploadProfileImage };
