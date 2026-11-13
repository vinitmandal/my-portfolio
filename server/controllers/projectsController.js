const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const generateSlug = (title) => title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const normalizeTechnologies = (technologies) => (
  [...new Set(technologies.map((technology) => technology.trim()).filter(Boolean))]
);

const getProjectTechnologies = async (connection, projectId) => {
  const [technologies] = await connection.execute(
    'SELECT technology_name FROM project_technologies WHERE project_id = ? ORDER BY id ASC',
    [projectId]
  );
  return technologies.map((technology) => technology.technology_name);
};

const getSafeUploadPath = (filePath) => {
  if (typeof filePath !== 'string' || !filePath.startsWith('/uploads/')) return null;
  const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
  const absolutePath = path.resolve(uploadsRoot, filePath.slice('/uploads/'.length));
  return absolutePath.startsWith(`${uploadsRoot}${path.sep}`) ? absolutePath : null;
};

const removeUpload = (filePath) => {
  const absolutePath = getSafeUploadPath(filePath);
  if (!absolutePath || !fs.existsSync(absolutePath)) return;
  fs.unlinkSync(absolutePath);
};

const removeNewUpload = (file) => {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
};

const getProjects = async (_req, res, next) => {
  try {
    const [projects] = await pool.execute('SELECT * FROM projects ORDER BY display_order ASC, id ASC');
    const [technologies] = await pool.execute(
      'SELECT project_id, technology_name FROM project_technologies ORDER BY id ASC'
    );
    const technologyMap = new Map();
    technologies.forEach(({ project_id: projectId, technology_name: name }) => {
      if (!technologyMap.has(projectId)) technologyMap.set(projectId, []);
      technologyMap.get(projectId).push(name);
    });

    res.json({
      success: true,
      data: projects.map((project) => ({
        ...project,
        technologies: technologyMap.get(project.id) || [],
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getProjectBySlug = async (req, res, next) => {
  try {
    const [projects] = await pool.execute('SELECT * FROM projects WHERE slug = ?', [req.params.slug]);
    if (projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const project = projects[0];
    const technologies = await getProjectTechnologies(pool, project.id);
    res.json({ success: true, data: { ...project, technologies } });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  let connection;
  try {
    const {
      title,
      slug: requestedSlug,
      description,
      short_description,
      github_url,
      live_url,
      status,
      featured,
      display_order,
      technologies,
    } = req.body;

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO projects
        (title, slug, description, short_description, github_url, live_url, status, featured, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        requestedSlug || generateSlug(title),
        description || null,
        short_description || null,
        github_url || null,
        live_url || null,
        status || 'completed',
        featured ?? false,
        Number(display_order) || 0,
      ]
    );

    if (Array.isArray(technologies)) {
      for (const technology of normalizeTechnologies(technologies)) {
        await connection.execute(
          'INSERT INTO project_technologies (project_id, technology_name) VALUES (?, ?)',
          [result.insertId, technology]
        );
      }
    }

    const [rows] = await connection.execute('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    const savedTechnologies = await getProjectTechnologies(connection, result.insertId);
    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: { ...rows[0], technologies: savedTechnologies },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

const updateProject = async (req, res, next) => {
  let connection;
  try {
    const { id } = req.params;
    const {
      title,
      slug: requestedSlug,
      description,
      short_description,
      github_url,
      live_url,
      status,
      featured,
      display_order,
      technologies,
    } = req.body;

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id FROM projects WHERE id = ?', [id]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await connection.execute(
      `UPDATE projects
       SET title = ?, slug = ?, description = ?, short_description = ?, github_url = ?, live_url = ?,
           status = ?, featured = ?, display_order = ?
       WHERE id = ?`,
      [
        title,
        requestedSlug || generateSlug(title),
        description || null,
        short_description || null,
        github_url || null,
        live_url || null,
        status || 'completed',
        featured ?? false,
        Number(display_order) || 0,
        id,
      ]
    );

    if (Array.isArray(technologies)) {
      await connection.execute('DELETE FROM project_technologies WHERE project_id = ?', [id]);
      for (const technology of normalizeTechnologies(technologies)) {
        await connection.execute(
          'INSERT INTO project_technologies (project_id, technology_name) VALUES (?, ?)',
          [id, technology]
        );
      }
    }

    const [rows] = await connection.execute('SELECT * FROM projects WHERE id = ?', [id]);
    const savedTechnologies = await getProjectTechnologies(connection, id);
    await connection.commit();
    res.json({
      success: true,
      message: 'Project updated successfully.',
      data: { ...rows[0], technologies: savedTechnologies },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const [existing] = await pool.execute('SELECT id, cover_image FROM projects WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await pool.execute('DELETE FROM projects WHERE id = ?', [req.params.id]);
    let warning = '';
    try {
      removeUpload(existing[0].cover_image);
    } catch (cleanupError) {
      warning = 'The project was deleted, but its old image could not be removed from storage.';
      console.error('Deleted project image cleanup failed:', cleanupError.message);
    }
    res.json({ success: true, message: warning || 'Project deleted successfully.', warning });
  } catch (error) {
    next(error);
  }
};

const uploadProjectImage = async (req, res, next) => {
  let saved = false;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    const [existing] = await pool.execute(
      'SELECT id, cover_image FROM projects WHERE id = ?',
      [req.params.id]
    );
    if (existing.length === 0) {
      removeNewUpload(req.file);
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const imagePath = `/uploads/images/${req.file.filename}`;
    await pool.execute('UPDATE projects SET cover_image = ? WHERE id = ?', [imagePath, req.params.id]);
    saved = true;
    let warning = '';
    try {
      removeUpload(existing[0].cover_image);
    } catch (cleanupError) {
      warning = 'Image saved; the previous image could not be removed from storage.';
      console.error('Replaced project image cleanup failed:', cleanupError.message);
    }
    res.json({
      success: true,
      message: warning || 'Project image uploaded successfully.',
      data: { cover_image: imagePath },
      warning,
    });
  } catch (error) {
    if (!saved && req.file) removeNewUpload(req.file);
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectImage,
};
