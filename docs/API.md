\# Multi-Tenant SaaS Platform - API Documentation



\## Authentication \& Security

\* \*\*Authentication Method:\*\* Bearer Token (JWT)

\* \*\*Header Format:\*\* `Authorization: Bearer <your\_jwt\_token>`

\* \*\*Token Expiry:\*\* 24 hours

\* \*\*Base URL:\*\* `http://localhost:5000/api` (Local)



---



\## System



\### \*\*1. Health Check\*\*

Checks if the API and Database are connected.

\* \*\*Endpoint:\*\* `GET /health`

\* \*\*Access:\*\* Public

\* \*\*Response:\*\*

```json

{

&nbsp; "status": "ok",

&nbsp; "database": "connected"

}

```



\## 2. Authentication Module



\### 2.1 Register Tenant (Sign Up)



Registers a new \*\*Organization (Tenant)\*\* along with its first \*\*Admin user\*\*.



\- \*\*Endpoint:\*\* `POST /auth/register-tenant`

\- \*\*Access:\*\* Public



\#### Request Body (JSON)



```json

{

&nbsp; "tenantName": "Acme Corp",

&nbsp; "subdomain": "acme",

&nbsp; "adminEmail": "admin@acme.com",

&nbsp; "password": "SecurePassword123"

}

```



\#### Response (201 Created)



```json

{

&nbsp; "message": "Tenant registered successfully",

&nbsp; "tenantId": "uuid-string"

}

```



\### 2.2 Login



Authenticates a user and returns a \*\*JWT access token\*\*.



\- \*\*Endpoint:\*\* `POST /auth/login`

\- \*\*Access:\*\* Public



\#### Request Body (JSON)



```json

{

&nbsp; "email": "admin@acme.com",

&nbsp; "password": "SecurePassword123"

}

```



\#### Response (200 OK)



```json

{

&nbsp; "token": "eyJhbGciOiJIUzI1NiIsIn...",

&nbsp; "user": {

&nbsp;   "id": "uuid",

&nbsp;   "email": "admin@acme.com",

&nbsp;   "role": "tenant\_admin",

&nbsp;   "tenantId": "uuid"

&nbsp; }

}

```



\### 2.3 Get Current User



Retrieves the profile of the currently logged-in user.



\- \*\*Endpoint:\*\* `GET /auth/me`

\- \*\*Access:\*\* Protected (All Roles)



\#### Response (200 OK)



```json

{

&nbsp; "user": {

&nbsp;   "id": "uuid",

&nbsp;   "fullName": "John Doe",

&nbsp;   "email": "john@acme.com",

&nbsp;   "role": "user"

&nbsp; }

}

```



\## 3. Tenant Management (Super Admin)



\### 3.1 List All Tenants



Retrieves a list of all registered tenants.  

Accessible only by \*\*Super Admin\*\* users.



\- \*\*Endpoint:\*\* `GET /tenants`

\- \*\*Access:\*\* Super Admin



\#### Response (200 OK)



```json

{

&nbsp; "status": "success",

&nbsp; "results": 2,

&nbsp; "data": {

&nbsp;   "tenants": \[

&nbsp;     { "id": "1", "name": "Acme Corp", "subdomain": "acme" },

&nbsp;     { "id": "2", "name": "Beta Inc", "subdomain": "beta" }

&nbsp;   ]

&nbsp; }

}

```



\### 3.2 Get Tenant Details



Retrieves detailed information for a specific tenant.



\- \*\*Endpoint:\*\* `GET /tenants/:id`

\- \*\*Access:\*\* Super Admin



\#### Response (200 OK)



```json

{

&nbsp; "id": "uuid",

&nbsp; "name": "Acme Corp",

&nbsp; "status": "active"

}

```



\### 3.3 Update Tenant



Updates tenant details such as name or status.



\- \*\*Endpoint:\*\* `PUT /tenants/:id`

\- \*\*Access:\*\* Super Admin



\#### Request Body (JSON)



```json

{

&nbsp; "name": "Acme Global",

&nbsp; "status": "inactive"

}

```



\## 4. User Management (Tenant Admin)



\### 4.1 List Users



Lists all employees within the requester’s tenant.



\- \*\*Endpoint:\*\* `GET /tenants/:tenantId/users`

