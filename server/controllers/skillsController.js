const pool = require('../config/db');

// GET /api/skills
const getSkills = async (req, res, next) => {
  try {
    const [skills] = await pool.execute('SELECT * FROM skills ORDER BY category, display_order ASC');

    // Group by category
    const grouped = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {});

    res.json({ success: true, data: grouped });
  } catch (error) {
    next(error);
  }
};

// POST /api/skills
const createSkill = async (req, res, next) => {
  try {
    const { name, category, icon_name, display_order } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO skills (name, category, icon_name, display_order) VALUES (?, ?, ?, ?)',
      [name, category, icon_name || null, display_order || 0]
    );

    const [skill] = await pool.execute('SELECT * FROM skills WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Skill created successfully.',
      data: skill[0],
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/skills/:id
const updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, icon_name, display_order } = req.body;

    const [existing] = await pool.execute('SELECT id FROM skills WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    await pool.execute(
      'UPDATE skills SET name = ?, category = ?, icon_name = ?, display_order = ? WHERE id = ?',
      [name, category, icon_name || null, display_order || 0, id]
    );

    const [updated] = await pool.execute('SELECT * FROM skills WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Skill updated successfully.',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/skills/:id
const deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM skills WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    await pool.execute('DELETE FROM skills WHERE id = ?', [id]);

    res.json({ success: true, message: 'Skill deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSkills, createSkill, updateSkill, deleteSkill };
