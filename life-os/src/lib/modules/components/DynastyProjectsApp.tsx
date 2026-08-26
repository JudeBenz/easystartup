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
  const updateProjectStatus = useLifeStore((s) => s.updateProjectStatus);

  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "");
  const [newTask, setNewTask] = useState("");

  const selected = projects.find((p) => p.id === selectedId);
  const projectTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.projectId === selectedId)
        .sort((a, b) => a.order - b.order),
    [tasks, selectedId],
  );

  const doneCount = projectTasks.filter((t) => t.done).length;
  const progress =
    projectTasks.length > 0
      ? Math.round((doneCount / projectTasks.length) * 100)
      : 0;

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim() || !selectedId) return;
    addTask({
      projectId: selectedId,
      title: newTask.trim(),
      done: false,
      priority: "medium",
      order: projectTasks.length,
    });
    setNewTask("");
  }

  return (
    <div className="flex h-full flex-col bg-[#faf6ee] text-sm text-gray-900">
      <header className="border-b border-amber-800/20 bg-gradient-to-r from-amber-800 to-amber-600 px-4 py-2 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-wide">DYNASTY 8</h2>
            <p className="text-xs text-amber-200">Project Management</p>
          </div>
          {selected && (
            <div className="text-right">
              <p className="text-xs text-amber-200">{selected.name}</p>
              <p className="text-lg font-bold">{progress}% complete</p>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-48 shrink-0 overflow-y-auto border-r border-gray-300 bg-white">
          <p className="border-b border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Projects
          </p>
          {projects.map((p) => {
            const pTasks = tasks.filter((t) => t.projectId === p.id);
            const done = pTasks.filter((t) => t.done).length;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full border-b border-gray-100 px-3 py-2 text-left transition-colors hover:bg-amber-50 ${
                  selectedId === p.id ? "bg-amber-100" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="truncate text-xs font-medium">{p.name}</span>
                </div>
                <div className="mt-1 flex items-center justify-between pl-4">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${STATUS_COLORS[p.status]}`}
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {done}/{pTasks.length}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden p-3">
          {selected ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-gray-600">{selected.description}</p>
                <select
                  value={selected.status}
                  onChange={(e) =>
                    updateProjectStatus(
                      selected.id,
                      e.target.value as ProjectStatus,
                    )
                  }
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
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
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex-1 overflow-y-auto rounded border border-gray-200 bg-white">
                {projectTasks.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTask(t.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span
                      className={`flex-1 text-xs ${
                        t.done ? "text-gray-400 line-through" : ""
                      }`}
                    >
                      {t.title}
                    </span>
                    {t.dueDate && (
                      <span className="text-[10px] text-gray-400">
                        {t.dueDate}
                      </span>
                    )}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        t.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : t.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </label>
                ))}
              </div>

              <form onSubmit={handleAddTask} className="mt-2 flex gap-2">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a task..."
                  className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800"
                >
                  Add Task
                </button>
              </form>
            </>
          ) : (
            <p className="text-xs text-gray-400">Select a project</p>
          )}
        </main>
      </div>
    </div>
  );
}
