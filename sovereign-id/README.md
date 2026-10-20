# SovereignID: Identity & Access Management API

Stateless micro-segmented security engine built using FastAPI and Docker.

## Features

* **Stateless Auth:** Cryptographically signed HMAC-SHA256 JWT tokens.
* **Secured Hashes:** Salted account storage using bcrypt encryption.
* **RBAC Middleware:** Automatically enforces multi-tier clearance tags.

## Local Run Instructions

### Option 1: Run directly with Python

```bash
cd "C:\Users\mihre\OneDrive\Desktop\test\sovereign-id"
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Then open the API documentation:

```text
http://localhost:8000/docs
```

### Option 2: Run with Docker

```bash
docker build -t sovereign-id .
docker run -d --name iam-service -p 8000:8000 sovereign-id
```

Then open:

```text
http://localhost:8000/docs
```

## Demo Credentials

- Username: `field_worker`
  Password: `user123`
  Role: `Field_Worker`

- Username: `hq_admin`
  Password: `admin123`
  Role: `HQ_Admin`

## Key API Endpoints

- `POST /auth/register` — register a user with a role and email
- `POST /auth/login` — authenticate and receive a bearer JWT
- `GET /field/supplies` — access field endpoint with valid token
- `GET /admin/diplomatic-logs` — restricted HQ admin route

## Frontend Integration

The dashboard UI is located in:

```text
C:\Users\mihre\OneDrive\Desktop\test\sovereign-id-ui
```

Start the dashboard separately with:

```bash
cd "C:\Users\mihre\OneDrive\Desktop\test\sovereign-id-ui"
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Then open:

```text
http://localhost:5173
```
