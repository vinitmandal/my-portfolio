const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { hasSecureJwtSecret } = require('../config/security');

const setupLockName = 'portfolio_admin_initial_setup';

const setupStatus = async (_req, res, next) => {
  try {
    const [admins] = await pool.execute('SELECT id FROM admins LIMIT 1');
    const initialized = admins.length > 0;

    res.json({
      success: true,
      data: {
        initialized,
        setupAvailable: !initialized && Boolean(process.env.ADMIN_SETUP_KEY),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createInitialAdmin = async (req, res, next) => {
  const expectedKey = process.env.ADMIN_SETUP_KEY;
  const providedKey = req.body.setup_key;
  if (!expectedKey) {
    return res.status(503).json({
      success: false,
      message: 'Initial admin setup is disabled. Configure ADMIN_SETUP_KEY on the server first.',
    });
  }

  const expectedBuffer = Buffer.from(expectedKey);
  const providedBuffer = Buffer.from(typeof providedKey === 'string' ? providedKey : '');
  if (
    expectedBuffer.length !== providedBuffer.length
    || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return res.status(403).json({ success: false, message: 'The setup key is invalid.' });
  }

  let connection;
  let lockAcquired = false;
  try {
    connection = await pool.getConnection();
    const [lockRows] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [setupLockName]);
    lockAcquired = lockRows[0]?.acquired === 1;
    if (!lockAcquired) {
      return res.status(503).json({ success: false, message: 'Admin setup is busy. Please try again.' });
    }

    await connection.beginTransaction();
    const [admins] = await connection.execute('SELECT id FROM admins LIMIT 1 FOR UPDATE');
    if (admins.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Initial admin setup has already been completed.' });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const [result] = await connection.execute(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      [req.body.username, passwordHash]
    );
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Initial admin account created. Sign in with the credentials you just set.',
      data: { id: result.insertId, username: req.body.username },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Initial admin setup rollback failed:', rollbackError.message);
      }
    }
    next(error);
  } finally {
    if (connection) {
      if (lockAcquired) {
        try {
          await connection.execute('SELECT RELEASE_LOCK(?)', [setupLockName]);
        } catch (releaseError) {
          console.error('Initial admin setup lock release failed:', releaseError.message);
        }
      }
      connection.release();
    }
  }
};

const login = async (req, res, next) => {
  if (!hasSecureJwtSecret()) {
    return res.status(503).json({
      success: false,
      message: 'Authentication is not configured securely. Set a random JWT_SECRET of at least 32 characters.',
    });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash FROM admins WHERE username = ?',
      [req.body.username]
    );

    if (rows.length === 0 || !(await bcrypt.compare(req.body.password, rows[0].password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const admin = rows[0];
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      user: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

const checkAuth = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username FROM admins WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      [profileCount],
      [skillsCount],
      [projectCount],
      [educationCount],
      [experienceCount],
      [certCount],
      [achievementCount],
      [messageCount],
      [unreadCount],
      [recentMessages],
    ] = await Promise.all([
      pool.execute('SELECT COUNT(*) AS total FROM profile'),
      pool.execute('SELECT COUNT(*) AS total FROM skills'),
      pool.execute('SELECT COUNT(*) AS total FROM projects'),
      pool.execute('SELECT COUNT(*) AS total FROM education'),
      pool.execute('SELECT COUNT(*) AS total FROM experience'),
      pool.execute('SELECT COUNT(*) AS total FROM certifications'),
      pool.execute('SELECT COUNT(*) AS total FROM achievements'),
      pool.execute('SELECT COUNT(*) AS total FROM contact_messages'),
      pool.execute('SELECT COUNT(*) AS total FROM contact_messages WHERE is_read = FALSE'),
      pool.execute(
        'SELECT id, name, email, subject, message, is_read, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 5'
      ),
    ]);

    res.json({
      success: true,
      data: {
        admin: { username: req.user.username },
        counts: {
          profile: profileCount[0].total,
          skills: skillsCount[0].total,
          projects: projectCount[0].total,
          education: educationCount[0].total,
          experience: experienceCount[0].total,
          certifications: certCount[0].total,
          achievements: achievementCount[0].total,
          messages: messageCount[0].total,
          unreadMessages: unreadCount[0].total,
        },
        recentMessages,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setupStatus,
  createInitialAdmin,
  login,
  logout,
  checkAuth,
  getDashboardStats,
};
