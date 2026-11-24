# JobTrack

Smart job application tracker. The React interface talks to a small Express API, and every application is stored in a local SQLite database.

## Plan

1. **SQLite schema** — one `applications` table with company, role, location, salary, status, date, URL, and notes. Status is constrained to Applied, Interview, Selected, or Rejected.
2. **Express API** — list with search and status filter, dashboard stats, create, update, and delete. Validation lives on the server.
3. **React UI** — dashboard statistics, a status board, and a searchable list. Add and edit use one form. Delete asks for confirmation.
4. **Local run** — one command starts the API on port 3001 and the Vite app on port 5173. The database file is created on first launch and filled with sample applications when it is empty.

## Requirements

- Node.js 22.5 or newer (this project uses the built-in `node:sqlite` module)
- npm

## Run locally

From this folder:

```powershell
cd C:\Users\Nisa\jobtrack
npm install
npm run dev
```

`npm install` also installs the React app in `client`.

Open [http://localhost:5173](http://localhost:5173).

The API is at [http://localhost:3001](http://localhost:3001). Vite proxies `/api` to that port, so the browser only needs the first address.

Sample applications are inserted the first time `data/jobtrack.db` is created. Later edits stay in that file. Delete the file to start over and load the samples again.

## Production-style run

```powershell
npm run build
npm start
```

Then open [http://localhost:3001](http://localhost:3001). The API serves the built React app from `client/dist`.

## What you can do

- Add a job application
- Change status among Applied, Interview, Selected, and Rejected
- Edit or delete an application
- Search company, role, location, and notes
- Filter by status
- Read totals, this-month count, response rate, and selection rate on the dashboard
- Drag a board card by the `::` handle into another column

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/stats` | Dashboard counts and the five latest applications |
| GET | `/api/applications?q=&status=` | Search and filter |
| POST | `/api/applications` | Create |
| PUT | `/api/applications/:id` | Update |
| DELETE | `/api/applications/:id` | Delete |
