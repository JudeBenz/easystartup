"use client";

import { useMemo, useState } from "react";
import { useLifeStore } from "@/lib/store";
import type { ProjectStatus } from "@/types/domain";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  paused: "Paused",
  done: "Done",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: "bg-gray-200 text-gray-700",
  active: "bg-amber-100 text-amber-800",
  paused: "bg-orange-100 text-orange-800",
  done: "bg-emerald-100 text-emerald-800",
};

export function DynastyProjectsApp() {
  const projects = useLifeStore((s) => s.projects);
  const tasks = useLifeStore((s) => s.tasks);
  const toggleTask = useLifeStore((s) => s.toggleTask);
  const addTask = useLifeStore((s) => s.addTask);
  const addProject = useLifeStore((s) => s.addProject);
  const updateProjectStatus = useLifeStore((s) => s.updateProjectStatus);

  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "");
  const [newTask, setNewTask] = useState("");
  const [newProject, setNewProject] = useState("");

  const selected =
    projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;
  const activeId = selected?.id ?? "";

  const projectTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.projectId === activeId)
        .sort((a, b) => a.order - b.order),
    [tasks, activeId],
  );

  const doneCount = projectTasks.filter((t) => t.done).length;
  const progress =
    projectTasks.length > 0
      ? Math.round((doneCount / projectTasks.length) * 100)
      : 0;

  function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProject.trim()) return;
    addProject({
      name: newProject.trim(),
      description: "",
      status: "planning",
      color: "#f39c12",
    });
    setNewProject("");
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim() || !activeId) return;
    addTask({
      projectId: activeId,
      title: newTask.trim(),
      done: false,
      priority: "medium",
      order: projectTasks.length,
    });
    setNewTask("");
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-full flex-col bg-[#faf6ee]">
        <header className="border-b border-amber-800/20 bg-gradient-to-r from-amber-800 to-amber-600 px-4 py-3 text-white">
          <h2 className="text-base font-bold tracking-wide">DYNASTY 8</h2>
          <p className="text-xs text-amber-200">Project Management</p>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-3xl">🏗️</p>
          <div>
            <p className="font-semibold text-gray-800">No projects yet</p>
            <p className="mt-1 text-xs text-gray-500">
              Create your first project to track goals and tasks.
            </p>
          </div>
          <form onSubmit={handleAddProject} className="flex w-full max-w-xs gap-2">
            <input
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="Project name"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="rounded bg-amber-700 px-3 py-2 text-xs font-medium text-white"
            >
              Create
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-[#faf6ee] text-sm text-gray-900">
      <header className="border-b border-amber-800/20 bg-gradient-to-r from-amber-800 to-amber-600 px-4 py-2 text-white">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold tracking-wide">DYNASTY 8</h2>
            <p className="text-[10px] text-amber-200">Projects</p>
          </div>
          {selected && (
            <p className="text-right text-xs">
              <span className="block text-amber-200">{selected.name}</span>
              <span className="text-lg font-bold">{progress}%</span>
            </p>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="shrink-0 overflow-x-auto border-b border-gray-200 bg-white md:w-44 md:overflow-y-auto md:border-b-0 md:border-r">
          <div className="flex md:flex-col">
            {projects.map((p) => {
              const pTasks = tasks.filter((t) => t.projectId === p.id);
              const done = pTasks.filter((t) => t.done).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`min-w-[8rem] border-r border-gray-100 px-3 py-2 text-left md:min-w-0 md:border-b md:border-r-0 ${
                    activeId === p.id ? "bg-amber-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="truncate text-xs font-medium">{p.name}</span>
                  </div>
                  <div className="mt-1 flex justify-between pl-4">
                    <span
                      className={`rounded px-1 text-[9px] ${STATUS_COLORS[p.status]}`}
                    >
                      {STATUS_LABELS[p.status]}
                    </span>
                    <span className="text-[9px] text-gray-400">
                      {done}/{pTasks.length}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <form
            onSubmit={handleAddProject}
            className="flex gap-1 border-t border-gray-100 p-2"
          >
            <input
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="New project"
              className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1.5 text-[10px]"
            />
            <button
              type="submit"
              className="rounded bg-amber-700 px-2 text-[10px] text-white"
            >
              +
            </button>
          </form>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col p-3">
          {selected ? (
            <>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs text-gray-600">
                  {selected.description || "No description"}
                </p>
                <select
                  value={selected.status}
                  onChange={(e) =>
                    updateProjectStatus(
                      selected.id,
                      e.target.value as ProjectStatus,
                    )
                  }
                  className="rounded border border-gray-300 px-2 py-1 text-[10px]"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex-1 overflow-hidden rounded border border-gray-200 bg-white">
                {projectTasks.length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-400">
                    No tasks yet
                  </p>
                ) : (
                  projectTasks.map((t) => (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => toggleTask(t.id)}
                        className="h-4 w-4"
                      />
                      <span
                        className={`min-w-0 flex-1 text-xs ${
                          t.done ? "text-gray-400 line-through" : ""
                        }`}
                      >
                        {t.title}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <form onSubmit={handleAddTask} className="mt-2 flex gap-2">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a task…"
                  className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded bg-amber-700 px-3 py-2 text-xs font-medium text-white"
                >
                  Add
                </button>
              </form>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
