import { create } from "zustand";
import { IProjectWithMeta } from "@/types";
import { projectService } from "@/services/project.service";
import type {
  CreateProjectInput,
} from "@/modules/project/project.schema";
import { getErrorMessage } from "@/lib/error-message";

interface ProjectState {
  projects: IProjectWithMeta[];
  selectedProject: IProjectWithMeta | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  setProjects: (projects: IProjectWithMeta[]) => void;
  setSelectedProject: (project: IProjectWithMeta | null) => void;
  addProject: (project: IProjectWithMeta) => void;
  updateProject: (id: string, project: Partial<IProjectWithMeta>) => void;
  removeProject: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<IProjectWithMeta | null>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState & ProjectActions>((set) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  
  addProject: (project) => set((state) => ({ 
    projects: [...state.projects, project] 
  })),
  
  updateProject: (id, projectUpdates) => set((state) => ({
    projects: state.projects.map((p) => (p.id === id ? { ...p, ...projectUpdates } : p)),
    selectedProject: state.selectedProject?.id === id 
      ? { ...state.selectedProject, ...projectUpdates } 
      : state.selectedProject,
  })),
  
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
    selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  fetchProjects: async (): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const response = await projectService.getProjects();
      set({ projects: response.data?.items ?? [] });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to fetch projects") });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (data: CreateProjectInput): Promise<IProjectWithMeta | null> => {
    set({ isLoading: true, error: null });

    try {
      const response = await projectService.createProject(data);
      if (!response.data) {
        return null;
      }

      const project: IProjectWithMeta = {
        ...response.data,
        memberCount: 1,
        taskCounts: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
      };

      set((state) => ({ projects: [...state.projects, project] }));
      return project;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to create project") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProject: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      await projectService.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
        selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to delete project") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
