import { useEffect, useCallback } from "react";
import { useProjectStore } from "@/store";
import { projectService } from "@/services";
import { CreateProjectInput, UpdateProjectInput, AddMemberInput } from "@/modules/project/project.schema";
import { IProjectWithMeta } from "@/types";
import { getErrorMessage } from "@/lib/error-message";

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
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to fetch projects"));
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, setError]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: CreateProjectInput): Promise<IProjectWithMeta | null> => {
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

      removeProject(tempId);
      return null;
    } catch (error: unknown) {
      removeProject(tempId);
      setError(getErrorMessage(error, "Failed to create project"));
      throw error;
    }
  };

  const updateProject = async (id: string, data: UpdateProjectInput): Promise<void> => {
    const previousProject = projects.find(p => p.id === id);
    if (!previousProject) return;

    // Optimistic UI update
    updateProjectInStore(id, getDefinedProjectUpdates(data));
    setError(null);

    try {
      const response = await projectService.updateProject(id, data);
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error: unknown) {
      // Revert on failure
      updateProjectInStore(id, previousProject);
      setError(getErrorMessage(error, "Failed to update project"));
      throw error;
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
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
    } catch (error: unknown) {
      // Revert on failure
      addProject(previousProject);
      setError(getErrorMessage(error, "Failed to delete project"));
      throw error;
    }
  };

  const addMember = async (projectId: string, data: AddMemberInput): Promise<void> => {
    try {
      const response = await projectService.addMember(projectId, data);
      if (response.success) {
        await fetchProjects(); // Refresh projects list to update member counts
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to add member"));
      throw error;
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

function getDefinedProjectUpdates(data: UpdateProjectInput): Partial<IProjectWithMeta> {
  const updates: Partial<IProjectWithMeta> = {};

  if (data.name !== undefined) {
    updates.name = data.name;
  }

  if (data.description !== undefined) {
    updates.description = data.description;
  }

  return updates;
}