\- \*\*Access:\*\* Tenant Admin



\#### Response (200 OK)



```json

{

&nbsp; "data": {

&nbsp;   "users": \[

&nbsp;     { "id": "u1", "fullName": "Alice", "role": "user" }

&nbsp;   ]

&nbsp; }

}

```



\### 4.2 Create User



Adds a new employee to the tenant.



\- \*\*Endpoint:\*\* `POST /tenants/:tenantId/users`

\- \*\*Access:\*\* Tenant Admin



\#### Request Body (JSON)



```json

{

&nbsp; "email": "alice@acme.com",

&nbsp; "password": "Password123",

&nbsp; "fullName": "Alice Smith",

&nbsp; "role": "user"

}

```



\### 4.3 Update User



Updates an existing user’s profile or role.



\- \*\*Endpoint:\*\* `PUT /users/:id`

\- \*\*Access:\*\* Tenant Admin



\#### Request Body (JSON)



```json

{

&nbsp; "fullName": "Alice Jones",

&nbsp; "role": "tenant\_admin"

}

```



\### 4.4 Delete User



Removes a user from the tenant.



\- \*\*Endpoint:\*\* `DELETE /users/:id`

\- \*\*Access:\*\* Tenant Admin



---



\## 5. Project Management



\### 5.1 List Projects



Lists all projects belonging to the requester’s tenant.



\- \*\*Endpoint:\*\* `GET /projects`

\- \*\*Access:\*\* User / Admin



\#### Response (200 OK)



```json

{

&nbsp; "data": {

&nbsp;   "projects": \[

&nbsp;     { "id": "p1", "title": "Website Redesign", "status": "active" }

&nbsp;   ]

&nbsp; }

}

```



\### 5.2 Create Project



Creates a new project within the tenant.



\- \*\*Endpoint:\*\* `POST /projects`

\- \*\*Access:\*\* Admin



\#### Request Body (JSON)



```json

{

&nbsp; "title": "Q3 Marketing Campaign",

&nbsp; "description": "Planning for Q3",

&nbsp; "status": "active"

}

```



\### 5.3 Get Project Details



Retrieves detailed information for a specific project.



\- \*\*Endpoint:\*\* `GET /projects/:id`

\- \*\*Access:\*\* User / Admin



---



\### 5.4 Update Project



Updates an existing project’s details.



\- \*\*Endpoint:\*\* `PUT /projects/:id`

\- \*\*Access:\*\* Admin



\#### Request Body (JSON)



```json

{

&nbsp; "status": "completed"

}

```



> \*\*Note:\*\*  

> Project deletion functionality is typically mapped to  

> `DELETE /projects/:id`



---



\## 6. Task Management



\### 6.1 List Tasks



Retrieves all tasks associated with a specific project.



\- \*\*Endpoint:\*\* `GET /projects/:projectId/tasks`

\- \*\*Access:\*\* User / Admin



\#### Response (200 OK)



```json

{

&nbsp; "data": {

&nbsp;   "tasks": \[

&nbsp;     { "id": "t1", "title": "Draft content", "status": "TODO" }

&nbsp;   ]

&nbsp; }

}

```



\### 6.2 Create Task



Creates a new task within a specific project.



\- \*\*Endpoint:\*\* `POST /projects/:projectId/tasks`

\- \*\*Access:\*\* Admin



\#### Request Body (JSON)



```json

{

&nbsp; "title": "Fix Header Bug",

&nbsp; "description": "CSS issue on mobile",

&nbsp; "priority": "HIGH",

&nbsp; "dueDate": "2023-12-31"

}

```



\### 6.3 Update Task Status



Quickly update a task’s status (e.g., via Kanban drag-and-drop).



\- \*\*Endpoint:\*\* `PATCH /tasks/:id/status`

\- \*\*Access:\*\* User / Admin



\#### Request Body (JSON)



```json

{

&nbsp; "status": "IN\_PROGRESS"

}

```



\### 6.4 Update Task Details



Performs a full update of a task’s information.



\- \*\*Endpoint:\*\* `PUT /tasks/:id`

\- \*\*Access:\*\* Admin



\#### Request Body (JSON)



```json

{

&nbsp; "title": "Fix Header Bug (Updated)",

&nbsp; "priority": "MEDIUM"

}

```

