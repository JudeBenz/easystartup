import { v4 as uuid } from "uuid";
import type { Project, Task } from "@/types/domain";

/** Fresh account — no mock projects */
export const SEED_PROJECTS: Project[] = [];
export const SEED_TASKS: Task[] = [];

export interface ProjectsSlice {
  projects: Project[];
  tasks: Task[];
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => void;
  addTask: (task: Omit<Task, "id" | "updatedAt">) => void;
  toggleTask: (id: string) => void;
  updateProjectStatus: (id: string, status: Project["status"]) => void;
}

export const createProjectsSlice = (
  set: (fn: (state: ProjectsSlice) => Partial<ProjectsSlice>) => void,
): ProjectsSlice => ({
  projects: SEED_PROJECTS,
  tasks: SEED_TASKS,

  addProject: (project) =>
    set((state) => ({
      projects: [
        ...state.projects,
        {
          ...project,
          id: uuid(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),

  addTask: (task) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        { ...task, id: uuid(), updatedAt: new Date().toISOString() },
      ],
    })),

  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, updatedAt: new Date().toISOString() }
          : t,
      ),
    })),

  updateProjectStatus: (id, status) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, status, updatedAt: new Date().toISOString() }
          : p,
      ),
    })),
});
