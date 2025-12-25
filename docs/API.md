# Multi-Tenant SaaS Platform – API Documentation

## Authentication & Security

- **Authentication Method:** Bearer Token (JWT)
- **Header Format:**  
  `Authorization: Bearer <your_jwt_token>`
- **Token Expiry:** 24 hours
- **Base URL (Local):**  
  `http://localhost:5000/api`

---

## System

### 1. Health Check

Checks whether the API server and database connection are healthy.

- **Endpoint:** `GET /health`
- **Access:** Public

#### Response (200 OK)

```json
{
  "status": "ok",
  "database": "connected"
}
```

## 2. Authentication Module

### 2.1 Register Tenant (Sign Up)

Registers a new **Organization (Tenant)** along with its first **Admin user**.

- **Endpoint:** `POST /auth/register-tenant`
- **Access:** Public

#### Request Body (JSON)

```json
{
  "tenantName": "Acme Corp",
  "subdomain": "acme",
  "adminEmail": "admin@acme.com",
  "password": "SecurePassword123"
}

#### Response (201 Created)

```json
{
  "message": "Tenant registered successfully",
  "tenantId": "uuid-string"
}
```

### 2.2 Login

Authenticates a user and returns a **JWT access token**.

- **Endpoint:** `POST /auth/login`
- **Access:** Public

#### Request Body (JSON)

```json
{
  "email": "admin@acme.com",
  "password": "SecurePassword123"
}
```

#### Response (200 OK)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "uuid",
    "email": "admin@acme.com",
    "role": "tenant_admin",
    "tenantId": "uuid"
  }
}
```

### 2.3 Get Current User

Retrieves the profile of the currently logged-in user.

- **Endpoint:** `GET /auth/me`
- **Access:** Protected (All Roles)

#### Response (200 OK)

```json
{
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@acme.com",
    "role": "user"
  }
}
```

## 3️. Tenant Management (Super Admin)

### 3.1 List All Tenants

Retrieves a list of all registered tenants.  
Accessible only by **Super Admin** users.

- **Endpoint:** `GET /tenants`
- **Access:** Super Admin

#### Response (200 OK)

```json
{
  "status": "success",
  "results": 2,
  "data": {
    "tenants": [
      { "id": "1", "name": "Acme Corp", "subdomain": "acme" },
      { "id": "2", "name": "Beta Inc", "subdomain": "beta" }
    ]
  }
}
```

### 3.2 Get Tenant Details

Retrieves detailed information for a specific tenant.

- **Endpoint:** `GET /tenants/:id`
- **Access:** Super Admin

#### Response (200 OK)

```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "status": "active"
}
```

### 3.3 Update Tenant

Updates tenant details such as name or status.

- **Endpoint:** `PUT /tenants/:id`
- **Access:** Super Admin

#### Request Body (JSON)

```json
{
  "name": "Acme Global",
  "status": "inactive"
}
```

## 4️. User Management (Tenant Admin)

### 4.1 List Users

Lists all employees within the requester’s tenant.

- **Endpoint:** `GET /tenants/:tenantId/users`
- **Access:** Tenant Admin

#### Response (200 OK)

```json
{
  "data": {
    "users": [
      { "id": "u1", "fullName": "Alice", "role": "user" }
    ]
  }
}
```

### 4.2 Create User

Adds a new employee to the tenant.

- **Endpoint:** `POST /tenants/:tenantId/users`
- **Access:** Tenant Admin

#### Request Body (JSON)

```json
{
  "email": "alice@acme.com",
  "password": "Password123",
  "fullName": "Alice Smith",
  "role": "user"
}
```

### 4.3 Update User

Updates an existing user’s profile or role.

- **Endpoint:** `PUT /users/:id`
- **Access:** Tenant Admin

#### Request Body (JSON)

```json
{
  "fullName": "Alice Jones",
  "role": "tenant_admin"
}
```

### 4.4 Delete User

Removes a user from the tenant.

- **Endpoint:** `DELETE /users/:id`
- **Access:** Tenant Admin

---

## 5️. Project Management

### 5.1 List Projects

Lists all projects belonging to the requester’s tenant.

- **Endpoint:** `GET /projects`
- **Access:** User / Admin

#### Response (200 OK)

```json
{
  "data": {
    "projects": [
      { "id": "p1", "title": "Website Redesign", "status": "active" }
    ]
  }
}
```

### 5.2 Create Project

Creates a new project within the tenant.

- **Endpoint:** `POST /projects`
- **Access:** Admin

#### Request Body (JSON)

```json
{
  "title": "Q3 Marketing Campaign",
  "description": "Planning for Q3",
  "status": "active"
}
```

### 5.3 Get Project Details

Retrieves detailed information for a specific project.

- **Endpoint:** `GET /projects/:id`
- **Access:** User / Admin

---

### 5.4 Update Project

Updates an existing project’s details.

- **Endpoint:** `PUT /projects/:id`
- **Access:** Admin

#### Request Body (JSON)

```json
{
  "status": "completed"
}
```

> **Note:**  
> Project deletion functionality is typically mapped to  
> `DELETE /projects/:id`

---

## 6️. Task Management

### 6.1 List Tasks

Retrieves all tasks associated with a specific project.

- **Endpoint:** `GET /projects/:projectId/tasks`
- **Access:** User / Admin

#### Response (200 OK)

```json
{
  "data": {
    "tasks": [
      { "id": "t1", "title": "Draft content", "status": "TODO" }
    ]
  }
}
```

### 6.2 Create Task

Creates a new task within a specific project.

- **Endpoint:** `POST /projects/:projectId/tasks`
- **Access:** Admin

#### Request Body (JSON)

```json
{
  "title": "Fix Header Bug",
  "description": "CSS issue on mobile",
  "priority": "HIGH",
  "dueDate": "2023-12-31"
}
```

### 6.3 Update Task Status

Quickly update a task’s status (e.g., via Kanban drag-and-drop).

- **Endpoint:** `PATCH /tasks/:id/status`
- **Access:** User / Admin

#### Request Body (JSON)

```json
{
  "status": "IN_PROGRESS"
}
```

### 6.4 Update Task Details

Performs a full update of a task’s information.

- **Endpoint:** `PUT /tasks/:id`
- **Access:** Admin

#### Request Body (JSON)

```json
{
  "title": "Fix Header Bug (Updated)",
  "priority": "MEDIUM"
}
