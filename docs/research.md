\# Research Document: Multi-Tenant SaaS Platform Architecture



\*\*Project Name:\*\* Multi-Tenant SaaS Project Management System

\*\*Date:\*\* October 26, 2025

\*\*Author:\*\* AWS Student / Lead Developer

\*\*Status:\*\* Approved for Implementation



---



\## 1. Multi-Tenancy Architecture Analysis



Multi-tenancy is the architectural capability of a single instance of software to serve multiple distinct user groups, known as "tenants." In a SaaS context, this usually means one codebase serving many different customer organizations simultaneously. The most critical architectural decision in building a SaaS platform is the database design strategy, as it dictates the system's scalability, data isolation capabilities, maintenance complexity, and infrastructure costs.



Below is a detailed analysis of the three primary approaches considered for this project.



\### A. Approach 1: Shared Database, Shared Schema (Discriminator Column)

Also known as the \*\*"Pool" model\*\*. In this approach, all tenants share the same database instance and the same set of tables. There is no physical or schema-level separation of data. Instead, data isolation is purely logical, achieved by adding a distinct column—typically `tenant\_id`—to every database table that contains tenant-specific data (e.g., `users`, `projects`, `tasks`).



\* \*\*Mechanism:\*\* Every SQL query must include a `WHERE tenant\_id = ?` clause. The application layer is entirely responsible for enforcing this isolation.

\* \*\*Pros:\*\*

&nbsp;   \* \*\*Lowest Cost:\*\* This is the most resource-efficient model. You run one database instance, paying for one set of compute and storage resources regardless of tenant count.

&nbsp;   \* \*\*Easy Onboarding:\*\* creating a new tenant is as simple as inserting a row into a `tenants` table. There are no infrastructure provisioning scripts required.

&nbsp;   \* \*\*Simplified DevOps:\*\* Backups, monitoring, and updates are performed on a single resource.

&nbsp;   \* \*\*Cross-Tenant Analytics:\*\* Running a query to count "total global users" or "average projects per tenant" is a simple SQL aggregation, making business intelligence reporting very easy.

\* \*\*Cons:\*\*

&nbsp;   \* \*\*Security Risk:\*\* The "noisy neighbor" effect is prominent; one heavy tenant can slow down the database for everyone. More critically, a developer forgetting a `WHERE` clause in a single query can lead to massive data leaks where Tenant A sees Tenant B's data.

&nbsp;   \* \*\*Backup Complexity:\*\* restoring data for a \*single\* tenant is difficult because their data is intermingled with everyone else's. You cannot simply "restore a file"; you must extract specific rows.



\### B. Approach 2: Shared Database, Separate Schemas (Schema-per-Tenant)

Also known as the \*\*"Bridge" model\*\*. In this architecture, we use a single physical database instance, but we create a separate logical "schema" (namespace) for each tenant. For example, PostgreSQL allows creating schemas like `tenant\_a`, `tenant\_b`, etc. Each schema contains its own isolated version of the tables (`tenant\_a.users`, `tenant\_b.users`).



\* \*\*Mechanism:\*\* The application connects to the database and, at the start of the request processing, executes a command like `SET search\_path TO tenant\_a`. Subsequent queries do not need `tenant\_id` filters because they only see tables in that specific schema.

\* \*\*Pros:\*\*

&nbsp;   \* \*\*Better Isolation:\*\* Data is logically separated at the database level. A query running in Tenant A's schema fundamentally cannot touch Tenant B's tables without explicit cross-schema commands.

&nbsp;   \* \*\*Customization:\*\* It is possible (though complex) to have slightly different table structures for premium tenants.

&nbsp;   \* \*\*Manageable Backups:\*\* Tools like `pg\_dump` can easily export a single schema, making per-tenant backups and restores feasible.

\* \*\*Cons:\*\*

&nbsp;   \* \*\*Migration Nightmares:\*\* When you deploy a code update that requires a database migration (e.g., adding a column to the `tasks` table), you must run that migration script N times, once for every tenant schema. If you have 5,000 tenants, a deployment can take hours.

&nbsp;   \* \*\*Resource Overhead:\*\* While better than separate databases, having thousands of schemas can bloat the database's internal metadata catalog, potentially degrading performance.



\### C. Approach 3: Separate Databases (Database-per-Tenant)

Also known as the \*\*"Silo" model\*\*. In this architecture, every tenant gets their own completely distinct database instance. This could be separate Docker containers, separate RDS instances in AWS, or separate logical databases on a shared cluster.



