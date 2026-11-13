const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const database = process.env.DB_NAME || 'vinit_portfolio';
const tableNames = [
  'admins',
  'profile',
  'social_links',
  'skills',
  'education',
  'experience',
  'projects',
  'project_technologies',
  'certifications',
  'achievements',
  'contact_messages',
  'resume',
];

async function insertIfMissing(connection, counts, table, lookup, lookupParams, insert, insertParams) {
  const [existing] = await connection.execute(
    `SELECT id FROM ${table} WHERE ${lookup} LIMIT 1`,
    lookupParams
  );

  if (existing.length) {
    return { id: existing[0].id, inserted: false };
  }

  const [result] = await connection.execute(insert, insertParams);
  counts[table] = (counts[table] || 0) + 1;
  return { id: result.insertId, inserted: true };
}

async function seed() {
  const onlineFoodDescription = process.env.ONLINE_FOOD_PROJECT_DESCRIPTION?.trim() || null;
  const onlineFoodRepository = process.env.ONLINE_FOOD_PROJECT_GITHUB_URL?.trim() || null;
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
  });
  const inserted = {};

  try {
    await connection.beginTransaction();

    await insertIfMissing(
      connection,
      inserted,
      'profile',
      'full_name = ?',
      ['Vinit Kumar Mandal'],
      `INSERT INTO profile
        (full_name, title, subtitle, introduction, about_text, available_for_opportunities)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'Vinit Kumar Mandal',
        'Aspiring Software Engineer | Full-Stack Developer',
        'Madhubani, Bihar, India',
        'B.Tech Computer Science and Engineering | Graduating 2027 | CGPA: 7.57',
        null,
        null,
      ]
    );

    const skillGroups = {
      programming: ['Java', 'C', 'C++', 'Python', 'JavaScript'],
      frontend: ['HTML5', 'CSS3', 'React.js', 'Bootstrap', 'Tailwind CSS'],
      backend: ['Core Java', 'Node.js', 'Express.js', 'Spring Framework', 'Spring Boot', 'JDBC'],
      database: ['MySQL', 'PostgreSQL', 'DBMS'],
      tools: ['Git', 'GitHub', 'VS Code', 'IntelliJ IDEA', 'Firebase', 'Netlify'],
    };

    for (const [category, names] of Object.entries(skillGroups)) {
      for (const [index, name] of names.entries()) {
        await insertIfMissing(
          connection,
          inserted,
          'skills',
          'name = ? AND category = ?',
          [name, category],
          'INSERT INTO skills (name, category, display_order) VALUES (?, ?, ?)',
          [name, category, index + 1]
        );
      }
    }

    const education = [
      {
        degree: 'Class XII',
        institution: 'R.K. College Madhuban',
        board: 'BSEB',
        score: 82.8,
        score_type: 'percentage',
        start_year: null,
        end_year: 2021,
        description: '414/500',
      },
      {
        degree: 'Class X',
        institution: 'I.S. Public School, Hisar',
        board: 'CBSE',
        score: 81,
        score_type: 'percentage',
        start_year: null,
        end_year: null,
        description: '405/500',
      },
    ];

    const collegeName = process.env.PORTFOLIO_COLLEGE_NAME?.trim();
    if (collegeName) {
      education.push({
        degree: 'B.Tech Computer Science and Engineering',
        institution: collegeName,
        board: null,
        score: 7.57,
        score_type: 'cgpa',
        start_year: null,
        end_year: 2027,
        description: null,
      });
    } else {
      console.warn('Skipped B.Tech education row: set PORTFOLIO_COLLEGE_NAME when the college name is confirmed.');
    }

    for (const [index, item] of education.entries()) {
      await insertIfMissing(
        connection,
        inserted,
        'education',
        'degree = ? AND institution = ?',
        [item.degree, item.institution],
        `INSERT INTO education
          (degree, institution, board, score, score_type, start_year, end_year, description, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.degree,
          item.institution,
          item.board,
          item.score,
          item.score_type,
          item.start_year,
          item.end_year,
          item.description,
          index + 1,
        ]
      );
    }

    const experience = [
      {
        title: 'Java Full Stack Developer Virtual Internship',
        organization: 'EduSkills',
        type: 'internship',
      },
      {
        title: 'Google Cloud Serverless Application',
        organization: 'Practical project/learning experience',
        type: 'project_experience',
      },
    ];

    for (const [index, item] of experience.entries()) {
      await insertIfMissing(
        connection,
        inserted,
        'experience',
        'title = ? AND organization = ?',
        [item.title, item.organization],
        `INSERT INTO experience
          (title, organization, type, start_date, end_date, description, is_current, display_order)
         VALUES (?, ?, ?, NULL, NULL, NULL, FALSE, ?)`,
        [item.title, item.organization, item.type, index + 1]
      );
    }

    const projects = [
      {
        title: 'StudyTalk',
        slug: 'studytalk',
        description: 'Real-time messaging, voice communication, group creation, study-material sharing, and collaborative learning.',
        short_description: 'Student Communication and Learning Platform',
        github_url: null,
        live_url: null,
        status: 'in_progress',
        featured: false,
        technologies: ['React.js', 'Java', 'Spring Boot', 'Firebase', 'WebRTC', 'Socket.IO', 'Tailwind CSS'],
      },
      {
        title: 'Online Food Ordering System',
        slug: 'online-food-ordering-system',
        description: onlineFoodDescription,
        short_description: 'August 2025 – November 2025',
        github_url: onlineFoodRepository,
        live_url: null,
        status: null,
        featured: false,
        technologies: [],
      },
    ];

    for (const [index, project] of projects.entries()) {
      const existing = await connection.execute(
        'SELECT id FROM projects WHERE slug = ? LIMIT 1',
        [project.slug]
      );
      let projectId;

      if (existing[0].length) {
        projectId = existing[0][0].id;
        if (project.slug === 'online-food-ordering-system' && (onlineFoodDescription || onlineFoodRepository)) {
          await connection.execute(
            `UPDATE projects
             SET description = COALESCE(description, ?), github_url = COALESCE(github_url, ?)
             WHERE id = ?`,
            [onlineFoodDescription, onlineFoodRepository, projectId]
          );
        }
      } else {
        const [result] = await connection.execute(
          `INSERT INTO projects
            (title, slug, description, short_description, github_url, live_url, status, featured, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            project.title,
            project.slug,
            project.description,
            project.short_description,
            project.github_url,
            project.live_url,
            project.status,
            project.featured,
            index + 1,
          ]
        );
        projectId = result.insertId;
        inserted.projects = (inserted.projects || 0) + 1;
      }

      for (const technology of project.technologies) {
        await insertIfMissing(
          connection,
          inserted,
          'project_technologies',
          'project_id = ? AND technology_name = ?',
          [projectId, technology],
          'INSERT INTO project_technologies (project_id, technology_name) VALUES (?, ?)',
          [projectId, technology]
        );
      }
    }

    const achievements = [
      { title: 'Governor', organization: 'EDC', description: 'July 2026 – Present', category: 'leadership' },
      { title: 'Governor', organization: 'CODEVISION', category: 'leadership' },
      { title: 'Governor', organization: 'ROBONIXX', category: 'leadership' },
      { title: 'IEEE Student Member', category: 'membership' },
      { title: 'TECHNO FEST organizer', category: 'organizer' },
      { title: 'CodeStorm coding competition', category: 'competition' },
      { title: 'Console 2k25', category: 'event' },
      { title: 'Python Bootcamp', category: 'training' },
    ];

    for (const [index, item] of achievements.entries()) {
      const organization = item.organization || null;
      await insertIfMissing(
        connection,
        inserted,
        'achievements',
        'title = ? AND organization <=> ?',
        [item.title, organization],
        `INSERT INTO achievements
          (title, organization, description, date, category, display_order)
         VALUES (?, ?, ?, NULL, ?, ?)`,
        [item.title, organization, item.description || null, item.category, index + 1]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }

  console.log('\nSeed completed. Inserted this run:');
  for (const table of ['profile', 'skills', 'education', 'experience', 'projects', 'project_technologies', 'achievements']) {
    console.log(`  ${table}: ${inserted[table] || 0}`);
  }
  console.log('  social_links: 0 (no verified URLs were supplied)');
  console.log('  certifications: 0 (no certificates were supplied for verification)');
  console.log('  admins: unchanged');
  console.log('\nCurrent database record counts:');

  const countConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
  });
  try {
    for (const table of tableNames) {
      const [rows] = await countConnection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
      console.log(`  ${table}: ${rows[0].count}`);
    }
  } finally {
    await countConnection.end();
  }

  if (!onlineFoodDescription) {
    console.warn('\nOnline Food Ordering System description is still unset; add it to server/.env after verification.');
  }
  if (!onlineFoodRepository) {
    console.warn('Online Food Ordering System repository URL is still unset; add it to server/.env after verification.');
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
});
