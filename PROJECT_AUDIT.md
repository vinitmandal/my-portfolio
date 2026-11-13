# Project Audit

## Current state

The project is a React/Vite portfolio frontend backed by an Express API and MySQL database. The public portfolio and admin CMS use live backend responses; neither substitutes mock data when requests fail.

## Completed

### Public portfolio

- Implemented the portfolio sections, responsive navigation and layouts, light/dark theme, restrained animations, project search/filter/detail pages, contact submission, and resume empty/available states.
- Connected portfolio sections to the existing MySQL-backed APIs and added loading, error, and empty states.
- Kept unverified contact details, social links, certifications, and college information unpublished.
- Documented project setup, technology, audience, seed, and run instructions in `client/README.md`.
- The seed script is additive and repeatable and preserves existing records and admin credentials.

### Admin CMS

- Added `/admin/login` with validation, password visibility, error/loading states, and cookie-based sessions; added protected `/admin` routing and logout.
- Added `/admin/setup` for one-time initial administrator creation using a server-configured setup key, bcrypt password hashing, rate limiting, and serialized setup.
- Added a live dashboard with content totals, unread/recent messages, profile completion, and management shortcuts.
- Added database-backed management screens for profile, skills, education, experience, projects and project technologies, certifications, achievements, and social links.
- Added an inbox with message detail, read/unread toggling, and deletion.
- Added resume PDF upload, replacement, preview, and download; the preview uses a dedicated endpoint whose framing policy is restricted to the configured frontend origin.
- Added image/PDF upload size, type, signature, filename, and storage-path checks for project/profile images, certification documents, and resumes.
- Updated the client README with secure initial-admin setup and CMS upload guidance.

## Validation and tests

- `client`: `npm run build` passes.
- `client`: `npm run lint` exits successfully with two Fast Refresh warnings in `AuthContext.jsx` and `ThemeContext.jsx`.
- `server`: `node --check` passes for controllers, routes, middleware, config, and `index.js`; `/api/health` responds successfully.
- Ran browser integration checks against a temporary local frontend/API instance connected to the existing MySQL database:
  - Initial setup, invalid login, valid login, logout, and protected-route redirection.
  - Create/edit/delete flows for skills, education, experience, projects (including technology relationship updates), achievements, and social links.
  - Certification PDF upload and deletion; profile photo upload and restoration to its original `NULL` value.
  - A temporary public contact submission appeared in the inbox, could be marked read/unread, and was deleted. The pre-existing inbox message was preserved.
  - Valid resume upload and browser preview rendered; an invalid PDF signature was rejected without replacing the existing file. The download endpoint returned an `application/pdf` response.
  - Temporary records, files, and the test administrator were removed after testing. No test records remain.
- Verified the final public API counts and the StudyTalk technology relationship: seven technologies were returned.
- At a 390px mobile viewport, the admin navigation opened/closed and `document.scrollWidth` matched the viewport width. The admin light/dark toggle was exercised.
- A read-only security review found no vulnerabilities in the reviewed scope. The workspace has no Git metadata for a baseline comparison; `.env` files were not inspected.

## Database state after testing

| Record type | Count |
|---|---:|
| Admins | 0 |
| Profile | 1 |
| Skills | 25 |
| Education | 2 |
| Experience | 2 |
| Projects | 2 |
| Project technologies | 7 |
| Certifications | 0 |
| Achievements | 8 |
| Social links | 0 |
| Contact messages | 1 |
| Resume | 0 |

## Remaining work and owner confirmation

- No permanent admin account exists. Before using the CMS on the regular server, set a strong private `ADMIN_SETUP_KEY` in the server environment, restart the API, create the first admin at `/admin/setup`, then remove the setup key and restart the API.
- The B.Tech college name has not been provided.
- The Online Food Ordering System description, repository URL, and status remain unverified.
- No verified certifications, social URLs, or resume file are currently present.
- No public contact email or phone number has been supplied.
- Profile deletion and valid resume replacement over an existing owner-provided resume were not exercised to avoid destructive changes to real content.
