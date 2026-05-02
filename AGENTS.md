<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
You are a senior full-stack TypeScript engineer. Build a complete
Team Task Manager web application. Follow every instruction exactly.
Do not skip any section. Do not add placeholder comments. Do not leave
TODOs. Every file must be production-ready and complete.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Next.js 15 (App Router, TypeScript strict)
- NextAuth.js v5 (Credentials provider)
- Prisma 5 + PostgreSQL
- Tailwind CSS v3 + shadcn/ui
- Zustand (client state)
- Zod v3 (validation, single source of truth for types)
- bcryptjs (password hashing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE CODE RULES — NEVER VIOLATE THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPESCRIPT:
- strict: true, noUnusedLocals: true, noUnusedParameters: true
- No `any` — use `unknown` and narrow it
- No non-null assertions (!) — handle null explicitly
- No type assertions (as Type) unless provably safe
- Infer all types from Zod schemas — never duplicate type definitions
- All async functions have explicit Promise<T> return types
- Use `interface` for objects, `type` for unions and primitives
- Use `readonly` on all properties that must not mutate
- Use `#` private fields on all class internals

OOP — ENFORCE ALL 4 PILLARS:

1. ENCAPSULATION:
   - All service class fields: private readonly #field
   - All repository class fields: private readonly #model
   - No public fields except via explicit getters
   - Password is stripped inside UserRepository.sanitize()
     and NEVER outside it — no other code touches password field

2. ABSTRACTION:
   - Every service class implements an interface (IAuthService, etc.)
   - Every repository class implements an interface (IUserRepository, etc.)
   - API route handlers only receive and call service interfaces
   - They never know the concrete implementation
   - withHandler, withAuth, withValidation hide all cross-cutting logic

3. INHERITANCE:
   - BaseRepository<T, CreateInput, UpdateInput> is the abstract base
   - All repositories extend it and call super(prismaModel)
   - BaseRepository implements: findById, findAll, findOne,
     create, update, delete, count
   - Subclasses only add domain-specific methods
   - No copy-pasting of findById or create logic anywhere

4. POLYMORPHISM:
   - All services are typed against their interface, not concrete class
   - withRole(Role.ADMIN) and withRole(Role.MEMBER) are same function,
     different behavior
   - ApiResponse.error() handles AppError, ZodError, PrismaError,
     and unknown — polymorphic error handling in one place

SOLID — ENFORCE ALL 5 PRINCIPLES:

S — Single Responsibility:
   - Controller (route handler) does: parse request, call service,
     return response. Nothing else.
   - Service does: business logic and authorization checks. Nothing else.
   - Repository does: database queries. Nothing else.
   - Middleware does: one cross-cutting concern each.
   - Never put DB calls in route handlers.
   - Never put business logic in repositories.

O — Open/Closed:
   - BaseRepository is closed for modification, open for extension
   - New query types = new repository method, never edit base
   - Middleware is composable — add new behavior by wrapping,
     never by editing existing middleware

L — Liskov Substitution:
   - Any IUserRepository implementation can replace another
   - Any IAuthService implementation can replace another
   - Subtypes never throw errors their base interface doesn't declare

I — Interface Segregation:
   - IAuthService only has auth methods
   - IProjectService only has project methods
   - ITaskService only has task methods
   - No god interfaces
   - withAuth and withRole are separate middleware — never merged

D — Dependency Inversion:
   - Services depend on repository interfaces, not concrete classes
   - Route handlers depend on service interfaces, not concrete classes
   - Concrete classes are instantiated only in one place:
     src/lib/container.ts (dependency injection container)
   - Nothing imports a concrete service or repository directly
     except container.ts

DEAD CODE RULES:
   - No commented-out code
   - No unused imports
   - No unused variables or parameters
   - No functions that are defined but never called
   - No console.log in any file (use a Logger class)
   - ESLint with no-unused-vars, no-console rules enforced

DRY RULES:
   - Every validation schema defined once in module.schema.ts
   - Every type inferred from schema — never written twice
   - All response shaping in ApiResponse class only
   - All error creation via AppError factories only
   - Date formatting, status labeling in utils/formatters.ts only
   - Auth check logic in withAuth only — never repeated in service
   - Membership check logic in ProjectService.#verifyMembership only

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EDGE CASES — HANDLE ALL OF THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AUTH:
- Duplicate email on signup → 409 with message "Email already registered"
- Login with unregistered email → 401 "Invalid credentials"
  (never say which field is wrong)
- Login with wrong password → 401 "Invalid credentials"
- Password less than 8 chars, no uppercase, no number → 422 with
  field-level zod errors
- Expired session → 401 on any protected route
- Tampered JWT → 401
- Missing Authorization → 401
- Role field tampered in request body → ignored, role set server-side only

PROJECTS:
- Create project with name that already exists for this user → 409
- Get project user is not a member of → 403
- Update project as MEMBER (not ADMIN) → 403
- Delete project as MEMBER → 403
- Add member with email that does not exist → 404
- Add member who is already in project → 409
- Add member to project you are not ADMIN of → 403
- Remove yourself as the only ADMIN → 400
  "Cannot remove the only admin from project"
- Delete project cascades all tasks

TASKS:
- Create task with assignedTo user not in project → 400
- Create task with dueDate in the past → 422
- Update task you did not create and are not project ADMIN → 403
- Delete task you did not create and are not project ADMIN → 403
- Update status as any project member → 200 (allowed)
- Get tasks for project you are not member of → 403
- Invalid status transition is allowed (no forced flow)
- Overdue filter: dueDate < now() AND status != DONE
- Pagination: default page=1, limit=10, max limit=100

GENERAL:
- Invalid UUID format for any :id param → 400 before DB hit
- Request body is not valid JSON → 400
- Unknown route → 404
- Method not allowed → 405
- Empty string treated as missing field (zod .min(1) everywhere)
- Whitespace-only strings → trimmed then validated
- All list endpoints paginated, never return unbounded results
- Database connection failure → 503 with retry suggestion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE — BUILD IN THIS EXACT ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — PRISMA SCHEMA
File: prisma/schema.prisma

Models:
  User: id(cuid), name, email(unique), password, role(ADMIN|MEMBER),
        createdAt, updatedAt
  Project: id(cuid), name, description?, ownerId(→User),
           createdAt, updatedAt
  ProjectMember: userId(→User), projectId(→Project),
                 role(ADMIN|MEMBER), joinedAt
                 @@unique([userId, projectId])
  Task: id(cuid), title, description?, status(TODO|IN_PROGRESS|DONE),
        priority(LOW|MEDIUM|HIGH), dueDate?, projectId(→Project),
        assignedToId(→User)?, createdById(→User),
        createdAt, updatedAt

All relations bidirectional. Cascade delete: Project delete → Task delete.

STEP 2 — TYPES
File: src/types/index.ts

- Enums: Role, TaskStatus, TaskPriority (mirror Prisma enums)
- IUser (no password field ever)
- IProject, IProjectMember, ITask
- IProjectWithMeta: IProject + memberCount + taskCounts{TODO,IN_PROGRESS,DONE}
- IDashboardStats: totalTasks, byStatus, overdueCount,
  dueTodayCount, myTasks
- ApiSuccessResponse<T>: {success:true, message:string, data:T, statusCode:number}
- ApiErrorResponse: {success:false, message:string, errors?:Record<string,string[]>, statusCode:number}
- ApiResponse<T>: ApiSuccessResponse<T> | ApiErrorResponse
- PaginationParams: {page:number, limit:number}
- PaginatedResult<T>: {items:T[], total:number, page:number,
  limit:number, totalPages:number}
- SessionUser: {id:string, email:string, name:string, role:Role}
- Extend NextAuth types: Session.user → SessionUser, JWT → SessionUser fields

STEP 3 — ENV VALIDATION
File: src/lib/env.ts

Use Zod to parse process.env.
Required: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
Throw on startup if missing with: "Missing env var: <NAME>"
Export typed `env` object.
Import env from here everywhere. Never use process.env directly.

STEP 4 — PRISMA SINGLETON
File: src/lib/prisma.ts

Standard Next.js Prisma singleton using globalThis.
Log: query, error in development. error only in production.
Export as `db`.

STEP 5 — LOGGER
File: src/lib/logger.ts

Class Logger with static methods: info, warn, error, debug
In production: only error and warn
In development: all levels
Format: [LEVEL] [timestamp] message
Never use console.log anywhere else in the codebase.

STEP 6 — APP ERROR
File: src/core/AppError.ts

class AppError extends Error:
  readonly statusCode: number
  readonly isOperational: boolean
  constructor(message, statusCode, isOperational = true)
  static badRequest(msg?: string): AppError      // 400
  static unauthorized(msg?: string): AppError    // 401
  static forbidden(msg?: string): AppError       // 403
  static notFound(msg?: string): AppError        // 404
  static conflict(msg?: string): AppError        // 409
  static unprocessable(msg?: string): AppError   // 422
  static internal(msg?: string): AppError        // 500
  static serviceUnavailable(msg?: string): AppError // 503

STEP 7 — API RESPONSE
File: src/core/ApiResponse.ts

class ApiResponse:
  static success<T>(data: T, message: string, status = 200): NextResponse
  static created<T>(data: T, message: string): NextResponse
  static noContent(): NextResponse
  static error(error: unknown): NextResponse
    Handles:
    - AppError → statusCode, message
    - ZodError → 422, format field errors as Record<string, string[]>
    - PrismaClientKnownRequestError:
        P2002 → 409 "Already exists"
        P2025 → 404 "Record not found"
        P2003 → 400 "Invalid reference"
        P1001 → 503 "Database unavailable"
    - Unknown → 500, log via Logger, return generic message
    Never leak stack traces or internal messages in production.

STEP 8 — BASE REPOSITORY
File: src/core/BaseRepository.ts

interface IBaseRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T>
  findAll(params: FindAllParams): Promise<PaginatedResult<T>>
  findOne(where: object): Promise<T | null>
  create(data: CreateInput): Promise<T>
  update(id: string, data: UpdateInput): Promise<T>
  delete(id: string): Promise<void>
  count(where?: object): Promise<number>
}

