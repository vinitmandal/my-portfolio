# Personal Portfolio Website

A responsive personal portfolio website built to showcase my profile, technical skills, education, projects, achievements, and professional experience.

## Features

- Responsive portfolio website
- Dynamic profile and project information
- Project detail pages
- Admin dashboard for managing portfolio content
- Admin authentication
- Contact form
- Resume and image uploads

## Tech Stack

**Frontend:** React, Vite, JavaScript, CSS

**Backend:** Node.js, Express.js

**Database:** MySQL

**Tools:** Git, GitHub, VS Code

## Project Structure

```text
Portfolio1/
├── client/       # React frontend
├── server/       # Express backend
├── README.md
└── PROJECT_AUDIT.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/vinitmandal/my-portfolio.git
cd my-portfolio
cd Portfolio1
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create `server/.env` using `server/.env.example` as a reference. Add your own database credentials and a strong JWT secret.

### 5. Set up the database

Create the MySQL database and run the SQL migration in `server/migrations/`.

### 6. Start the backend

```bash
cd server
npm start
```

### 7. Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

## Security

- Environment files and credentials are excluded from Git.
- Uploaded files and dependency folders are excluded from Git.
- Admin routes require authentication.

## Project Status

Under development. Deployment and production configuration are pending.