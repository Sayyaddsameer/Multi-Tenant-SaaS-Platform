# Technical Specification

**Project Name:** Multi-Tenant SaaS Project Management System  
**Date:** October 26, 2025  
**Version:** 1.0  
**Author:** AWS Student / Lead Developer  

---

## 1️. Project Structure

The project is structured as a **Monorepo** containing both the **Backend API** and the **Frontend React application**, orchestrated using **Docker Compose** at the root level.

---

### 1.1 Root Directory Structure

```text
/Multi-Tenant-SaaS-Platform
├── docker-compose.yml       # Orchestration for DB, Backend, Frontend
├── submission.json          # Credentials for automated evaluation
├── README.md                # Entry point documentation
├── .gitignore               # Git ignore rules
├── docs/                    # Architecture, PRD, Research artifacts
├── backend/                 # Node.js/Express API Container
└── frontend/                # React Application Container
```

## 1.2 Backend Structure (`/backend`)

The backend is built using **Node.js**, **Express**, and **Prisma**, following a modular, scalable, and maintainable architecture.

```text
backend/
├── .env.example             # Template for environment variables
├── Dockerfile               # Backend container config
├── package.json             # Backend dependencies
├── prisma/
│   ├── schema.prisma        # Database schema definition
│   └── migrations/          # SQL migration history
├── seeds/
│   └── seed.js              # Database seeding logic
└── src/
    ├── controllers/         # Business logic (Auth, Tenant, Project)
    ├── middleware/          # Auth, Error, & Validation middleware
    ├── routes/              # API Endpoint definitions
    └── utils/               # Helper functions (hash.js, jwt.js)
```

## 1.3 Frontend Structure (`/frontend`)

The frontend is built using **React** with the **Vite** build tool for fast development and optimized production builds.

```text
frontend/
├── Dockerfile               # Frontend container config
├── package.json             # Frontend dependencies
├── public/                  # Static assets (index.html, icons)
└── src/
    ├── context/             # Global State (AuthContext.js)
    ├── pages/               # View components (Dashboard, Login, Register)
    ├── App.js               # Main Component & Routing
    └── index.js             # DOM Entry point
```

## 2️. Development Setup Guide

---

## 2.1 Prerequisites

Before starting, ensure the following tools are installed on your machine:

- **Docker Desktop** — Version **4.0+**  
  _(Essential for running the full stack)_

- **Node.js** — Version **18 LTS**  
  _(Required for local development and IntelliSense)_

- **Git** — Version **2.0+**

---

## 2.2 Environment Variables

Create a `.env` file inside the **`backend/`** directory  
(or rely on the default values provided in `docker-compose.yml`).

### Required Variables

```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection (Docker Internal URL)
DATABASE\_URL="postgresql://postgres:postgres@database:5432/saas\_db?schema=public"

# Security
JWT\_SECRET="your\_secure\_random\_secret\_key\_minimum\_32\_chars"
JWT\_EXPIRES\_IN="24h"

# CORS Configuration
FRONTEND\_URL="http://localhost:3000"
```

## 2.3 Installation Steps

### Clone the Repository

```bash
git clone <repository_url>
cd saas-platform
```

### Install Dependencies (Optional for Local Development)

If you want to edit the code locally with autocomplete and IntelliSense support, install dependencies manually.

#### Backend Dependencies

```bash
cd backend
npm install
```

#### Frontend Dependencies

```bash
cd ../frontend
npm install
```

## 2.4 How to Run Locally (Docker — Recommended)

The application is designed to run using **Docker Compose**, ensuring that the **Database**, **Backend**, and **Frontend** services are correctly networked.

### Build and Start Containers

Run the following command from the **root directory**:

```bash
docker-compose up -d --build
```

### Verify Services

Ensure that all three containers — **database**, **backend**, and **frontend** — are running:

```bash
docker-compose ps
```

### Automatic Initialization

The **backend container** is configured to automatically run the following on startup:

- `prisma migrate deploy`
- `node seeds/seed.js`

Wait approximately **30–60 seconds** for the database to initialize and seed data to be populated.

---

## Access the Application

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:5000  
- **Health Check:** http://localhost:5000/api/health  

---

## 2.5 How to Run Tests

Since this project relies on **Docker** for the runtime environment, testing is performed against the **running containers**.

### Manual Verification (Postman / Curl)

- Use the credentials provided in `submission.json` to test authentication endpoints.
- Verify system health using the health check endpoint.

#### Example: Health Check

```bash
curl http://localhost:5000/api/health
```

**Expected Output:**

```json
{
  "status": "ok",
  "database": "connected"
}
```

### Database Inspection

To verify seeded data or inspect database tables, connect to the PostgreSQL container:

```bash
docker exec -it database psql -U postgres -d saas_db
```

Then run SQL queries, for example:

```sql
SELECT * FROM tenants;
```