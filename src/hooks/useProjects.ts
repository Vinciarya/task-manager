import { useEffect, useCallback } from "react";
import { useProjectStore } from "@/store";
import { projectService } from "@/services";
import { CreateProjectInput, UpdateProjectInput, AddMemberInput } from "@/modules/project/project.schema";
import { IProjectWithMeta } from "@/types";

export function useProjects() {
  const {
    projects,
    isLoading,
    error,
    setProjects,
    addProject,
    updateProject: updateProjectInStore,
    removeProject,
    setLoading,
    setError,
  } = useProjectStore();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.getProjects();
      if (response.success && response.data) {
        setProjects(response.data.items);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, setError]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: CreateProjectInput) => {
    const tempId = `temp-project-${Date.now()}`;
    const tempProject: IProjectWithMeta = {
      id: tempId,
      name: data.name,
      description: data.description || null,
      ownerId: "temp-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
      memberCount: 1,
      taskCounts: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
    };
    
    // Optimistic UI update
    addProject(tempProject);
    setError(null);

    try {
      const response = await projectService.createProject(data);
      if (response.success && response.data) {
        removeProject(tempId);
        
        const realProject: IProjectWithMeta = {
           ...response.data,
           memberCount: 1,
           taskCounts: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        };
        addProject(realProject);
        return realProject;
      }
    } catch (err: any) {
      removeProject(tempId);
      setError(err.message || "Failed to create project");
      throw err;
    }
  };

  const updateProject = async (id: string, data: UpdateProjectInput) => {
    const previousProject = projects.find(p => p.id === id);
    if (!previousProject) return;

    // Optimistic UI update
    updateProjectInStore(id, data);
    setError(null);

    try {
      const response = await projectService.updateProject(id, data);
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err: any) {
      // Revert on failure
      updateProjectInStore(id, previousProject);
      setError(err.message || "Failed to update project");
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    const previousProject = projects.find(p => p.id === id);
    if (!previousProject) return;

    // Optimistic UI update
    removeProject(id);
    setError(null);

    try {
      const response = await projectService.deleteProject(id);
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err: any) {
      // Revert on failure
      addProject(previousProject);
      setError(err.message || "Failed to delete project");
      throw err;
    }
  };

  const addMember = async (projectId: string, data: AddMemberInput) => {
    try {
      const response = await projectService.addMember(projectId, data);
      if (response.success) {
        fetchProjects(); // Refresh projects list to update member counts
      }
    } catch (err: any) {
      setError(err.message || "Failed to add member");
      throw err;
    }
  };

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    refreshProjects: fetchProjects
  };
}
