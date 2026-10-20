# SovereignID: Identity & Access Management API

Stateless micro-segmented security engine built using FastAPI and Docker.

## Features

* **Stateless Auth:** Cryptographically signed HMAC-SHA256 JWT tokens.
* **Secured Hashes:** Salted account storage using bcrypt encryption.
* **RBAC Middleware:** Automatically enforces multi-tier clearance tags.

## Quick Start

1. Build the image:
   ```bash
   docker build -t sovereign-id .
   ```
2. Run the service:
   ```bash
   docker run -d --name iam-service -p 8000:8000 sovereign-id
   ```
3. Open the API docs:
   ```text
   http://localhost:8000/docs
   ```

## API Overview

- `POST /auth/register` — register a user with a role and email
- `POST /auth/login` — authenticate and receive a bearer JWT
- `GET /field/supplies` — access field endpoint with valid token
- `GET /admin/diplomatic-logs` — restricted HQ admin route
