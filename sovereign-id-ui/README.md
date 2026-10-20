# SovereignID Dashboard UI

A frontend dashboard for the SovereignID authentication system with separate user and admin experiences.

## Features

- Secure login workflow against the FastAPI auth backend
- Field operations dashboard for standard users
- Admin-only access panel for HQ administrators
- Role-based route protection
- Vite + React frontend setup

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- The SovereignID backend running locally on port 8000

## 1) Start the backend API

From the backend folder:

```bash
cd "C:\Users\mihre\OneDrive\Desktop\test\sovereign-id"
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at:

```text
http://localhost:8000/docs
```

## 2) Start the frontend dashboard

Open a second terminal and run:

```bash
cd "C:\Users\mihre\OneDrive\Desktop\test\sovereign-id-ui"
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Then open:

```text
http://localhost:5173
```

## Demo accounts

- Username: `field_worker`
  Password: `user123`
  Access: User dashboard

- Username: `hq_admin`
  Password: `admin123`
  Access: Admin dashboard

## API endpoints used by the UI

- `POST /auth/login`
- `GET /field/supplies`
- `GET /admin/diplomatic-logs`

## Production note

This demo uses a mock in-memory database and a local JWT secret for development. For production, replace the secret and store user data in a real persistent backend.
