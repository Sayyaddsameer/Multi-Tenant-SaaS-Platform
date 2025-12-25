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
/saas-platform
├── docker-compose.yml       # Defines services (database, backend, frontend) & networking
├── submission.json          # Test credentials for automated evaluation
├── README.md                # Project documentation and setup guide
├── .env.example             # Template for environment variables
├── docs/                    # Documentation artifacts (PRD, Architecture, Research)
├── backend/                 # Backend Node.js application
└── frontend/                # Frontend React application
```

## 1.2 Backend Structure (`/backend`)

The backend is built using **Node.js**, **Express**, and **Prisma**, following a modular, scalable, and maintainable architecture.

```text
backend/
├── src/
│   ├── config/                     # Configuration files (DB connections, constants)
│   ├── controllers/                # Request handlers containing business logic
│   │   ├── authController.js
│   │   ├── tenantController.js
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── middleware/                 # Express middleware
│   │   ├── authMiddleware.js       # JWT verification & tenant_id extraction
│   │   ├── errorMiddleware.js      # Global error handling
│   │   └── validationMiddleware.js # Input validation logic
│   ├── routes/                     # API route definitions
│   │   ├── auth.js
│   │   ├── tenants.js
│   │   ├── users.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── utils/                      # Helper functions (hashing, JWT generation)
│   └── index.js                    # Application entry point
│
├── prisma/
│   ├── schema.prisma               # Database schema definition
│   └── migrations/                 # SQL migration history
│
├── scripts/
│   └── entrypoint.sh               # Docker startup script (runs migrations/seeds)
│
├── seeds/
│   └── seed.js                     # Database seeding logic
│
├── Dockerfile                      # Backend container configuration
└── package.json                    # Project dependencies
```

## 1.3 Frontend Structure (`/frontend`)

The frontend is built using **React** with the **Vite** build tool for fast development and optimized production builds.

```text
frontend/
├── src/
│   ├── api/                 # Axios configuration and API service calls
│   │   └── axios.js
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx       # Main layout (Navbar, Sidebar)
│   │   ├── Modal.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/               # Page-level views mapped to routes
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Projects.jsx
│   │   └── Users.jsx
│   ├── App.jsx              # Main app component & route definitions
│   └── main.jsx             # React DOM entry point
│
├── public/                  # Static assets
├── Dockerfile               # Frontend container configuration
├── nginx.conf               # Nginx configuration for serving static files
├── vite.config.js           # Vite build configuration
└── package.json             # Project dependencies
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