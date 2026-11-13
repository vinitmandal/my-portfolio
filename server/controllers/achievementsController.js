const pool = require('../config/db');

// GET /api/achievements
const getAchievements = async (req, res, next) => {
  try {
    const [achievements] = await pool.execute('SELECT * FROM achievements ORDER BY display_order ASC');
    res.json({ success: true, data: achievements });
  } catch (error) {
    next(error);
  }
};

// POST /api/achievements
const createAchievement = async (req, res, next) => {
  try {
    const { title, organization, description, date, category, display_order } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO achievements (title, organization, description, date, category, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      [title, organization || null, description || null, date || null, category || null, display_order || 0]
    );

    const [achievement] = await pool.execute('SELECT * FROM achievements WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Achievement created successfully.',
      data: achievement[0],
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/achievements/:id
const updateAchievement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, organization, description, date, category, display_order } = req.body;

    const [existing] = await pool.execute('SELECT id FROM achievements WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Achievement not found.' });
    }

    await pool.execute(
      'UPDATE achievements SET title = ?, organization = ?, description = ?, date = ?, category = ?, display_order = ? WHERE id = ?',
      [title, organization || null, description || null, date || null, category || null, display_order || 0, id]
    );

    const [updated] = await pool.execute('SELECT * FROM achievements WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Achievement updated successfully.',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/achievements/:id
const deleteAchievement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM achievements WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Achievement not found.' });
    }

    await pool.execute('DELETE FROM achievements WHERE id = ?', [id]);

    res.json({ success: true, message: 'Achievement deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAchievements, createAchievement, updateAchievement, deleteAchievement };