abstract class BaseRepository<T, C, U>
  implements IBaseRepository<T, C, U>:
  #model: any  (Prisma delegate, injected via constructor)
  
  findById: throws AppError.notFound() if null
  findAll: applies skip/take from page/limit, returns PaginatedResult
  findOne: returns null if not found (caller decides)
  create: returns created record
  update: throws AppError.notFound() if not exists before update
  delete: throws AppError.notFound() if not exists before delete
  count: returns number

STEP 9 — MIDDLEWARE
File: src/middleware/withHandler.ts
  Wraps async route handler in try/catch → ApiResponse.error()
  Type: (fn: RouteHandler) => RouteHandler

File: src/middleware/withAuth.ts
  Gets session via NextAuth auth()
  If no session → AppError.unauthorized()
  Injects user id and role into request headers:
    x-user-id, x-user-role
  Returns wrapped handler

File: src/middleware/withRole.ts
  Factory: withRole(required: Role) → MiddlewareWrapper
  Reads x-user-role from headers
  If role insufficient → AppError.forbidden()

File: src/middleware/withValidation.ts
  Factory: withValidation<T>(schema: ZodSchema<T>) → MiddlewareWrapper
  Parses request body with schema
  On ZodError → AppError.unprocessable() with field errors
  Attaches parsed body to x-validated-body header as JSON

