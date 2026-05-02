import { AuthRepository } from "@/modules/auth/auth.repository";
import type { IAuthService } from "@/modules/auth/auth.service";
import { AuthService } from "@/modules/auth/auth.service";
import type { IProjectService } from "@/modules/project/project.service";
import { ProjectService } from "@/modules/project/project.service";
import { ProjectRepository } from "@/modules/project/project.repository";
import type { ITaskService } from "@/modules/task/task.service";
import { TaskService } from "@/modules/task/task.service";
import { TaskRepository } from "@/modules/task/task.repository";

const authRepository = new AuthRepository();
const projectRepository = new ProjectRepository();
const taskRepository = new TaskRepository();

export const authService: IAuthService = new AuthService(authRepository);
export const projectService: IProjectService = new ProjectService(
  projectRepository,
  authRepository
);
export const taskService: ITaskService = new TaskService(
  taskRepository,
  projectRepository
);