\* \*\*Mechanism:\*\* The application maintains a "Catalog" or "Router" service. When a request comes in for `tenant-a.saas.com`, the application looks up the connection string for Tenant A and connects specifically to that database.

\* \*\*Pros:\*\*

&nbsp;   \* \*\*Ultimate Isolation:\*\* There is zero risk of a query accidentally leaking data between tenants.

&nbsp;   \* \*\*Performance:\*\* No noisy neighbor effect. A high-load tenant can be moved to a dedicated, larger server without affecting others.

&nbsp;   \* \*\*Compliance:\*\* Ideal for enterprise clients (BFSI, Healthcare) who may legally require their data to be physically isolated.

\* \*\*Cons:\*\*

&nbsp;   \* \*\*Highest Cost:\*\* You pay for overhead (OS, DB engine RAM) for every single tenant. This is financially unviable for "Free Tier" users.

&nbsp;   \* \*\*DevOps Complexity:\*\* You are now managing a fleet of databases. Monitoring, patching, and backing up becomes a complex orchestration challenge requiring Kubernetes or advanced scripting.



\### Comparison Summary



| Feature | Shared Schema (Pool) | Separate Schema (Bridge) | Separate Database (Silo) |

| :--- | :--- | :--- | :--- |

| \*\*Isolation Level\*\* | Low (Logical Application Level) | Medium (Database Schema Level) | High (Physical Infrastructure Level) |

| \*\*Cost Efficiency\*\* | High (Shared resources) | Medium | Low (High overhead) |

| \*\*Onboarding Speed\*\* | Instant | Fast (Script execution) | Slow (Provisioning resources) |

| \*\*DevOps Effort\*\* | Low | Medium | High |

| \*\*Data Leak Risk\*\* | High (Developer error) | Medium | Lowest |

| \*\*Maintenance\*\* | Easy (1 migration run) | Hard (N migration runs) | Very Hard (N DB updates) |

| \*\*Scalability\*\* | Vertical mainly | Vertical | Infinite Horizontal |



\### Justification for Chosen Approach: Shared Database + Shared Schema



For this Multi-Tenant SaaS Project Management System, we have selected the \*\*Shared Database + Shared Schema (Discriminator Column)\*\* approach.



\*\*Detailed Justification:\*\*

1\.  \*\*Scope Appropriateness:\*\* The objective is to build a production-ready MVP application. The complexity of orchestrating separate databases or managing dynamic schema creation would divert significant effort away from building core features (Tasks, Projects, Auth).

2\.  \*\*Tech Stack Compatibility:\*\* We are using \*\*Prisma ORM\*\*. While Prisma supports multi-schema strategies, it is most robust and easiest to type-check when working with a single schema definition. The "Discriminator" pattern works natively with modern ORMs.

3\.  \*\*Dockerization \& Evaluation:\*\* The project requires a containerized submission. Managing a dynamic number of database containers inside a standard `docker-compose` setup is impractical. A single Postgres container serving all tenants via a shared schema ensures the application is portable, easy to review, and runs reliably on any machine with one command (`docker-compose up -d`).

4\.  \*\*Mitigation of Cons:\*\* We acknowledge the security risk of missing `WHERE` clauses. To mitigate this, we will not rely on manual query writing. We will implement \*\*Backend Middleware\*\* and Service Layer abstractions that automatically inject the `tenant\_id` into database calls based on the authenticated user's JWT, effectively simulating the safety of the schema-per-tenant model without the operational overhead.



---



\## 2. Technology Stack Justification



\### A. Backend Framework: Node.js with Express

\*\*Selection:\*\* Node.js (Runtime) + Express (Framework)

\*\*Why Chosen:\*\*

\* \*\*Asynchronous Event-Driven Architecture:\*\* Project management tools often involve high concurrency (many users updating tasks simultaneously). Node.js's non-blocking I/O model is ideal for handling these I/O-bound operations efficiently without thread-blocking.

\* \*\*Middleware Ecosystem:\*\* Express is chosen specifically for its robust middleware pattern. This is crucial for our multi-tenancy implementation, where we need to intercept every request to extract the `tenant\_id` and enforce subscription limits before the request ever reaches the business logic.

\* \*\*Unified Language:\*\* Using JavaScript/TypeScript on both frontend and backend reduces context switching and allows for sharing type definitions (interfaces) between the API and the client.

\*\*Alternatives Considered:\*\*

