# Multi-Tenant SaaS Platform

## Description
A comprehensive B2B SaaS application built to demonstrate **Multi-Tenancy**, **Data Isolation**, and **Role-Based Access Control (RBAC)**. This platform allows organizations (Tenants) to sign up, manage their own isolated workspace, add team members, and track projects and tasks.

The system features a strict hierarchy where a **Super Admin** manages tenants, **Tenant Admins** manage their organization's data and users, and **Standard Users** work on assigned tasks.

## Key Features
* **Multi-Tenancy Architecture:** Complete data isolation between different organizations using Tenant IDs.
* **Secure Authentication:** JWT-based login with hashed passwords (Bcrypt) and session management.
* **Role-Based Access Control (RBAC):** Distinct permissions for Super Admins, Tenant Admins, and Users.
* **Project Management:** Create, update, and track status of projects specific to a tenant.
* **Task Orchestration:** Assign tasks to team members with priorities and deadlines.
* **Team Management:** Tenant Admins can invite/remove users and manage their roles.
* **Super Admin Dashboard:** A global view for system administrators to monitor all registered tenants.
* **Responsive UI:** A modern, user-friendly Dashboard built with React.

## Technology Stack

### **Frontend**
* **Framework:** React.js (v18)
* **State Management:** React Context API
* **Routing:** React Router DOM (v6)
* **HTTP Client:** Axios
* **Styling:** CSS3 (Responsive Flexbox/Grid)

### **Backend**
* **Runtime:** Node.js (v18)
* **Framework:** Express.js
* **ORM:** Prisma
* **Security:** JSON Web Tokens (JWT), Bcrypt, CORS
* **Validation:** Express Validator

### **Database & DevOps**
* **Database:** PostgreSQL (v15)
* **Containerization:** Docker & Docker Compose
* **Environment:** Linux (Alpine) containers

## Architecture Overview
The application follows a **Client-Server** architecture. The React frontend communicates with the Node.js/Express backend via REST APIs. The backend connects to a PostgreSQL database, ensuring that every query is scoped by `tenant_id` to prevent data leaks between organizations.



## Installation & Setup

### **Prerequisites**
* Docker & Docker Compose (Recommended)
* Node.js v18+ (For local non-Docker setup)
* PostgreSQL (For local non-Docker setup)

### **Method 1: Docker (Fastest & Recommended)**
This method automatically sets up the Database, Backend, and Frontend.

1.  **Clone the Repository**
    ```bash
    git clone <your-repo-url>
    cd Multi-Tenant-SaaS-Platform
    ```

2.  **Configure Environment**
    Create a `.env` file in the root directory (or ensure `docker-compose.yml` variables are correct):
    ```properties
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=postgres
    POSTGRES_DB=saas_db
    ```

3.  **Launch Application**
    ```bash
    docker-compose up -d --build
    ```

4.  **Access the App**
    * **Frontend:** [http://localhost:3000](http://localhost:3000)
    * **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

    *Note: The system automatically runs migrations and seeds default data on startup.*

### **Method 2: Local Development (Manual)**

<details>
<summary>Click to expand manual setup instructions</summary>

1.  **Database Setup**
    Ensure PostgreSQL is running locally on port 5432.

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    cp .env.example .env
    # Update .env with your local DB credentials
    npx prisma migrate dev --name init
    npm run seed
    npm start
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm start
    ```
</details>

## Environment Variables

The application requires the following variables. See `.env.example` in the backend folder.

| Variable | Description | Default (Docker) |
| :--- | :--- | :--- |
| `PORT` | Backend Server Port | `5000` |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://...@database:5432/saas_db` |
| `JWT_SECRET` | Secret key for signing tokens | (Set your own secure key) |
| `FRONTEND_URL` | URL for CORS configuration | `http://localhost:3000` |

## API Documentation

### **Authentication**
* `POST /api/auth/register-tenant` - Register a new Organization
* `POST /api/auth/login` - User Login

### **Projects & Tasks**
* `GET /api/projects` - List all projects for current tenant
* `POST /api/projects` - Create a new project
* `POST /api/projects/:id/tasks` - Add a task to a project
* `PATCH /api/tasks/:id/status` - Update task status

### **Management**
* `GET /api/tenants` - (Super Admin) List all tenants
* `GET /api/tenants/:id/users` - (Tenant Admin) List employees
* `POST /api/tenants/:id/users` - (Tenant Admin) Add employee

## Testing Credentials (Seed Data)

**Super Admin:**
* Email: `superadmin@system.com`
* Password: `Admin@123`

**Tenant Admin (Demo Company):**
* Email: `admin@demo.com`
* Password: `Demo@123`
* Subdomain: `demo`
