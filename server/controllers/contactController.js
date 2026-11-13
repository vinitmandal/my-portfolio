const pool = require('../config/db');

// POST /api/contact
const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. I will get back to you soon!',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/contact
const getMessages = async (req, res, next) => {
  try {
    const [messages] = await pool.execute('SELECT * FROM contact_messages ORDER BY created_at DESC');

    const [unreadCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM contact_messages WHERE is_read = FALSE'
    );

    res.json({
      success: true,
      data: {
        messages,
        unreadCount: unreadCount[0].count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/contact/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM contact_messages WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const isRead = req.body.is_read === undefined
      ? true
      : req.body.is_read === true || req.body.is_read === 'true';
    await pool.execute('UPDATE contact_messages SET is_read = ? WHERE id = ?', [isRead, id]);

    res.json({
      success: true,
      message: isRead ? 'Message marked as read.' : 'Message marked as unread.',
      data: { id: Number(id), is_read: isRead },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/contact/:id
const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM contact_messages WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    await pool.execute('DELETE FROM contact_messages WHERE id = ?', [id]);

    res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContact, getMessages, markAsRead, deleteMessage };
