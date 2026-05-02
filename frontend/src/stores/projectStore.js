import { create } from 'zustand';

const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // 新增專案到列表
  addProject: (project) => set((state) => ({ 
    projects: [project, ...state.projects] 
  })),

  // 更新專案列表中的某個專案
  updateProject: (updatedProject) => set((state) => ({
    projects: state.projects.map((p) => 
      p.id === updatedProject.id ? updatedProject : p
    ),
    currentProject: state.currentProject?.id === updatedProject.id 
      ? updatedProject 
      : state.currentProject
  })),

  // 刪除專案
  removeProject: (projectId) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== projectId),
    currentProject: state.currentProject?.id === projectId 
      ? null 
      : state.currentProject
  }))
}));

export default useProjectStore;