STEP 10 — AUTH MODULE
File: src/modules/auth/auth.schema.ts
  registerSchema: name(min 2, trim), email(valid, lowercase),
    password(min 8, regex: uppercase + number + special char),
    role(Role enum, default MEMBER)
  loginSchema: email(valid), password(min 1)
  Export inferred types: RegisterInput, LoginInput

File: src/modules/auth/auth.repository.ts
  interface IAuthRepository:
    findByEmail(email: string): Promise<User | null>
    createUser(data: RegisterInput, hashedPassword: string): Promise<IUser>

  class AuthRepository extends BaseRepository<User, ...>
    implements IAuthRepository:
    #sanitize(user: User): IUser  — removes password field
    findByEmail: returns raw User (with password, for comparison)
    createUser: hashes NOT done here (service responsibility),
      creates user, returns sanitized

File: src/modules/auth/auth.service.ts
  interface IAuthService:
    register(data: RegisterInput): Promise<IUser>
    validateCredentials(email: string, password: string): Promise<IUser>

  class AuthService implements IAuthService:
    #repository: IAuthRepository  (private readonly)
    constructor(repository: IAuthRepository)
    register:
      1. findByEmail → if exists throw AppError.conflict("Email already registered")
      2. hash password with bcryptjs rounds=12
      3. createUser
      4. return IUser (no password)
    validateCredentials:
      1. findByEmail → if null throw AppError.unauthorized("Invalid credentials")
      2. bcrypt.compare → if false throw AppError.unauthorized("Invalid credentials")
      3. return sanitized IUser
      Never differentiate between wrong email vs wrong password in error message.

