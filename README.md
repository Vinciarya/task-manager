<h1 align="center">
  <br />
  <img src="public/favicon.ico" alt="TaskFlow Logo" width="80" />
  <br />
  TaskFlow — Team Task Manager
  <br />
</h1>

<p align="center">
  <strong>A production-grade, full-stack team task management application built with Next.js 15, NextAuth v5, Prisma 6, PostgreSQL, and Tailwind CSS.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-database-schema">Database Schema</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-project-structure">Project Structure</a>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Zustand" src="https://img.shields.io/badge/Zustand-5-orange" />
</p>

---

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based sessions** via NextAuth v5 Credentials Provider
- **Secure registration** with strict password policy (min 8 chars, uppercase, number, special character)
- **Role-based access control** — `ADMIN` and `MEMBER` roles at both global and project level
- **Protected routes** — middleware guards all dashboard pages and API endpoints
- Password hashing with `bcryptjs` (12 rounds)

### 📁 Project Management
- **Create & manage projects** with name and optional description
- **Invite team members** by email with role assignment (`ADMIN` / `MEMBER`)
- **Project-scoped roles** — admins can edit/delete the project and manage members
- **Member management** — add, remove, and protect the last admin from removal
- **Cascading deletion** — deleting a project removes all its tasks automatically

### ✅ Task Management
- **Rich task model** — title, description, status, priority, due date, assignee
- **Three statuses**: `TODO` → `IN_PROGRESS` → `DONE`
- **Three priority levels**: `LOW`, `MEDIUM`, `HIGH`
- **Kanban-style grouping** by status within each project
- **Advanced filtering** — by status, priority, assignee, and overdue state
- **Overdue detection** — tasks where `dueDate < now() AND status != DONE`
- **Paginated results** — all list endpoints paginated (default 10, max 100)

### 📊 Dashboard & Analytics
- **Personal dashboard stats**: total tasks, by-status breakdown, overdue count, due-today count
- **My Tasks** summary across all projects

### 🎨 UI/UX
- **Apple-inspired design system** — high-contrast palette, premium typography
- **Dark / Light mode** toggle with `next-themes`
- **Collapsible sidebar** navigation (Aceternity-style)
- **Smooth animations** via Framer Motion (`motion`)
- **shadcn/ui components** — Dialogs, Cards, Popovers, Calendar date-picker
- **Tabler Icons** + Lucide React icon libraries
- Fully **responsive** layout

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, TypeScript strict) |
| **Authentication** | NextAuth.js v5 — Credentials Provider, JWT strategy |
| **Database ORM** | Prisma 6 |
| **Database** | PostgreSQL (Supabase / Railway) |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Client State** | Zustand v5 |
| **Validation** | Zod v4 (single source of truth for types) |
| **Password Hashing** | bcryptjs (rounds = 12) |
| **Animations** | Framer Motion (motion) |
| **Icons** | Tabler Icons React + Lucide React |
| **Date Handling** | date-fns |
| **Runtime** | Node.js ≥ 20 |

---

## 🏗 Architecture

This application is built around a strict **Clean Architecture** with four enforced OOP pillars and all five SOLID principles.

```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
│    Route Handlers  →  Middleware HOFs  →  Service Layer      │
│                            │                                 │
│              ┌─────────────▼────────────┐                   │
│              │    Dependency Injection   │                   │
│              │      container.ts        │                   │
│              └──┬────────────────┬──────┘                   │
│                 │                │                           │
│         ┌───────▼──────┐  ┌──────▼────────┐               │
│         │   Services   │  │ Repositories  │               │
│         │  (Business   │  │  (DB Queries) │               │
│         │   Logic)     │  │               │               │
│         └──────────────┘  └───────┬───────┘               │
│                                   │                         │
│                           ┌───────▼───────┐               │
│                           │    Prisma 6   │               │
│                           │  PostgreSQL   │               │
│                           └───────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

- **Encapsulation** — All service/repository fields are `private readonly #field`. Passwords are sanitized exclusively inside `UserRepository.#sanitize()`.
- **Abstraction** — Every service and repository implements a typed interface. Route handlers depend only on interfaces, never concrete classes.
- **Inheritance** — `BaseRepository<T, C, U>` provides `findById`, `findAll`, `create`, `update`, `delete`, and `count`. All repositories extend it.
- **Polymorphism** — `ApiResponse.error()` handles `AppError`, `ZodError`, `PrismaClientKnownRequestError`, and `unknown` uniformly. `withRole()` is the same function with different behavior per role.
- **Single Responsibility** — Controllers parse & respond. Services own business logic. Repositories own DB queries.
- **Dependency Inversion** — Services and route handlers depend on interfaces; concrete classes are instantiated **only** in `src/lib/container.ts`.

