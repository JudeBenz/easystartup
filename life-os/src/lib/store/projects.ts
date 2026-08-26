import { v4 as uuid } from "uuid";
import type { Project, Task } from "@/types/domain";

export const SEED_PROJECTS: Project[] = [
  {
    id: "proj-life-os",
    name: "Life OS App",
    description: "Build the GTA-style life tracker",
    status: "active",
    color: "#f39c12",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-fitness",
    name: "Get Fit",
    description: "Workout routine and nutrition plan",
    status: "planning",
    color: "#e74c3c",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-side",
    name: "Side Business",
    description: "Launch the online store",
    status: "active",
    color: "#9b59b6",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SEED_TASKS: Task[] = [
  {
    id: uuid(),
    projectId: "proj-life-os",
    title: "Design GTA desktop shell",
    done: true,
    priority: "high",
    order: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    projectId: "proj-life-os",
    title: "Build budget module",
    done: true,
    priority: "high",
    order: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    projectId: "proj-life-os",
    title: "Add Supabase sync",
    done: false,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    priority: "medium",
    order: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    projectId: "proj-fitness",
    title: "Research workout plans",
    done: false,
    priority: "low",
    order: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    projectId: "proj-side",
    title: "Set up Stripe",
    done: false,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    priority: "high",
    order: 0,
    updatedAt: new Date().toISOString(),
  },
];

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