STEP 11 — NEXTAUTH CONFIG
File: src/lib/auth.config.ts

  NextAuth v5 config:
  - Credentials provider
  - authorize() calls AuthService.validateCredentials()
  - Returns user object or null (never throw in authorize)
  - jwt callback: add id, role to token
  - session callback: add id, role to session.user
  - pages: { signIn: '/login' }
  - session strategy: jwt

File: src/app/api/auth/[...nextauth]/route.ts
  Export { GET, POST } from NextAuth handler

STEP 12 — PROJECT MODULE
File: src/modules/project/project.schema.ts
  createProjectSchema: name(min 3, max 100, trim),
    description(optional, max 500, trim)
  updateProjectSchema: createProjectSchema.partial()
  addMemberSchema: email(valid), role(Role enum)
  Export inferred types

File: src/modules/project/project.repository.ts
  interface IProjectRepository extends IBaseRepository<...>:
    findProjectsForUser(userId: string): Promise<IProjectWithMeta[]>
    findProjectWithDetails(id: string): Promise<ProjectWithDetails | null>
    findMembership(userId: string, projectId: string):
      Promise<ProjectMember | null>
    createWithOwner(data, userId): Promise<IProject>
      (creates project + ProjectMember in transaction)
    addMember(projectId, userId, role): Promise<ProjectMember>
    removeMember(userId, projectId): Promise<void>
    getAdminCount(projectId: string): Promise<number>

  class ProjectRepository extends BaseRepository<...>
    implements IProjectRepository

File: src/modules/project/project.service.ts
  interface IProjectService:
    createProject(data, userId): Promise<IProject>
    getProjects(userId, pagination): Promise<PaginatedResult<IProjectWithMeta>>
    getProjectById(id, userId): Promise<ProjectWithDetails>
    updateProject(id, data, userId): Promise<IProject>
    deleteProject(id, userId): Promise<void>
    addMember(projectId, email, role, requesterId): Promise<ProjectMember>
    removeMember(projectId, targetUserId, requesterId): Promise<void>

  class ProjectService implements IProjectService:
    #repository: IProjectRepository
    #userRepository: IUserRepository
    constructor(projectRepo, userRepo)

    Private methods (not on interface):
    #verifyMembership(userId, projectId): Promise<ProjectMember>
      throws AppError.forbidden() if not member
    #verifyAdminAccess(userId, projectId): Promise<void>
      throws AppError.forbidden() if not ADMIN

    createProject:
      1. create project + owner as ADMIN (transaction in repository)
    getProjectById:
      1. #verifyMembership
      2. return project with details
    updateProject:
      1. #verifyAdminAccess
      2. update
    deleteProject:
      1. #verifyAdminAccess
      2. delete (cascade handles tasks)
    addMember:
      1. #verifyAdminAccess(requesterId)
      2. find user by email → 404 if not found
      3. check existing membership → 409 if exists
      4. add member
    removeMember:
      1. #verifyAdminAccess(requesterId)
      2. if target is ADMIN: check getAdminCount > 1
         else throw AppError.badRequest("Cannot remove the only admin")
      3. remove member

STEP 13 — TASK MODULE
File: src/modules/task/task.schema.ts
  createTaskSchema:
    title(min 3, max 200, trim)
    description(optional, max 2000, trim)
    status(TaskStatus enum, default TODO)
    priority(TaskPriority enum, default MEDIUM)
    dueDate(optional, coerce to Date,
      refine: date must be today or future,
      message: "Due date cannot be in the past")
    assignedToId(optional, cuid format)
  updateTaskSchema: createTaskSchema.partial()
  updateStatusSchema: z.object({ status: TaskStatus enum })
  taskFilterSchema:
    projectId(cuid)
    status(optional TaskStatus)
    priority(optional TaskPriority)
    assignedToId(optional cuid)
    overdue(optional, coerce boolean)
    page(coerce number, min 1, default 1)
    limit(coerce number, min 1, max 100, default 10)

File: src/modules/task/task.repository.ts
  interface ITaskRepository extends IBaseRepository<...>:
    findWithFilters(filters): Promise<PaginatedResult<ITask>>
    findByProjectGrouped(projectId): Promise<TasksByStatus>
    getDashboardStats(userId): Promise<IDashboardStats>

  class TaskRepository extends BaseRepository<...>
    implements ITaskRepository:
    findWithFilters:
      Build where clause dynamically:
      - if overdue: dueDate: { lt: new Date() }, status: { not: DONE }
      - all other filters applied if present
    findByProjectGrouped:
      fetch all tasks for project, group by status in memory
      return { TODO: [], IN_PROGRESS: [], DONE: [] }
    getDashboardStats:
      totalTasks assigned to userId
      byStatus: count per status
      overdueCount: dueDate < now, status != DONE, assignedTo = userId
      dueTodayCount: dueDate is today, assignedTo = userId

