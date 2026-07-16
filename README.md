# Employee Management System (EMS)

A production-grade Employee Management System featuring secure JWT authentication, granular Role-Based Access Control (RBAC), organizational hierarchy with circular reporting prevention, advanced analytics dashboard, and CSV batch import.

Built as a full-stack TypeScript monorepo: **Node.js/Express** backend + **Vite React** frontend.

---

## Features

### Authentication & Security
- JWT-based authentication (30-day tokens stored in localStorage)
- bcryptjs password hashing via Mongoose pre-save hooks
- Protected routes on both client and server
- Inactive account blocking at login and middleware levels

### Role-Based Access Control (RBAC)
| Feature | Super Admin | HR Manager | Employee |
|---|---|---|---|
| View all employees | ✅ | ✅ | ❌ (self only) |
| Create employees | ✅ | ✅ | ❌ |
| Edit employees | ✅ | ✅ (excl. Super Admin) | ✅ (phone/image/password only) |
| Delete employees | ✅ | ❌ | ❌ |
| Assign Super Admin role | ✅ | ❌ | ❌ |
| Dashboard/analytics | ✅ | ✅ | ❌ |
| CSV import | ✅ | ✅ | ❌ |

### Employee Management
- Full CRUD with soft-delete (isDeleted flag, re-links reportees on delete)
- Fields: Employee ID, Name, Email, Phone, Department, Designation, Salary, Joining Date, Status, Role, Reporting Manager, Profile Image
- Profile image upload as Base64
- Pagination (6 per page), search by name/email/ID, filter by department/role/status, sort by name/joining date/salary

### Organizational Hierarchy
- Self-referencing `reportingManager` relation in MongoDB
- **Circular reporting prevention** — graph traversal algorithm blocks any chain that would create a cycle
- Interactive collapsible org tree with expand/collapse per node
- "You" badge highlights current user's node
- Direct reports listed on each profile page

### Dashboard Analytics (Recharts)
- Summary cards: Total, Active, Inactive employees + Department count
- Bar chart: Employees per department
- Donut chart: Role distribution
- Bar chart: Salary range bands ($0–$30k, $30k–$60k, etc.)

### CSV Batch Import
- Two-pass import: creates employees first, then binds manager links to avoid ordering issues
- Validates required fields, salary format, email format, duplicate IDs/emails
- Drag & drop upload with downloadable template CSV
- Per-row error logging with partial success support

### Bonus Features
- **Dark mode** — persistent via localStorage, toggled in sidebar
- **Soft delete** — employees are flagged `isDeleted: true`, never hard-deleted
- **Pagination** — all employee list APIs paginated
- **Docker** — full Compose setup (MongoDB + Express + React/Nginx)
- **Unit tests** — 4 tests covering cycle detection logic

---

## API Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Private |
| GET | `/api/auth/me` | Private |
| GET | `/api/employees` | Private |
| POST | `/api/employees` | Super Admin, HR |
| GET | `/api/employees/:id` | Private |
| PUT | `/api/employees/:id` | Private |
| DELETE | `/api/employees/:id` | Super Admin |
| GET | `/api/employees/:id/reportees` | Private |
| PATCH | `/api/employees/:id/manager` | Super Admin, HR |
| GET | `/api/employees/dashboard/stats` | Super Admin, HR |
| POST | `/api/employees/csv-import` | Super Admin, HR |
| GET | `/api/organization/tree` | Private |

---

## Tech Stack

- **Frontend**: Vite + React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, React Router v6
- **Backend**: Node.js + Express, TypeScript, Mongoose (MongoDB), JSON Web Token, bcryptjs, Multer, csv-parser
- **DevOps**: Docker, Docker Compose, Nginx (SPA + API proxy)

---

## Local Setup

Requires **Node.js 18+** and a local **MongoDB** instance (or use Docker Compose).

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Configure environment
The backend `.env` is pre-configured for local MongoDB. Edit `backend/.env` if needed:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ems
JWT_SECRET=supersecretkeyforemployeemanagement
NODE_ENV=development
```

### 3. Seed the database
```bash
npm run seed --prefix backend
```
This wipes existing data and creates 8 seeded employees across a realistic hierarchy.

### 4. Start both servers
```bash
npm run dev
```
- **Backend**: `http://localhost:5000`
- **Frontend**: `http://localhost:5173`

---

## Docker Compose

Spins up MongoDB, the Express API, and the React app served by Nginx:
```bash
docker-compose up --build
```
- **App**: `http://localhost:80`
- **API**: `http://localhost:5000`

In Docker, the Nginx config proxies all `/api/*` requests to the backend container automatically.

---

## Unit Tests

```bash
npm test --prefix backend
```

Tests 4 cycle-detection cases for the organizational hierarchy algorithm (no DB required — uses mocked data).

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@ems.com` | `password123` |
| HR Manager | `sarah@ems.com` | `password123` |
| HR Manager | `david@ems.com` | `password123` |
| Employee (Eng Lead) | `alice@ems.com` | `password123` |
| Employee | `bob@ems.com` | `password123` |
| Employee (Inactive) | `frank@ems.com` | `password123` |
