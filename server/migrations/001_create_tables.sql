CREATE DATABASE IF NOT EXISTS vinit_portfolio;
USE vinit_portfolio;

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Profile table
CREATE TABLE IF NOT EXISTS profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  title VARCHAR(150) NOT NULL,
  subtitle VARCHAR(200),
  introduction TEXT,
  about_text TEXT,
  profile_image VARCHAR(255),
  available_for_opportunities BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Social links table
CREATE TABLE IF NOT EXISTS social_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  url VARCHAR(500) NOT NULL,
  icon_name VARCHAR(50),
  display_order INT DEFAULT 0
) ENGINE=InnoDB;

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('programming', 'frontend', 'backend', 'database', 'tools') NOT NULL,
  icon_name VARCHAR(50),
  display_order INT DEFAULT 0
) ENGINE=InnoDB;

-- Education table
CREATE TABLE IF NOT EXISTS education (
  id INT AUTO_INCREMENT PRIMARY KEY,
  degree VARCHAR(150) NOT NULL,
  institution VARCHAR(200) NOT NULL,
  board VARCHAR(100),
  score DECIMAL(5,2),
  score_type ENUM('cgpa', 'percentage') DEFAULT 'percentage',
  start_year INT,
  end_year INT,
  description TEXT,
  display_order INT DEFAULT 0
) ENGINE=InnoDB;

-- Experience table
CREATE TABLE IF NOT EXISTS experience (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  organization VARCHAR(200) NOT NULL,
  type ENUM('internship', 'job', 'project_experience') NOT NULL,
  start_date DATE,
  end_date DATE,
  description TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0
) ENGINE=InnoDB;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(170) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(300),
  cover_image VARCHAR(255),
  github_url VARCHAR(500),
  live_url VARCHAR(500),
  status ENUM('completed', 'in_progress', 'planned') DEFAULT 'completed',
  featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Project technologies junction table
CREATE TABLE IF NOT EXISTS project_technologies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  technology_name VARCHAR(100) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  issuing_organization VARCHAR(200) NOT NULL,
  completion_date DATE,
  credential_url VARCHAR(500),
  image_url VARCHAR(255),
  display_order INT DEFAULT 0
) ENGINE=InnoDB;

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  organization VARCHAR(200),
  description TEXT,
  date DATE,
  category VARCHAR(100),
  display_order INT DEFAULT 0
) ENGINE=InnoDB;

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Resume table
CREATE TABLE IF NOT EXISTS resume (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_path VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