File: src/modules/task/task.service.ts
  interface ITaskService:
    createTask(data, projectId, creatorId): Promise<ITask>
    getTasks(filters): Promise<PaginatedResult<ITask>>
    getTasksByProject(projectId, userId): Promise<TasksByStatus>
    getTaskById(id, userId): Promise<ITask>
    updateTask(id, data, userId): Promise<ITask>
    updateStatus(id, status, userId): Promise<ITask>
    deleteTask(id, userId): Promise<void>
    getDashboardStats(userId): Promise<IDashboardStats>

  class TaskService implements ITaskService:
    #repository: ITaskRepository
    #projectRepository: IProjectRepository
    constructor(taskRepo, projectRepo)

    Private:
    #verifyProjectMembership(userId, projectId): Promise<ProjectMember>
    #verifyTaskAccess(task, userId, projectMember): void
      can edit if: task.createdById === userId
                OR projectMember.role === ADMIN

    createTask:
      1. #verifyProjectMembership(creatorId, projectId)
      2. if assignedToId: verify that user is also project member
      3. if dueDate: validate not in past (schema handles this but double-check)
      4. create task
    updateTask:
      1. #verifyProjectMembership(userId, task.projectId)
      2. #verifyTaskAccess
      3. update
    updateStatus:
      1. #verifyProjectMembership (any member can update status)
      2. update status only
    deleteTask:
      1. #verifyProjectMembership
      2. #verifyTaskAccess
      3. delete

STEP 14 — DEPENDENCY INJECTION CONTAINER
File: src/lib/container.ts

  Instantiate all concrete classes here and only here:
  
  const authRepository = new AuthRepository(db)
  const userRepository = new UserRepository(db)
  const projectRepository = new ProjectRepository(db)
  const taskRepository = new TaskRepository(db)
  
  export const authService: IAuthService =
    new AuthService(authRepository)
  export const projectService: IProjectService =
    new ProjectService(projectRepository, userRepository)
  export const taskService: ITaskService =
    new TaskService(taskRepository, projectRepository)

  No other file instantiates services or repositories.
  All route handlers import from container.ts only.

STEP 15 — API ROUTE HANDLERS
Pattern for every route:

  export const GET = withHandler(
    withAuth(async (req) => {
      const userId = req.headers.get('x-user-id')!
      const result = await projectService.getProjects(userId, pagination)
      return ApiResponse.success(result, 'Projects fetched')
    })
  )

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

Routes to create:
  POST   /api/auth/register
  POST   /api/auth/login (handled by NextAuth)
  
  GET    /api/projects
  POST   /api/projects
  GET    /api/projects/[id]
  PATCH  /api/projects/[id]
  DELETE /api/projects/[id]
  POST   /api/projects/[id]/members
  DELETE /api/projects/[id]/members/[userId]
  
  GET    /api/tasks?projectId=&status=&overdue=
  POST   /api/tasks
  GET    /api/tasks/[id]
  PATCH  /api/tasks/[id]
  PATCH  /api/tasks/[id]/status
  DELETE /api/tasks/[id]
  
  GET    /api/dashboard/stats