### Middleware Composition (HOF Chain)

```typescript
export const POST = withHandler(
  withAuth(
    withValidation(createProjectSchema)(async (req) => {
      const userId = req.headers.get('x-user-id')!
      const body = JSON.parse(req.headers.get('x-validated-body')!)
      const project = await projectService.createProject(body, userId)
      return ApiResponse.created(project, 'Project created')
    })
  )
)
```

| HOF | Responsibility |
|-----|----------------|
| `withHandler` | Global try/catch → `ApiResponse.error()` |
| `withAuth` | Session check → injects `x-user-id`, `x-user-role` headers |
| `withRole(role)` | Reads `x-user-role`, throws 403 if insufficient |
| `withValidation(schema)` | Zod parse → 422 on error, attaches `x-validated-body` header |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** database (local, Supabase, Railway, or any compatible provider)
- **npm** or **pnpm**

### 1. Clone the repository

```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# NextAuth secret (generate with: openssl rand -hex 32)
NEXTAUTH_SECRET="your-super-secret-key-here"

# Public URL of your application
NEXTAUTH_URL="http://localhost:3000"
```

> **Tip:** Generate a strong secret with `openssl rand -hex 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 4. Push the database schema

```bash
npx prisma db push
```

Or run migrations in a production-like setup:

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Reference

All API routes are prefixed with `/api`. Protected routes require a valid session (JWT cookie or `Authorization` header).

### Authentication

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | `RegisterInput` | Create a new account |
| `POST` | `/api/auth/signin` | ❌ | `LoginInput` | Sign in (NextAuth handler) |

**RegisterInput:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secure@1234",
  "role": "MEMBER"
}
```

**Password requirements:** min 8 characters, at least 1 uppercase, 1 number, and 1 special character.

---

### Projects

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/projects` | Any member | List all projects for current user |
| `POST` | `/api/projects` | Authenticated | Create a new project |
| `GET` | `/api/projects/:id` | Project member | Get project details |
| `PATCH` | `/api/projects/:id` | Project ADMIN | Update project name/description |
| `DELETE` | `/api/projects/:id` | Project ADMIN | Delete project (cascades tasks) |
| `POST` | `/api/projects/:id/members` | Project ADMIN | Add a member by email |
| `DELETE` | `/api/projects/:id/members/:userId` | Project ADMIN | Remove a member |

---

### Tasks

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/tasks` | Project member | List tasks with filters |
| `POST` | `/api/tasks` | Project member | Create a new task |
| `GET` | `/api/tasks/:id` | Project member | Get a single task |
| `PATCH` | `/api/tasks/:id` | Creator or Project ADMIN | Update task details |
| `PATCH` | `/api/tasks/:id/status` | Any project member | Update task status only |
| `DELETE` | `/api/tasks/:id` | Creator or Project ADMIN | Delete a task |

**Task filters (query params):**
```
GET /api/tasks?projectId=xxx&status=TODO&priority=HIGH&overdue=true&page=1&limit=10
```

