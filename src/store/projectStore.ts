import { create } from "zustand";
import { IProject } from "@/types";

interface ProjectState {
  projects: IProject[];
  selectedProject: IProject | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  setProjects: (projects: IProject[]) => void;
  setSelectedProject: (project: IProject | null) => void;
  addProject: (project: IProject) => void;
  updateProject: (id: string, project: Partial<IProject>) => void;
  removeProject: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
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
}));