\* \*Django (Python):\* Rejected because its synchronous nature handles high concurrency less efficiently out-of-the-box, and its "batteries-included" ORM makes implementing custom multi-tenancy logic more rigid than the flexible middleware of Express.

\* \*Java Spring Boot:\* Rejected due to its heavy memory footprint and longer startup times, which contradicts our goal of a lightweight, containerized MVP.



\### B. Frontend Framework: React

\*\*Selection:\*\* React.js (using Vite build tool)

\*\*Why Chosen:\*\*

\* \*\*Component Reusability:\*\* The UI requires repetitive elements like Task Cards, Project Lists, and Modals. React’s component architecture allows us to build these once and reuse them across different views.

\* \*\*Virtual DOM:\*\* For a dashboard with drag-and-drop tasks or frequent status updates, React's Virtual DOM ensures that only the changed parts of the UI re-render, keeping the application snappy.

\* \*\*Ecosystem:\*\* We can leverage `react-router-dom` for protecting routes (auth guards) and `axios` for standardized API communication.

\*\*Alternatives Considered:\*\*

\* \*Angular:\* Rejected because of its steep learning curve and verbose boilerplate code, which would slow down the development of the MVP.



\### C. Database: PostgreSQL

\*\*Selection:\*\* PostgreSQL 15+

\*\*Why Chosen:\*\*

\* \*\*Relational Integrity:\*\* The core requirement of this SaaS is strict data relationships (Tenants -> Users -> Projects -> Tasks). Postgres enforces Foreign Key constraints with `CASCADE DELETE`, ensuring that if a tenant is deleted, all their data vanishes cleanly.

\* \*\*JSONB Support:\*\* SaaS apps often need flexibility (e.g., tenant-specific settings). Postgres offers NoSQL-like capabilities via JSONB columns while maintaining ACID compliance.

\* \*\*Row-Level Security (RLS):\*\* While we are implementing isolation in the app layer, Postgres supports RLS, providing a future-proof path if we need to push security down to the database engine.

\*\*Alternatives Considered:\*\*

\* \*MongoDB:\* Rejected because maintaining data consistency across related collections (Users, Projects, Tasks) is difficult without native joins and foreign keys, increasing the risk of orphaned data in a multi-tenant system.



\### D. Authentication: JSON Web Tokens (JWT)

\*\*Selection:\*\* Stateless JWT (RS256/HS256)

\*\*Why Chosen:\*\*

\* \*\*Stateless Scalability:\*\* In a multi-tenant system, checking the database for a session ID on every single request adds significant load. JWTs are self-contained; the server can verify the signature and trust the `tenant\_id` payload without a DB lookup.

\* \*\*Cross-Domain Support:\*\* JWTs work seamlessly across different subdomains (`tenant1.app.com`, `tenant2.app.com`), which is a core requirement of our subdomain-based architecture.

\*\*Alternatives Considered:\*\*

\* \*Server-Side Sessions:\* Rejected because it requires shared session storage (like Redis) to work effectively in a containerized environment, adding unnecessary infrastructure complexity.



\### E. Deployment: Docker \& Docker Compose

\*\*Selection:\*\* Docker

\*\*Why Chosen:\*\*

\* \*\*Environment Parity:\*\* Docker ensures that the application runs exactly the same way on the developer's laptop as it does on the evaluation machine. This eliminates "it works on my machine" issues caused by different Node.js or Postgres versions.

\* \*\*Service Orchestration:\*\* `docker-compose` allows us to define the Backend, Frontend, and Database as a single unit, complete with networking and volume persistence. This satisfies the mandatory requirement for "one-command deployment."



---



\## 3. Security Considerations



Securing a multi-tenant application is significantly more complex than a single-tenant one. The risk of \*\*Cross-Tenant Data Leakage\*\*—where one customer accidentally sees another customer's confidential data—is the primary threat vector. Below are the five specific security measures and strategies implemented in this project.



\### Measure 1: Deep Logical Isolation via Middleware

We do not rely on developers remembering to add security checks. We implement a centralized \*\*Authentication Middleware\*\* that runs before every protected controller.

\* \*\*Mechanism:\*\* The middleware intercepts the request, validates the JWT, and extracts the `tenant\_id`. It then explicitly attaches this `tenant\_id` to the `req` object.

\* \*\*Enforcement:\*\* Controller logic is designed to \*only\* read the `tenant\_id` from this secure `req` object, never from the request body or query parameters supplied by the user. This effectively neutralizes "Parameter Tampering" attacks where a malicious user tries to change the tenant ID in the JSON payload.



