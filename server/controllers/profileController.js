
const pool = require('../config/db');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../utils/cloudinaryUpload');

const getCloudinaryPublicId = (imageUrl) => {
  if (typeof imageUrl !== 'string') return null;

  try {
    const url = new URL(imageUrl);

    if (url.hostname !== 'res.cloudinary.com') return null;

    const parts = url.pathname.split('/upload/');

    if (parts.length !== 2) return null;

    const pathParts = parts[1].split('/');

    // Remove Cloudinary version number.
    if (pathParts[0]?.startsWith('v') && /^v\d+$/.test(pathParts[0])) {
      pathParts.shift();
    }

    const lastPart = pathParts.pop();

    if (!lastPart) return null;

    // Remove file extension.
    pathParts.push(lastPart.replace(/\.[^.]+$/, ''));

    return pathParts.join('/');
  } catch {
    return null;
  }
};

// GET /api/profile
const getProfile = async (req, res, next) => {
  try {
    const [profile] = await pool.execute(
      'SELECT * FROM profile LIMIT 1'
    );

    const [socialLinks] = await pool.execute(
      'SELECT * FROM social_links ORDER BY display_order ASC'
    );

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
    const {
      full_name,
      title,
      subtitle,
      introduction,
      about_text,
      available_for_opportunities,
    } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM profile LIMIT 1'
    );

    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO profile
        (full_name, title, subtitle, introduction, about_text, available_for_opportunities)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          full_name,
          title,
          subtitle || null,
          introduction || null,
          about_text || null,
          available_for_opportunities ?? true,
        ]
      );
    } else {
      await pool.execute(
        `UPDATE profile
        SET full_name = ?, title = ?, subtitle = ?, introduction = ?,
        about_text = ?, available_for_opportunities = ?
        WHERE id = ?`,
        [
          full_name,
          title,
          subtitle || null,
          introduction || null,
          about_text || null,
          available_for_opportunities ?? true,
          existing[0].id,
        ]
      );
    }

    const [updated] = await pool.execute(
      'SELECT * FROM profile LIMIT 1'
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/profile
const deleteProfile = async (_req, res, next) => {
  try {
    const [existing] = await pool.execute(
      'SELECT id, profile_image FROM profile LIMIT 1'
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.',
      });
    }

    await pool.execute(
      'DELETE FROM profile WHERE id = ?',
      [existing[0].id]
    );

    let warning = '';

    try {
      const publicId = getCloudinaryPublicId(
        existing[0].profile_image
      );

      if (publicId) {
        await deleteFromCloudinary(publicId, 'image');
      }
    } catch (cleanupError) {
      warning = 'Profile deleted, but the old photo could not be removed from Cloudinary.';
      console.error(
        'Deleted profile photo cleanup failed:',
        cleanupError.message
      );
    }

    res.json({
      success: true,
      message: warning || 'Profile deleted.',
      warning,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/profile/image
const uploadProfileImage = async (req, res, next) => {
  let newImage = null;
  let saved = false;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided.',
      });
    }

    const [existing] = await pool.execute(
      'SELECT id, profile_image FROM profile LIMIT 1'
    );

    if (existing.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'Create the profile record before uploading a photo.',
      });
    }

    newImage = await uploadToCloudinary(req.file, {
      folder: 'images',
      prefix: 'profile',
      resourceType: 'image',
    });

    await pool.execute(
      'UPDATE profile SET profile_image = ? WHERE id = ?',
      [newImage.url, existing[0].id]
    );

    saved = true;

    let warning = '';

    try {
      const oldPublicId = getCloudinaryPublicId(
        existing[0].profile_image
      );

      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId, 'image');
      }
    } catch (cleanupError) {
      warning = 'Photo saved, but the previous photo could not be removed from Cloudinary.';
      console.error(
        'Replaced profile photo cleanup failed:',
        cleanupError.message
      );
    }

    res.json({
      success: true,
      message: warning || 'Profile image uploaded successfully.',
      data: {
        profile_image: newImage.url,
      },
      warning,
    });
  } catch (error) {
    if (!saved && newImage?.publicId) {
      try {
        await deleteFromCloudinary(newImage.publicId, 'image');
      } catch (cleanupError) {
        console.error(
          'New profile image cleanup failed:',
          cleanupError.message
        );
      }
    }

    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  uploadProfileImage,
};
