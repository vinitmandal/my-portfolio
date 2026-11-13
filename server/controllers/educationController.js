const pool = require('../config/db');

// GET /api/education
const getEducation = async (req, res, next) => {
  try {
    const [education] = await pool.execute('SELECT * FROM education ORDER BY display_order ASC');
    res.json({ success: true, data: education });
  } catch (error) {
    next(error);
  }
};

// POST /api/education
const createEducation = async (req, res, next) => {
  try {
    const { degree, institution, board, score, score_type, start_year, end_year, description, display_order } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO education (degree, institution, board, score, score_type, start_year, end_year, description, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [degree, institution, board || null, score || null, score_type || 'percentage', start_year || null, end_year || null, description || null, display_order || 0]
    );

    const [edu] = await pool.execute('SELECT * FROM education WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Education entry created successfully.',
      data: edu[0],
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/education/:id
const updateEducation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { degree, institution, board, score, score_type, start_year, end_year, description, display_order } = req.body;

    const [existing] = await pool.execute('SELECT id FROM education WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Education entry not found.' });
    }

    await pool.execute(
      'UPDATE education SET degree = ?, institution = ?, board = ?, score = ?, score_type = ?, start_year = ?, end_year = ?, description = ?, display_order = ? WHERE id = ?',
      [degree, institution, board || null, score || null, score_type || 'percentage', start_year || null, end_year || null, description || null, display_order || 0, id]
    );

    const [updated] = await pool.execute('SELECT * FROM education WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Education entry updated successfully.',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/education/:id
const deleteEducation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM education WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Education entry not found.' });
    }

    await pool.execute('DELETE FROM education WHERE id = ?', [id]);

    res.json({ success: true, message: 'Education entry deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEducation, createEducation, updateEducation, deleteEducation };
