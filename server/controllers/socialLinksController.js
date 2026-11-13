const pool = require('../config/db');

const getSocialLinks = async (_req, res, next) => {
  try {
    const [socialLinks] = await pool.execute('SELECT * FROM social_links ORDER BY display_order ASC, id ASC');
    res.json({ success: true, data: socialLinks });
  } catch (error) {
    next(error);
  }
};

const createSocialLink = async (req, res, next) => {
  try {
    const { platform, url, icon_name, display_order } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO social_links (platform, url, icon_name, display_order) VALUES (?, ?, ?, ?)',
      [platform, url, icon_name || null, Number(display_order) || 0]
    );
    const [rows] = await pool.execute('SELECT * FROM social_links WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Social link created.', data: rows[0] });
  } catch (error) {
    next(error);
  }
};

const updateSocialLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { platform, url, icon_name, display_order } = req.body;
    const [existing] = await pool.execute('SELECT id FROM social_links WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Social link not found.' });
    }

    await pool.execute(
      'UPDATE social_links SET platform = ?, url = ?, icon_name = ?, display_order = ? WHERE id = ?',
      [platform, url, icon_name || null, Number(display_order) || 0, id]
    );
    const [rows] = await pool.execute('SELECT * FROM social_links WHERE id = ?', [id]);
    res.json({ success: true, message: 'Social link updated.', data: rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteSocialLink = async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM social_links WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Social link not found.' });
    }
    res.json({ success: true, message: 'Social link deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSocialLinks, createSocialLink, updateSocialLink, deleteSocialLink };
