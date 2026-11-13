# Portfolio Website

A full-stack personal portfolio website with a public-facing profile and a protected admin area. The public site presents profile information, skills, education, experience, projects, certifications, leadership activities, and a contact form.

## Who is this for?

- **Visitors and recruiters** can review the portfolio and send a message through the contact form.
- **The portfolio owner** can sign in to the admin area and view dashboard information.
- **Developers and students** can use the project as a learning example or adapt it into their own portfolio.

## Technologies

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Axios, Framer Motion, Lucide React |
| Backend | Node.js, Express 5 |
| Database | MySQL with `mysql2` |
| Authentication and security | JWT, bcryptjs, Helmet, CORS, express-rate-limit, express-validator |
| Quality tools | Oxlint |

## Requirements

- Node.js and npm
- MySQL server
- A terminal with two windows/tabs to run the frontend and backend

## Run locally

### 1. Configure the backend

Open a terminal in the project root and install the server dependencies:

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Edit `server/.env` and set your MySQL username and password. Replace `JWT_SECRET` with a random value of at least 32 characters. Generate one in PowerShell with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

The database name defaults to `vinit_portfolio`.

### One-time administrator setup

The project does not ship with a default admin username or password. If the `admins` table is empty, create a temporary random setup key:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Put that value in `ADMIN_SETUP_KEY` in `server/.env`, restart the backend, open `http://localhost:5173/admin/setup`, and create the administrator using the setup key and a unique password of at least 12 characters. The setup endpoint is rate-limited and refuses to create another admin once the first exists. Remove `ADMIN_SETUP_KEY` from `server/.env` and restart the backend after setup.

Sign in at `http://localhost:5173/admin/login`. Admin sessions use an HttpOnly cookie; the browser does not persist the JWT in local storage.

If the database tables have not been created yet, run `server/migrations/001_create_tables.sql` using MySQL Workbench. The seed script expects the database and tables to exist.

### Populate portfolio data

From the `server` directory, run:

```powershell
npm run seed
```

The seed inserts the supplied profile, skills, education, experience, projects, project technologies, and achievements. It is safe to run again: existing matching rows are preserved, missing rows are added, and it does not delete records, create or change admin credentials, or add unverified certificates or social links. It prints inserted and current table counts when it completes.

Some facts were not provided. Leave these settings unset until verified; the corresponding fields stay empty and the B.Tech education row is skipped until a college name is supplied:

```env
PORTFOLIO_COLLEGE_NAME=
ONLINE_FOOD_PROJECT_DESCRIPTION=
ONLINE_FOOD_PROJECT_GITHUB_URL=
```

Add verified values to `server/.env`, then run `npm run seed` again. The script only fills missing Online Food Ordering System description/repository fields; it does not replace existing values. The actual college name is required to add the B.Tech education row.

Start the backend:

```powershell
npm run dev
```

The API runs at `http://localhost:5000`. You can check it at `http://localhost:5000/api/health`.

### 2. Configure and run the frontend

In a second terminal, from the project root:

```powershell
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

The frontend uses `http://localhost:5000/api` by default. To use a different API URL, create `client/.env` and set:

```env
VITE_API_URL=http://localhost:5000/api
```

The backend's `CORS_ORIGIN` should match the frontend's local URL (the default is `http://localhost:5173`).

## Useful commands

Run these from the `client` directory:

```powershell
npm run build
npm run lint
npm run preview
```

Run these from the `server` directory:

```powershell
npm start
npm run dev
npm run seed
```

### Admin content management

After signing in, use the dashboard to manage the profile, skills, education, experience, projects and project technologies, certifications, achievements, social links, contact inbox, and resume. Image and PDF uploads are limited to 5 MB and checked against their file signatures. Admin uploads are stored under `server/uploads`; the profile, project images, certification documents, and resume paths are served by the existing uploads endpoint.
