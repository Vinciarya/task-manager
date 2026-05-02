import { useState, useEffect, useCallback } from "react";
import { request } from "@/services/api.client";

export interface DashboardStats {
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await request<DashboardStats>("/api/dashboard/stats");
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard stats");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const initFetch = async () => {
      try {
        const response = await request<DashboardStats>("/api/dashboard/stats");
        if (response.success && response.data && isMounted) {
          setStats(response.data);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load dashboard stats");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initFetch();

    return () => {
      isMounted = false;
    };
  }, []);

  return { 
    stats, 
    isLoading, 
    error,
    refreshStats: fetchStats
  };
}
