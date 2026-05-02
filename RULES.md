Build all frontend UI files for the Team Task Manager.
Use Next.js 16 App Router, TypeScript strict, Tailwind CSS,
shadcn/ui components.

Rules:
1. No inline styles — Tailwind classes only
2. No hardcoded colors — use Tailwind semantic classes
   (bg-destructive, text-muted-foreground etc.)
3. Every interactive element has loading state
4. Every form uses react-hook-form + zodResolver
5. Role-based rendering: read role from useSession()
   and conditionally render — never trust client role for API calls
6. All components typed with explicit Props interface
7. No `any` in any component
8. Responsive: mobile sidebar collapses to hamburger menu
9. Empty states on every list (no blank screens)
10. Error states on every data fetch
11. Use shadcn Dialog for all modals
12. Use shadcn DropdownMenu for all action menus
13. Overdue tasks highlighted with red due date text
14. Drag and drop on KanbanBoard using @dnd-kit/core

Build files in this order:
1. shared components first (StatusBadge, PriorityBadge,
   EmptyState, ConfirmDialog, Pagination, LoadingSpinner)
2. layout (Sidebar, Navbar, PageWrapper)
3. auth pages (login, signup)
4. dashboard page
5. projects list page + ProjectCard + ProjectForm
6. project detail page + KanbanBoard + TaskCard + TaskForm
7. tasks page with filters