\### Measure 2: Secure Password Storage (Bcrypt)

Storing passwords in plain text is a critical vulnerability. We utilize \*\*Bcrypt\*\* for hashing.

\* \*\*Hashing Strategy:\*\* When a user registers, their password is passed through the Bcrypt algorithm with a salt round of 10. This process introduces a random "salt" to the hash, ensuring that even if two users have the same password ("Password123"), their stored hashes will be completely different.

\* \*\*Defense:\*\* This defends against "Rainbow Table" attacks. Even if the database is dumped by an attacker, the passwords cannot be reverse-engineered into plain text.



\### Measure 3: Role-Based Access Control (RBAC)

We implement a hierarchical permission system to enforce "Least Privilege."

\* \*\*Super Admin:\*\* Has `tenant\_id: NULL`. The system recognizes this special state to bypass isolation filters for administrative dashboards.

\* \*\*Tenant Admin:\*\* Restricted to their specific `tenant\_id`. Can perform dangerous actions (DELETE user, UPDATE project) but \*only\* on resources owned by their tenant.

\* \*\*Standard User:\*\* Restricted to their `tenant\_id` and further restricted to read-only or limited-write actions.

\* \*\*Implementation:\*\* API endpoints are decorated with "Guards" (e.g., `requireRole(\['tenant\_admin'])`). If a user with the 'user' role attempts to hit the `DELETE /api/users` endpoint, the Guard rejects the request with a 403 Forbidden status before any database logic is executed.



\### Measure 4: API Security Hardening

To protect the API surface, we implement standard hardening techniques:

\* \*\*CORS (Cross-Origin Resource Sharing):\*\* configured to strictly allow requests only from the trusted frontend domain (or the internal Docker network). This prevents malicious websites from triggering actions on our API on behalf of a logged-in user.

\* \*\*Rate Limiting:\*\* To prevent Brute Force attacks on the login endpoint, we track IP addresses and block requests if they exceed a threshold (e.g., 5 failed logins per minute).

\* \*\*Helmet Headers:\*\* We use the `helmet` middleware to set HTTP headers that protect against XSS (Cross-Site Scripting) and Clickjacking.



\### Measure 5: Input Validation \& Sanitization

Trusting user input is the root cause of SQL Injection and NoSQL Injection attacks.

\* \*\*Validation:\*\* We use validation libraries (like `express-validator` or Zod) to ensure data conforms to expected types. For example, the `subdomain` field is validated to ensure it contains only alphanumeric characters, preventing attackers from injecting control characters or script tags.

\* \*\*Parameterization:\*\* By using Prisma ORM, all database queries are automatically parameterized. The ORM treats user input as data, not executable code, which mathematically eliminates the possibility of classic SQL Injection attacks.



\### Data Isolation Strategy: The "Row-Level" Pattern

In our Shared Schema approach, our data isolation strategy relies on the \*\*Foreign Key Tree\*\*.

1\.  \*\*Root of Trust:\*\* The `Tenants` table is the root.

2\.  \*\*Strict Hierarchy:\*\*

&nbsp;   \* `Users` table has a `tenant\_id` FK.

&nbsp;   \* `Projects` table has a `tenant\_id` FK.

&nbsp;   \* `Tasks` table has a `tenant\_id` FK (denormalized for faster permission checks) AND a `project\_id` FK.

3\.  \*\*Isolation Logic:\*\* When a user requests to view a task, the query executed is effectively: `SELECT \* FROM tasks WHERE id = \[Requested\_ID] AND tenant\_id = \[User\_JWT\_Tenant\_ID]`.

&nbsp;   \* If a user tries to access a valid Task ID that belongs to a different tenant, the database returns 0 rows because the `tenant\_id` condition fails. The API then returns a 404 Not Found, effectively making other tenants' data invisible.



\### Authentication \& Authorization Flow

1\.  \*\*Login:\*\* User sends credentials + Subdomain.

2\.  \*\*Verification:\*\* Backend finds Tenant by subdomain -> Finds User in that Tenant -> Compares Bcrypt Hash.

3\.  \*\*Token Issuance:\*\* If valid, server signs a JWT containing `{ userId, tenantId, role }` with a secret key.

4\.  \*\*Request:\*\* Client sends JWT in `Authorization` header.

5\.  \*\*Validation:\*\* Middleware decodes JWT using secret key. If signature is valid, the request is trusted.

6\.  \*\*Authorization:\*\* Middleware checks if the `role` in the JWT is allowed to access the requested route.

