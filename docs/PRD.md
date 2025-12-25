# Product Requirements Document (PRD)

**Project Name:** Multi-Tenant SaaS Project Management System  
**Date:** October 26, 2025  
**Version:** 1.0  
**Status:** Approved for Development  

---

## 1️. User Personas

This section defines the three primary user roles interacting with the system. Understanding these personas ensures the application meets the distinct needs of system administrators, customer organizations, and end users.

---

### Persona 1: Super Admin (System Owner)

**Role Description:**  
The system-level administrator who owns and manages the SaaS platform. This user does not belong to any tenant but oversees the entire ecosystem.

**Key Responsibilities:**
- Monitor system health and tenant usage statistics
- Manage tenant subscriptions (upgrade/downgrade plans)
- Suspend or ban non-compliant tenants
- Onboard large enterprise clients manually if required

**Main Goals:**
- Ensure platform stability and profitability
- Maximize active, paying tenants
- Prevent system abuse (spam tenants)

**Pain Points:**
- “I have no visibility into which tenants are consuming the most resources.”
- “It's difficult to track global user growth across all organizations.”
- “Manually updating a tenant's plan in the database is risky and slow.”

---

### Persona 2: Tenant Admin (Organization Manager)

**Role Description:**  
Administrator for a specific tenant organization. Responsible for managing the company’s workspace and users.

**Key Responsibilities:**
- Configure organization details (name, branding)
- Invite and manage team members
- Assign roles and permissions
- Oversee all projects and tasks within the tenant

**Main Goals:**
- Organize team workflows efficiently
- Maintain strong data security
- Avoid unexpectedly hitting subscription limits

**Pain Points:**
- “I can't easily see what my team is working on.”
- “Onboarding new employees takes too long.”
- “I worry about former employees retaining access to company data.”

---

### Persona 3: End User (Team Member)

**Role Description:**  
A regular employee who uses the system daily to complete assigned work.

**Key Responsibilities:**
- Create and update tasks
- Collaborate on projects
- Track deadlines and progress
- Report status to managers

**Main Goals:**
- Complete tasks on time
- Understand work priorities clearly
- Minimize administrative overhead

**Pain Points:**
- “I’m overwhelmed by cluttered interfaces; I just need to see my tasks.”
- “I miss deadlines because I didn’t notice the due date.”
- “It’s frustrating when I can’t find the project document I need.”

---

## 2️. Functional Requirements

These requirements define the expected behavior and capabilities of the system.

---

### Module: Authentication & Authorization

- **FR-001:** Allow new organizations to register as tenants with an organization name, unique subdomain, and admin credentials
- **FR-002:** Support stateless authentication using JWT with a validity period of 24 hours
- **FR-003:** Enforce RBAC with three roles: `super_admin`, `tenant_admin`, and `user`
- **FR-004:** Prevent cross-tenant data access by validating `tenant_id` on every API request
- **FR-005:** Provide a logout function that invalidates the session on the client side

---

### Module: Tenant Management

- **FR-006:** Automatically assign a **Free** plan to new tenants (5 users, 3 projects)
- **FR-007:** Allow Super Admins to view a paginated list of all tenants
- **FR-008:** Allow Super Admins to update tenant status and subscription plan
- **FR-009:** Enforce subscription limits immediately upon resource creation

---

### Module: User Management

- **FR-010:** Allow Tenant Admins to create users within subscription limits
- **FR-011:** Ensure email uniqueness within a tenant scope
- **FR-012:** Allow Tenant Admins to deactivate users and revoke access immediately
- **FR-013:** Allow users to view their profile but restrict role changes

---

### Module: Project Management

- **FR-014:** Allow creation of projects with name, description, and status
- **FR-015:** Provide a dashboard listing all tenant projects with task statistics
- **FR-016:** Allow deletion of projects with cascade deletion of tasks

---

### Module: Task Management

- **FR-017:** Allow task creation with title, description, priority, and due date
- **FR-018:** Allow tasks to be assigned to users within the same tenant
- **FR-019:** Allow task status updates via a dedicated endpoint
- **FR-020:** Support task filtering by status, priority, and assignee

---

## 3️. Non-Functional Requirements

These requirements define quality attributes such as performance, security, and scalability.

- **NFR-001 (Performance):**  
  95% of API requests must respond within 200ms under 100 concurrent users

- **NFR-002 (Security):**  
  Passwords must be hashed using Bcrypt with a minimum of 10 salt rounds

- **NFR-003 (Scalability):**  
  Application must support horizontal scaling using Docker containers

- **NFR-004 (Availability):**  
  Database must include health checks to detect connectivity issues

- **NFR-005 (Portability):**  
  Entire stack must be deployable via `docker-compose up -d`

- **NFR-006 (Usability):**  
  UI must be responsive for mobile (<768px) and desktop screens
