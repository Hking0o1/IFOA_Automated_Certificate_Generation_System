# Automated Certificate Generation System

Full-stack application for managing participant training records and generating PDF training certificates.

## Stack

- Frontend: React (Vite) + Axios
- Backend: Node.js + Express
- Certificate engine: HTML templates + Puppeteer PDF rendering
- Database: SQLite

## Project Structure

```text
.
├── backend
│   ├── controllers
│   ├── db
│   ├── routes
│   ├── services
│   ├── templates
│   ├── package.json
│   └── server.js
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Backend API

### Participants

- `GET /api/participants`
- `GET /api/participants/:id`
- `POST /api/participants`

### Certificate

- `POST /api/certificate/:id`
  - For recurrent records, optional request body:

```json
{
  "modules": ["Air Law", "Navigation"]
}
```

## Setup

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:5000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Features

- Searchable training participant dashboard.
- Generate certificate for basic and recurrent training.
- Module selection modal for recurrent training.
- Loading/disabled button state to avoid duplicate requests.
- Error and success notifications.
- Missing data validation with `400 Bad Request`.
- SQLite initialization with seed records and helpful indexes.
- Template caching and Puppeteer retry logic.

## Notes

- PDF generation uses Puppeteer in headless mode.
- Backend reuses a browser instance for better performance.
- Certificate validity date is computed as `training_date + 1 year`.
