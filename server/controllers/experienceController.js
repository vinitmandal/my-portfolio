const pool = require('../config/db');

// GET /api/experience
const getExperience = async (req, res, next) => {
  try {
    const [experience] = await pool.execute('SELECT * FROM experience ORDER BY display_order ASC');
    res.json({ success: true, data: experience });
  } catch (error) {
    next(error);
  }
};

// POST /api/experience
const createExperience = async (req, res, next) => {
  try {
    const { title, organization, type, start_date, end_date, description, is_current, display_order } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO experience (title, organization, type, start_date, end_date, description, is_current, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, organization, type, start_date || null, end_date || null, description || null, is_current || false, display_order || 0]
    );

    const [exp] = await pool.execute('SELECT * FROM experience WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Experience entry created successfully.',
      data: exp[0],
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/experience/:id
const updateExperience = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, organization, type, start_date, end_date, description, is_current, display_order } = req.body;

    const [existing] = await pool.execute('SELECT id FROM experience WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Experience entry not found.' });
    }

    await pool.execute(
      'UPDATE experience SET title = ?, organization = ?, type = ?, start_date = ?, end_date = ?, description = ?, is_current = ?, display_order = ? WHERE id = ?',
      [title, organization, type, start_date || null, end_date || null, description || null, is_current || false, display_order || 0, id]
    );

    const [updated] = await pool.execute('SELECT * FROM experience WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Experience entry updated successfully.',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/experience/:id
const deleteExperience = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM experience WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Experience entry not found.' });
    }

    await pool.execute('DELETE FROM experience WHERE id = ?', [id]);

    res.json({ success: true, message: 'Experience entry deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExperience, createExperience, updateExperience, deleteExperience };
