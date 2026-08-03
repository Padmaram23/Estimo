"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen, Plus, Trash2, Clock, DollarSign, X,
  ChevronRight, Check, LayoutTemplate, Search, Bot,
  MessageCircle, Shuffle, FileText, Zap, Image as ImageIcon,
  Layers, FileSearch, ChevronDown, LayoutDashboard, Cpu, BarChart3,
} from "lucide-react";
import NeuralBackground from "./components/NeuralBackground";

interface Project {
  id: number;
  name: string;
  description: string | null;
  total_monthly: number;
  created_at: string;
  updated_at: string;
}

interface TemplateSelection {
  toolId: number; toolName: string; categoryName: string;
  planId: number; planName: string; price: number;
  isSelfHosted: boolean; provider?: string; instanceType?: string;
  isTokenBased?: boolean; inputTokensM?: number; outputTokensM?: number;
  priceInputPer1m?: number; priceOutputPer1m?: number;
}

interface Template {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  total_monthly: number;
  selections: TemplateSelection[];
  diagram?: { nodes: object[]; edges: object[] };
}

const fmtUSD = (n: number) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const ICON_MAP: Record<string, React.ReactNode> = {
  search:           <Search size={18} strokeWidth={1.75} />,
  bot:              <Bot size={18} strokeWidth={1.75} />,
  "message-circle": <MessageCircle size={18} strokeWidth={1.75} />,
  shuffle:          <Shuffle size={18} strokeWidth={1.75} />,
  "file-text":      <FileText size={18} strokeWidth={1.75} />,
  image:            <ImageIcon size={18} strokeWidth={1.75} />,
  layers:           <Layers size={18} strokeWidth={1.75} />,
  "file-search":    <FileSearch size={18} strokeWidth={1.75} />,
  layout:           <LayoutTemplate size={18} strokeWidth={1.75} />,
};