STEP 16 — NEXT.JS MIDDLEWARE
File: middleware.ts (root)

  Protected paths: /dashboard, /projects, /tasks
  Public paths: /login, /signup, /api/auth
  API paths /api/* (except /api/auth): let withAuth handle it
  
  Unauthenticated → redirect /login
  Authenticated hitting /login or /signup → redirect /dashboard
  Use NextAuth auth() helper. Typed with NextRequest.

STEP 17 — FRONTEND SERVICES
File: src/services/apiClient.ts

  Generic fetch wrapper:
  async function apiRequest<T>(
    url: string,
    options?: RequestInit
  ): Promise<ApiSuccessResponse<T>>
  
  - Automatically sets Content-Type: application/json
  - On non-ok response: parse error body, throw typed ApiError
  - Export typed ApiError class for error handling in hooks

File: src/services/project.service.ts
  All project API calls. Each method typed with input/output.

File: src/services/task.service.ts
  All task API calls.

File: src/services/dashboard.service.ts
  Dashboard stats call.

STEP 18 — ZUSTAND STORES
File: src/store/projectStore.ts
  interface ProjectState:
    projects: IProjectWithMeta[]
    selectedProject: ProjectWithDetails | null
    isLoading: boolean
    error: string | null
  interface ProjectActions:
    setProjects(projects): void
    setSelectedProject(project): void
    addProject(project): void
    updateProject(id, data): void
    removeProject(id): void
    setLoading(loading): void
    setError(error): void
    reset(): void
  
  Store: ProjectState & ProjectActions
  All state typed. No any. reset() clears to initial state.

File: src/store/taskStore.ts
  State: tasksByStatus (TasksByStatus), filters, isLoading, error
  Actions: setTasksByStatus, moveTask(id, from, to status),
    addTask, updateTask, removeTask, setFilters, reset

STEP 19 — CUSTOM HOOKS
File: src/hooks/useProjects.ts
  - Fetches on mount
  - Returns: { projects, isLoading, error, createProject,
    updateProject, deleteProject, addMember, removeMember }
  - Optimistic update on delete (remove from store immediately,
    revert on API error)
  - All methods handle ApiError and set store error

File: src/hooks/useTasks.ts
  - Accepts projectId
  - Returns: { tasksByStatus, isLoading, error, createTask,
    updateStatus, updateTask, deleteTask }
  - Optimistic status update for kanban drag

File: src/hooks/useDashboard.ts
  - Returns: { stats, isLoading, error }

STEP 20 — COMPONENTS

File: src/components/shared/StatusBadge.tsx
  Renders colored badge for TaskStatus and Role
  Uses variant map — no switch/if chains

File: src/components/shared/PriorityBadge.tsx
  Same pattern for TaskPriority

File: src/components/shared/EmptyState.tsx
  Generic empty state with icon, title, description, optional action

File: src/components/shared/Pagination.tsx
  Accepts: total, page, limit, onPageChange
  Fully typed

File: src/components/task/KanbanBoard.tsx
  Three columns: TODO, IN_PROGRESS, DONE
  Each column renders TaskCard list
  Drag to move: calls updateStatus optimistically

File: src/components/task/TaskCard.tsx
  Shows: title, priority badge, due date, assignee avatar
  Due date turns red if overdue
  Action menu: edit, delete (shown only if permitted)

File: src/components/project/ProjectForm.tsx
  Controlled form using react-hook-form + zod resolver
  Used for both create and update (accepts optional defaultValues)

File: src/components/task/TaskForm.tsx
  Same pattern — create and update
  Due date picker, assignee dropdown (only project members)
  Priority and status selectors

STEP 21 — PAGES

src/app/(auth)/login/page.tsx
  Login form → call NextAuth signIn('credentials')
  Redirect to /dashboard on success
  Show field errors

src/app/(auth)/signup/page.tsx
  Register form → POST /api/auth/register → then signIn
  Role selector: ADMIN or MEMBER

src/app/(dashboard)/layout.tsx
  Sidebar + Navbar wrapper
  Shows current user name and role

src/app/(dashboard)/dashboard/page.tsx
  Server component fetching IDashboardStats
  Cards: Total Tasks, In Progress, Overdue, Due Today
  My tasks list below

src/app/(dashboard)/projects/page.tsx
  Project list with create button (ADMIN only sees create)
  Each project card: name, member count, task progress bar

src/app/(dashboard)/projects/[id]/page.tsx
  Project detail with KanbanBoard
  Members panel (ADMIN can add/remove)
  Create task button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL CHECKLIST — VERIFY BEFORE CALLING DONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ No file imports a concrete Service or Repository
  except src/lib/container.ts
□ No route handler contains business logic
□ No service contains a direct Prisma call
□ No type is defined twice (all inferred from Zod)
□ No `any` in any file
□ No console.log in any file
□ No unused imports or variables
□ Every class field is private readonly #field
□ Every service implements a named interface
□ Every repository implements a named interface
□ BaseRepository is never modified — only extended
□ AppError is the only way errors are created
□ ApiResponse is the only way responses are shaped
□ All edge cases from the edge cases section are handled
□ All list endpoints are paginated
□ Password never appears outside UserRepository.#sanitize()
□ middleware.ts protects all dashboard routes
□ container.ts is the single instantiation point
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
