"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Trash2, Clock, DollarSign, X } from "lucide-react";

interface Project {
  id: number;
  name: string;
  description: string | null;
  total_monthly: number;
  created_at: string;
  updated_at: string;
}

const fmtUSD = (n: number) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName]           = useState("");
  const [desc, setDesc]           = useState("");
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => { setProjects(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (showModal) setTimeout(() => inputRef.current?.focus(), 50);
  }, [showModal]);

  const createProject = async () => {
    if (!name.trim()) { setError("Project name is required"); return; }
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: desc.trim() }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setError(data.error ?? "Failed to create"); return; }
    router.push(`/projects/${data.id}`);
  };

  const deleteProject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((p) => p.filter((pr) => pr.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900 px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Workspace</p>
          <h1 className="text-xl font-bold text-zinc-100 mt-0.5">AI Cost Estimator</h1>
        </div>
        <button
          onClick={() => { setShowModal(true); setName(""); setDesc(""); setError(""); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <Plus size={15} /> New Project
        </button>
      </header>

      {/* Body */}
      <main className="px-8 py-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-zinc-500 text-sm">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <FolderOpen size={40} className="text-zinc-700 mb-4" strokeWidth={1.5} />
            <p className="text-zinc-400 text-base font-medium">No projects yet</p>
            <p className="text-zinc-600 text-sm mt-1 mb-6">Create a project to start estimating costs.</p>
            <button
              onClick={() => { setShowModal(true); setName(""); setDesc(""); setError(""); }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              <Plus size={15} /> New Project
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-500 mb-5 uppercase tracking-wider font-semibold">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="group relative cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-indigo-700 hover:bg-zinc-800/60 transition-all"
                >
                  <button
                    onClick={(e) => deleteProject(project.id, e)}
                    className="absolute top-3 right-3 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-indigo-600/20 p-2">
                      <FolderOpen size={16} className="text-indigo-400" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-zinc-100 truncate">{project.name}</h2>
                      {project.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <DollarSign size={11} />
                      <span className="font-mono text-zinc-300">{fmtUSD(project.total_monthly)}/mo</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {fmtDate(project.updated_at)}
                    </span>
                  </div>
                </div>
              ))}

              {/* New project card */}
              <button
                onClick={() => { setShowModal(true); setName(""); setDesc(""); setError(""); }}
                className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-5 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-all min-h-[120px]"
              >
                <Plus size={20} strokeWidth={1.5} />
                <span className="text-xs">New Project</span>
              </button>
            </div>
          </>
        )}
      </main>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-zinc-100">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Project Name</label>
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && createProject()}
                  placeholder="e.g. AI Recruitment Platform"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description <span className="text-zinc-600">(optional)</span></label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Brief description of what you're building…"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={creating}
                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white transition-colors"
              >
                {creating ? "Creating…" : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