type ModalStep = "template" | "details";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects]     = useState<Project[]>([]);
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [loading, setLoading]       = useState(true);

  const [show, setShow]                         = useState(false);
  const [step, setStep]                         = useState<ModalStep>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [name, setName]                         = useState("");
  const [desc, setDesc]                         = useState("");
  const [creating, setCreating]                 = useState(false);
  const [error, setError]                       = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ]).then(([projs, tpls]) => {
      setProjects(Array.isArray(projs) ? projs : []);
      setTemplates(Array.isArray(tpls) ? tpls : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (show && step === "details") setTimeout(() => inputRef.current?.focus(), 50);
  }, [show, step]);

  const openCreate = () => {
    setShow(true); setStep("template"); setSelectedTemplate(null);
    setName(""); setDesc(""); setError("");
  };

  const proceedToDetails = (tpl: Template | null) => {
    setSelectedTemplate(tpl);
    if (tpl) setName(tpl.name);
    setStep("details");
    setError("");
  };

  const createProject = async () => {
    if (!name.trim()) { setError("Project name is required"); return; }
    setCreating(true);

    // Compute price for token-based selections so they show correctly on load
    // Deduplicate by toolId — same tool can appear in multiple categories in seed data
    const seen = new Set<number>();
    const hydratedSelections = selectedTemplate?.selections.reduce<typeof selectedTemplate.selections>((acc, s) => {
      if (seen.has(s.toolId)) return acc;
      seen.add(s.toolId);
      if (s.isTokenBased) {
        const price =
          (s.inputTokensM ?? 0) * (s.priceInputPer1m ?? 0) +
          (s.outputTokensM ?? 0) * (s.priceOutputPer1m ?? 0);
        acc.push({ ...s, price });
      } else {
        acc.push(s);
      }
      return acc;
    }, []) ?? null;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: desc.trim() || null,
        selections: hydratedSelections,
        diagram: selectedTemplate?.diagram ?? null,
      }),
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
    <div className="bg-zinc-950 text-zinc-100 font-sans">
      <NeuralBackground />
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Workspace</p>
          <h1 className="text-xl font-bold text-zinc-100 mt-0.5">Estimo</h1>
        </div>

        {/* Center slogan */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center hidden sm:block">
          <p className="text-sm font-medium text-zinc-300 tracking-wide">
            Know your AI costs <span className="text-indigo-400">before</span> you build.
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5 tracking-wider">Plan smarter. Ship faster.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors">
          <Plus size={15} /> New Project
        </button>
      </header>

      {/* Projects — full viewport height section */}
      <section className="relative z-10 min-h-[calc(100vh-64px)] px-8 py-8 max-w-5xl mx-auto flex flex-col">
        <main className="flex-1">
        {loading ? (
          <div className="text-zinc-500 text-sm">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <FolderOpen size={40} className="text-zinc-700 mb-4" strokeWidth={1.5} />
            <p className="text-zinc-400 text-base font-medium">No projects yet</p>
            <p className="text-zinc-600 text-sm mt-1 mb-6">Create a project to start estimating costs.</p>
            <button onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors">
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
                <div key={project.id} onClick={() => router.push(`/projects/${project.id}`)}
                  className="group relative cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-indigo-700 hover:bg-zinc-800/60 transition-all">
                  <button onClick={(e) => deleteProject(project.id, e)}
                    className="absolute top-3 right-3 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Delete">
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
              <button onClick={openCreate}
                className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-5 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-all min-h-[120px]">
                <Plus size={20} strokeWidth={1.5} />
                <span className="text-xs">New Project</span>
              </button>
            </div>
          </>
        )}
        </main>

        {/* Scroll cue — fades out once user scrolls */}
        <div
          className="flex flex-col items-center gap-1 pb-6 transition-opacity duration-500"
          style={{ opacity: scrolled ? 0 : 1 }}
        >
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">How it works</span>
          <button
            onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="text-zinc-600 hover:text-zinc-400 transition-colors animate-bounce"
            aria-label="Scroll to how it works"
          >
            <ChevronDown size={20} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      {/* How it works */}
      <section
        ref={howItWorksRef}
        className="relative z-10 border-t border-zinc-800/60 bg-zinc-950/90 backdrop-blur-sm px-8 py-20"
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 text-center mb-2">How it works</p>
          <h2 className="text-2xl font-bold text-zinc-100 text-center mb-12">
            Estimate your AI stack cost in minutes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="rounded-lg bg-indigo-600/20 p-3">
                <LayoutDashboard size={20} className="text-indigo-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Step 1</p>
                <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Pick a template or start blank</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Choose from pre-built architectures — RAG pipeline, AI agent, document assistant, multi-model gateway — or build your stack from scratch.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="rounded-lg bg-indigo-600/20 p-3">
                <Cpu size={20} className="text-indigo-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Step 2</p>
                <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Configure tools & plans</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Select LLMs, vector databases, gateways, and observability tools. Swap models, adjust token volumes, or switch to self-hosted instances to compare costs.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="rounded-lg bg-indigo-600/20 p-3">
                <BarChart3 size={20} className="text-indigo-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Step 3</p>
                <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Get your monthly estimate</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  See a live cost breakdown across all tools in your architecture. Visualise connections in the diagram and export your estimate for planning or budgeting.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition-colors">
              <Plus size={15} /> Start a new project
            </button>
          </div>
        </div>
      </section>

      {/* Modal */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full mx-auto"
            style={{ maxWidth: step === "template" ? 680 : 480 }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                {step === "details" && (
                  <button onClick={() => setStep("template")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <ChevronRight size={16} className="rotate-180" />
                  </button>
                )}
                <h2 className="text-sm font-bold text-zinc-100">
                  {step === "template" ? "Choose a starting point" : "Project details"}
                </h2>
              </div>
              <button onClick={() => setShow(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={18} />
              </button>
            </div>

            {/* Step 1: Template picker */}
            {step === "template" && (
              <div className="p-6">
                {/* Blank option */}
                <button onClick={() => proceedToDetails(null)}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 mb-4 hover:border-indigo-600 hover:bg-indigo-600/10 transition-all group">
                  <div className="rounded-lg bg-zinc-700 p-2 text-zinc-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                    <Zap size={16} strokeWidth={1.75} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-zinc-200">Blank project</div>
                    <div className="text-xs text-zinc-500">Start from scratch and add your own tools</div>
                  </div>
                  <ChevronRight size={14} className="ml-auto text-zinc-600 group-hover:text-indigo-400" />
                </button>

                {/* Template grid */}
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Templates
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((tpl) => (
                    <button key={tpl.id} onClick={() => proceedToDetails(tpl)}
                      className="flex items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-800/40 p-4 text-left hover:border-indigo-600 hover:bg-indigo-600/10 transition-all group">
                      <div className="rounded-lg bg-indigo-600/20 p-2 text-indigo-400 shrink-0 mt-0.5">
                        {ICON_MAP[tpl.icon] ?? <LayoutTemplate size={18} strokeWidth={1.75} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-zinc-200 truncate">{tpl.name}</span>
                          <span className="text-[10px] font-mono text-indigo-300 shrink-0">
                            {fmtUSD(tpl.total_monthly)}/mo
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{tpl.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tpl.selections.slice(0, 3).map((s) => (
                            <span key={s.toolId}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-700 text-zinc-400">
                              {s.toolName}
                            </span>
                          ))}
                          {tpl.selections.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-700 text-zinc-500">
                              +{tpl.selections.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Project details */}
            {step === "details" && (
              <div className="p-6">
                {selectedTemplate && (
                  <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-indigo-600/10 border border-indigo-600/30">
                    <Check size={13} className="text-indigo-400 shrink-0" />
                    <span className="text-xs text-indigo-300">
                      Using template: <span className="font-semibold">{selectedTemplate.name}</span>
                      <span className="text-indigo-400/60 ml-1">·</span>
                      <span className="font-mono ml-1">{fmtUSD(selectedTemplate.total_monthly)}/mo</span>
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Project Name</label>
                    <input ref={inputRef} value={name}
                      onChange={(e) => { setName(e.target.value); setError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && createProject()}
                      placeholder="e.g. AI Recruitment Platform"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Description <span className="text-zinc-600">(optional)</span>
                    </label>
                    <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
                      placeholder="Brief description…" rows={3}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShow(false)}
                    className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                    Cancel
                  </button>
                  <button onClick={createProject} disabled={creating}
                    className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white transition-colors">
                    {creating ? "Creating…" : "Create Project"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