---

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Get personal task statistics |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTasks": 42,
    "byStatus": { "TODO": 10, "IN_PROGRESS": 15, "DONE": 17 },
    "overdueCount": 3,
    "dueTodayCount": 5,
    "myTasks": []
  }
}
```

---

### Error Responses

All errors follow a consistent shape:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": { "fieldName": ["Validation error detail"] },
  "statusCode": 422
}
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request — invalid input or business rule violation |
| `401` | Unauthorized — missing or invalid session |
| `403` | Forbidden — insufficient role or not a project member |
| `404` | Not found — resource does not exist |
| `409` | Conflict — duplicate resource (email, project name, existing member) |
| `422` | Unprocessable — Zod validation failed, with field-level errors |
| `500` | Internal server error — unexpected failure |
| `503` | Service unavailable — database connection failed |

---

## 🗄 Database Schema

```
┌──────────────┐        ┌────────────────────┐        ┌──────────────┐
│    User      │◄───────│   ProjectMember    │────────►│   Project    │
├──────────────┤        ├────────────────────┤        ├──────────────┤
│ id (cuid)    │        │ userId (FK)        │        │ id (cuid)    │
│ name         │        │ projectId (FK)     │        │ name         │
│ email        │        │ role (ADMIN|MEMBER)│        │ description? │
│ password     │        │ joinedAt           │        │ ownerId (FK) │
│ role         │        └────────────────────┘        │ createdAt    │
│ createdAt    │                                       │ updatedAt    │
│ updatedAt    │        ┌──────────────────────┐      └──────┬───────┘
└──────────────┘        │        Task          │             │
                        ├──────────────────────┤             │ cascade
                        │ id (cuid)            │◄────────────┘
                        │ title                │
                        │ description?         │
                        │ status (TODO|...|DONE│
                        │ priority (LOW|MED|HI)│
                        │ dueDate?             │
                        │ projectId (FK)       │
                        │ assignedToId? (FK)   │
                        │ createdById (FK)     │
                        │ createdAt / updatedAt│
                        └──────────────────────┘
```

**Enums:**
- `Role`: `ADMIN` | `MEMBER`
- `TaskStatus`: `TODO` | `IN_PROGRESS` | `DONE`
- `TaskPriority`: `LOW` | `MEDIUM` | `HIGH`

**Key constraints:**
- `Project` — `@@unique([ownerId, name])` — no duplicate project names per owner
- `ProjectMember` — `@@id([userId, projectId])` — composite primary key
- Cascade: deleting a `Project` deletes all its `Task` records

---

## 📂 Project Structure

```
task-manager/
├── prisma/
│   └── schema.prisma              # Database models & enums
├── src/
│   ├── app/
│   │   ├── (auth)/                # Login & signup pages (unauthenticated)
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/           # Protected pages (require session)
│   │   │   ├── layout.tsx         # Sidebar + Navbar shell
│   │   │   ├── dashboard/page.tsx # Stats & overview
│   │   │   ├── projects/          # Project list & detail pages
│   │   │   └── tasks/page.tsx     # Task list with filters
│   │   ├── api/
│   │   │   ├── auth/              # NextAuth route handler
│   │   │   ├── projects/          # Project CRUD + member management
│   │   │   ├── tasks/             # Task CRUD + status update
│   │   │   └── dashboard/stats/   # Dashboard stats endpoint
│   │   ├── globals.css            # Tailwind base + design tokens
│   │   └── layout.tsx             # Root layout with ThemeProvider
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # Top navbar (auth state, dark mode)
│   │   │   ├── Sidebar.tsx        # Collapsible sidebar navigation
│   │   │   └── PageWrapper.tsx    # Page padding wrapper
│   │   ├── project/               # ProjectCard, ProjectDialog, MembersList
│   │   ├── task/                  # TaskCard, TaskFilters, TaskDialog, KanbanBoard
│   │   ├── shared/                # EmptyState, LoadingSpinner, etc.
│   │   ├── providers/             # SessionProvider wrapper
│   │   ├── ui/                    # shadcn/ui primitives (Button, Dialog, Card…)
│   │   ├── mode-toggle.tsx        # Light/dark mode toggle
│   │   └── theme-provider.tsx     # next-themes provider
│   ├── lib/
│   │   ├── container.ts           # Dependency injection — single instantiation point
│   │   ├── prisma.ts              # Prisma singleton (globalThis pattern)
│   │   ├── env.ts                 # Zod-validated env variables
│   │   ├── auth.config.ts         # NextAuth full config (credentials + callbacks)
│   │   ├── auth.edge.config.ts    # Minimal edge-safe auth config (middleware)
│   │   ├── auth.ts                # NextAuth instance export
│   │   ├── api-response.ts        # ApiResponse class (success / error shaping)
│   │   ├── errors.ts              # AppError class + factory methods
│   │   ├── logger.ts              # Logger class (info, warn, error, debug)
│   │   ├── base.repository.ts     # BaseRepository<T, C, U> abstract class
│   │   ├── with-handler.ts        # HOF: global try/catch
│   │   ├── with-auth.ts           # HOF: session guard → injects headers
│   │   ├── with-role.ts           # HOF: role-based access control
│   │   └── with-validation.ts     # HOF: Zod body validation
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.schema.ts     # registerSchema, loginSchema + inferred types
│   │   │   ├── auth.repository.ts # AuthRepository (findByEmail, createUser)
│   │   │   └── auth.service.ts    # AuthService (register, validateCredentials)
│   │   ├── project/
│   │   │   ├── project.schema.ts  # createProject, updateProject, addMember schemas
│   │   │   ├── project.repository.ts
│   │   │   └── project.service.ts
│   │   └── task/
│   │       ├── task.schema.ts     # createTask, updateTask, taskFilter schemas
│   │       ├── task.repository.ts
│   │       └── task.service.ts
│   ├── services/
│   │   └── apiClient.ts           # Frontend fetch wrapper (typed)
│   ├── store/
│   │   ├── projectStore.ts        # Zustand project state + CRUD actions
│   │   └── taskStore.ts           # Zustand task state + filter actions
│   ├── types/
│   │   └── index.ts               # All interfaces, enums, API types (no duplication)
│   └── hooks/                     # Custom React hooks
├── middleware.ts                  # Next.js route protection + auth redirects
├── components.json                # shadcn/ui config
├── next.config.ts                 # Next.js config
├── tsconfig.json                  # strict: true + path aliases
├── railway.json                   # Railway deployment config
└── .env                           # Local environment variables (git-ignored)
```

---

## 🌐 Deployment

### Railway (Recommended)

1. Push your code to GitHub.
2. Create a new Railway project and connect your repository.
3. Add a **PostgreSQL** plugin from the Railway dashboard.
4. Set the following environment variables in Railway:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Auto-filled by Railway PostgreSQL plugin |
   | `NEXTAUTH_SECRET` | `openssl rand -hex 32` |
   | `NEXTAUTH_URL` | Your Railway public URL (e.g., `https://your-app.up.railway.app`) |
   | `NODE_ENV` | `production` |

5. Railway will auto-detect Next.js and run `npm run build && npm start`.

The included `railway.json` configures the deploy command:
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Supabase (Database)

This project uses **Supabase PostgreSQL** for the hosted database. Connection pooling is handled via the Supabase pooler URL (`pooler.supabase.com:5432`). Both `DATABASE_URL` and `DIRECT_URL` should be set for Prisma to work correctly with pgbouncer.

### Vercel

1. Import the repository in Vercel.
2. Set all environment variables under **Settings → Environment Variables**.
3. Add a build command override if needed:
   ```bash
   npx prisma generate && next build
   ```

---

## 🔒 Security

- **No secrets in source** — all credentials managed via environment variables; `.env` is git-ignored.
- **Password never returned** — `UserRepository.#sanitize()` strips the password field before any data leaves the DB layer.
- **JWT validation** — tampered or expired tokens return `401` before any business logic executes.
- **Role tamper-proof** — `role` field in request bodies is ignored; role is always set server-side.
- **UUID validation** — invalid `:id` path params are rejected with `400` before hitting the database.
- **Zod on all inputs** — every route with a body uses `withValidation()` HOF; raw `process.env` is never accessed directly.
- **bcryptjs rounds = 12** — deliberate CPU cost to slow brute-force attacks.

---

## 🧪 Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Type-check the entire project
npx tsc --noEmit

# Lint the codebase
npm run lint

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Push schema changes to the database
npx prisma db push

# Generate Prisma Client after schema changes
npx prisma generate

# Build for production
npm run build

# Start production server
npm start
```

---

## 📋 Edge Cases Handled

### Authentication
| Scenario | Response |
|----------|----------|
| Duplicate email on signup | `409` — "Email already registered" |
| Login with wrong email or password | `401` — "Invalid credentials" (intentionally ambiguous) |
| Weak password | `422` — field-level Zod errors |
| Expired session | `401` on any protected route |
| Tampered JWT | `401` |

### Projects
| Scenario | Response |
|----------|----------|
| Duplicate project name (same owner) | `409` |
| Non-member accessing project | `403` |
| Member trying to update/delete | `403` |
| Adding non-existent email as member | `404` |
| Adding already-existing member | `409` |
| Removing the only ADMIN | `400` — "Cannot remove the only admin from project" |

### Tasks
| Scenario | Response |
|----------|----------|
| Assignee not in project | `400` |
| Due date in the past | `422` |
| Non-creator/non-admin editing task | `403` |
| Any member updating status | `200` ✅ |
| Accessing task in foreign project | `403` |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

Please ensure:
- TypeScript strict mode passes: `npx tsc --noEmit`
- No `console.log` statements (use `Logger`)
- No `any` types
- All new endpoints are tested for auth, role, and validation edge cases

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
  Built with ❤️ using Next.js, Prisma, and PostgreSQL
</p>
