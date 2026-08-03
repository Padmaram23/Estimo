"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  FolderOpen, Plus, Trash2, Clock, DollarSign, X,
  ChevronRight, ChevronDown, Check, LayoutTemplate, Search, Bot,
  MessageCircle, Shuffle, FileText, Zap, Image as ImageIcon,
  Layers, FileSearch, LogOut, Lock, LayoutDashboard, Cpu, BarChart3,
} from "lucide-react";
import NeuralBackground from "./components/NeuralBackground";

interface Project {
  id: number; name: string; description: string | null;
  total_monthly: number; created_at: string; updated_at: string;
}
interface TemplateSelection {
  toolId: number; toolName: string; categoryName: string;
  planId: number; planName: string; price: number;
  isSelfHosted: boolean; provider?: string; instanceType?: string;
  isTokenBased?: boolean; inputTokensM?: number; outputTokensM?: number;
  priceInputPer1m?: number; priceOutputPer1m?: number;
}
interface Template {
  id: number; name: string; description: string; icon: string;
  category: string; total_monthly: number;
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

type ModalStep = "template" | "details" | "signin-prompt";

export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsPageInner />
    </Suspense>
  );
}

function ProjectsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  const [projects, setProjects]   = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading]     = useState(true);

  const [show, setShow]                         = useState(false);
  const [step, setStep]                         = useState<ModalStep>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [name, setName]                         = useState("");
  const [desc, setDesc]                         = useState("");
  const [creating, setCreating]                 = useState(false);
  const [error, setError]                       = useState("");
  const [deleteConfirmId, setDeleteConfirmId]   = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = howItWorksRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHowItWorksVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [howItWorksVisible]);

  useEffect(() => {
    fetch("/api/templates").then((r) => r.json()).then((tpls) => {
      setTemplates(Array.isArray(tpls) ? tpls : []);
    }).catch(() => {});

    if (isAuthed) {
      fetch("/api/projects").then((r) => r.json()).then((projs) => {
        setProjects(Array.isArray(projs) ? projs : []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isAuthed]);

  // Set loading false once session status is resolved and we're not authed
  useEffect(() => {
    if (status === "unauthenticated") setLoading(false);
  }, [status]);

  useEffect(() => {
    if (show && step === "details") setTimeout(() => inputRef.current?.focus(), 50);
  }, [show, step]);

  // Restore template after Google sign-in redirect
  useEffect(() => {
    if (status !== "authenticated") return;
    if (searchParams.get("restore") !== "1") return;
    try {
      const raw = sessionStorage.getItem("pending_template");
      if (raw) {
        const tpl = JSON.parse(raw) as Template;
        sessionStorage.removeItem("pending_template");
        setSelectedTemplate(tpl);
        setName(tpl.name);
        setDesc("");
        setError("");
        setShow(true);
        setStep("details");
      }
    } catch { /* ignore */ }
  }, [status, searchParams]);

  const openCreate = () => {
    setShow(true); setStep("template"); setSelectedTemplate(null);
    setName(""); setDesc(""); setError("");
  };

  const proceedToDetails = (tpl: Template | null) => {
    // Guest + blank project: skip everything, go straight to the tool explorer
    if (!isAuthed && tpl === null) {
      setShow(false);
      router.push("/projects/guest");
      return;
    }
    // Templates require sign-in
    if (tpl && !isAuthed) {
      setSelectedTemplate(tpl);
      setStep("signin-prompt");
      return;
    }
    // Authenticated + blank project: show name/description form
    if (isAuthed && tpl === null) {
      setSelectedTemplate(null);
      setName("");
      setStep("details");
      setError("");
      return;
    }
    setSelectedTemplate(tpl);
    if (tpl) setName(tpl.name);
    setStep("details");
    setError("");
  };

  const createProject = async () => {
    if (!isAuthed) { setStep("signin-prompt"); return; }
    if (!name.trim()) { setError("Project name is required"); return; }
    setCreating(true);
    const seen = new Set<number>();
    const hydratedSelections = selectedTemplate?.selections.reduce<typeof selectedTemplate.selections>((acc, s) => {
      if (seen.has(s.toolId)) return acc;
      seen.add(s.toolId);
      const price = s.isTokenBased
        ? (s.inputTokensM ?? 0) * (s.priceInputPer1m ?? 0) + (s.outputTokensM ?? 0) * (s.priceOutputPer1m ?? 0)
        : s.price;
      acc.push({ ...s, price });
      return acc;
    }, []) ?? null;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: desc.trim() || null, selections: hydratedSelections, diagram: selectedTemplate?.diagram ?? null }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setError(data.error ?? "Failed to create"); return; }
    router.push(`/projects/${data.id}`);
  };

  const deleteProject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDeleteProject = async () => {
    if (deleteConfirmId === null) return;
    await fetch(`/api/projects/${deleteConfirmId}`, { method: "DELETE" });
    setProjects((p) => p.filter((pr) => pr.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  // ── LANDING (unauthenticated) ──────────────────────────────
  if (!isAuthed && status !== "loading") {
    return (
      <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
        <NeuralBackground />

        {/* Hero */}
        <section className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI stack cost estimator
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-100 leading-tight max-w-3xl mb-5">
            Know your AI costs<br />
            <span className="text-indigo-400">before you build</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mb-10 leading-relaxed">
            Estimate the monthly cost of any AI architecture — LLMs, vector databases, gateways, embeddings, and more. Build visually, compare plans, share estimates.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Big primary CTA */}
            <button
              onClick={openCreate}
              className="flex items-center gap-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-900/40 transition-all hover:scale-105"
            >
              <Zap size={18} />
              Try it out — no sign in needed
            </button>
            {/* Smaller secondary CTA */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 px-6 py-4 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.705A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.037l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.584c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.963L3.964 7.295C4.672 5.163 6.656 3.584 9 3.584z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-4">Free to try · No credit card required</p>
        </section>

        {/* Scroll cue */}
        <div className="relative z-10 flex flex-col items-center gap-1 pb-8 -mt-4">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">How it works</span>
          <button
            className="text-zinc-600 animate-bounce"
            onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: "smooth" })}
            aria-label="Scroll to how it works"
          >
            <ChevronDown size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* How it works */}
      <section
        ref={howItWorksRef}
        className="relative z-10 border-t border-zinc-800/60 bg-zinc-950/90 px-8 py-16 transition-all duration-700"
        style={{ opacity: howItWorksVisible ? 1 : 0, transform: howItWorksVisible ? "translateY(0)" : "translateY(32px)" }}
      >
          <div className="max-w-4xl mx-auto">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 text-center mb-2">How it works</p>
            <h2 className="text-xl font-bold text-zinc-100 text-center mb-10">Estimate your AI stack cost in minutes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
                <div className="rounded-lg bg-indigo-600/20 p-3"><LayoutDashboard size={20} className="text-indigo-400" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Step 1</p>
                  <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Pick a template or start blank</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">Choose from pre-built architectures — RAG pipeline, AI agent, document assistant — or build your stack from scratch.</p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
                <div className="rounded-lg bg-indigo-600/20 p-3"><Cpu size={20} className="text-indigo-400" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Step 2</p>
                  <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Configure tools & plans</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">Select LLMs, vector databases, gateways, and observability tools. Swap plans or switch to self-hosted instances to compare costs.</p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
                <div className="rounded-lg bg-indigo-600/20 p-3"><BarChart3 size={20} className="text-indigo-400" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Step 3</p>
                  <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Get your monthly estimate</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">See a live cost breakdown across all tools. Visualise connections in the diagram and share your estimate with your team.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Template picker modal (guest mode — only blank allowed) */}
        {show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full mx-auto"
              style={{ maxWidth: step === "template" ? 680 : step === "signin-prompt" ? 420 : 480 }}>

              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  {(step === "details" || step === "signin-prompt") && (
                    <button onClick={() => setStep("template")} className="text-zinc-500 hover:text-zinc-300">
                      <ChevronRight size={16} className="rotate-180" />
                    </button>
                  )}
                  <h2 className="text-sm font-bold text-zinc-100">
                    {step === "template" ? "Choose a starting point" : step === "signin-prompt" ? "Sign in required" : "Project details"}
                  </h2>
                </div>
                <button onClick={() => setShow(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X size={18} />
                </button>
              </div>

              {/* Template picker */}
              {step === "template" && (
                <div className="p-6">
                  <button onClick={() => proceedToDetails(null)}
                    className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 mb-4 hover:border-indigo-600 hover:bg-indigo-600/10 transition-all group">
                    <div className="rounded-lg bg-zinc-700 p-2 text-zinc-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                      <Zap size={16} strokeWidth={1.75} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-zinc-200">Blank project</div>
                      <div className="text-xs text-zinc-500">Start from scratch — no sign in needed</div>
                    </div>
                    <ChevronRight size={14} className="ml-auto text-zinc-600 group-hover:text-indigo-400" />
                  </button>

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                    Templates <span className="text-zinc-600 normal-case font-normal ml-1">— sign in to use</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates.map((tpl) => (
                      <button key={tpl.id} onClick={() => proceedToDetails(tpl)}
                        className="relative flex items-start gap-3 rounded-xl border border-zinc-700/60 bg-zinc-800/30 p-4 text-left hover:border-indigo-600/60 hover:bg-indigo-600/5 transition-all group opacity-80 hover:opacity-100">
                        <div className="absolute top-2.5 right-2.5">
                          <Lock size={11} className="text-zinc-600 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div className="rounded-lg bg-indigo-600/20 p-2 text-indigo-400 shrink-0 mt-0.5">
                          {ICON_MAP[tpl.icon] ?? <LayoutTemplate size={18} strokeWidth={1.75} />}
                        </div>
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-200 truncate">{tpl.name}</span>
                            <span className="text-[10px] font-mono text-indigo-300 shrink-0">{fmtUSD(tpl.total_monthly)}/mo</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {tpl.selections.slice(0, 3).map((s) => (
                              <span key={s.toolId} className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-700 text-zinc-400">{s.toolName}</span>
                            ))}
                            {tpl.selections.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-700 text-zinc-500">+{tpl.selections.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign-in prompt when template selected */}
              {step === "signin-prompt" && (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center mx-auto mb-4">
                    <Lock size={20} className="text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 mb-2">Sign in to use templates</h3>
                  <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                    Templates let you start with a pre-built architecture and save your project. Sign in with Google — it&apos;s free.
                  </p>
                  <button
                    onClick={() => {
                      if (selectedTemplate) {
                        sessionStorage.setItem("pending_template", JSON.stringify(selectedTemplate));
                      }
                      signIn("google", { callbackUrl: "/?restore=1" });
                    }}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors mb-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.705A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.037l3.007-2.332z"/>
                      <path fill="#EA4335" d="M9 3.584c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.963L3.964 7.295C4.672 5.163 6.656 3.584 9 3.584z"/>
                    </svg>
                    Continue with Google
                  </button>
                  <button onClick={() => proceedToDetails(null)} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                    Or continue with a blank project instead
                  </button>
                </div>
              )}

              {/* Details step */}
              {step === "details" && (
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Project Name</label>
                      <input ref={inputRef} value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && createProject()}
                        placeholder="e.g. AI Recruitment Platform"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500"
                      />
                      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Description <span className="text-zinc-600">(optional)</span>
                      </label>
                      <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
                        placeholder="Brief description…" rows={3}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                  {!isAuthed && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
                      <Lock size={12} className="text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-300">
                        This project won&apos;t be saved. <button onClick={() => signIn("google")} className="underline hover:text-amber-200">Sign in</button> to save your work.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setShow(false)} className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                      Cancel
                    </button>
                    <button onClick={createProject} disabled={creating}
                      className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white transition-colors">
                      {creating ? "Creating…" : isAuthed ? "Create Project" : "Try it out"}
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

  // ── DASHBOARD (authenticated) ─────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <NeuralBackground />
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm px-8 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-zinc-100 tracking-tight">Estimo</span>
        <div className="flex items-center gap-3">
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors">
            <Plus size={14} /> New Project
          </button>
          {session?.user && <ProfileMenu session={session} />}
        </div>
      </header>

      <section className="relative z-10 px-8 py-8 max-w-5xl mx-auto min-h-[calc(100vh-64px)]">
        {loading ? (
          <div className="text-zinc-500 text-sm">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <FolderOpen size={40} className="text-zinc-700 mb-4" strokeWidth={1.5} />
            <p className="text-zinc-400 text-base font-medium">No projects yet</p>
            <p className="text-zinc-600 text-sm mt-1 mb-6">Create your first project to start estimating costs.</p>
            <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors">
              <Plus size={15} /> New Project
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-500 mb-5 uppercase tracking-wider font-semibold">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} onClick={() => router.push(`/projects/${project.id}`)}
                  className="group relative cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-indigo-700 hover:bg-zinc-800/60 transition-all">
                  <button onClick={(e) => deleteProject(project.id, e)}
                    className="absolute top-3 right-3 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-indigo-600/20 p-2">
                      <FolderOpen size={16} className="text-indigo-400" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-zinc-100 truncate">{project.name}</h2>
                      {project.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{project.description}</p>}
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
        {/* Scroll cue — fixed to bottom of viewport, fades when scrolled */}
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 transition-opacity duration-500 z-10"
          style={{ opacity: scrolled ? 0 : 1, pointerEvents: scrolled ? "none" : "auto" }}
        >
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">How it works</span>
          <button
            className="text-zinc-600 animate-bounce"
            onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: "smooth" })}
            aria-label="Scroll to how it works"
          >
            <ChevronDown size={20} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      {/* How it works */}
      <section
        ref={howItWorksRef}
        className="relative z-10 border-t border-zinc-800/60 bg-zinc-950/90 px-8 py-16 transition-all duration-700"
        style={{ opacity: howItWorksVisible ? 1 : 0, transform: howItWorksVisible ? "translateY(0)" : "translateY(32px)" }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 text-center mb-2">How it works</p>
          <h2 className="text-xl font-bold text-zinc-100 text-center mb-10">Estimate your AI stack cost in minutes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="rounded-lg bg-indigo-600/20 p-3"><LayoutDashboard size={20} className="text-indigo-400" strokeWidth={1.5} /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Step 1</p>
                <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Pick a template or start blank</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Choose from pre-built architectures — RAG pipeline, AI agent, document assistant — or build your stack from scratch.</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="rounded-lg bg-indigo-600/20 p-3"><Cpu size={20} className="text-indigo-400" strokeWidth={1.5} /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Step 2</p>
                <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Configure tools & plans</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Select LLMs, vector databases, gateways, and observability tools. Swap plans or switch to self-hosted instances to compare costs.</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="rounded-lg bg-indigo-600/20 p-3"><BarChart3 size={20} className="text-indigo-400" strokeWidth={1.5} /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">Step 3</p>
                <h3 className="text-sm font-bold text-zinc-100 mb-1.5">Get your monthly estimate</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">See a live cost breakdown across all tools. Visualise connections in the diagram and share your estimate with your team.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delete project confirmation portal */}
      {deleteConfirmId !== null && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-sm font-bold text-red-400">Delete project?</h2>
              <button onClick={() => setDeleteConfirmId(null)} className="text-zinc-500 hover:text-zinc-300"><X size={15} /></button>
            </div>
            <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
              {projects.find(p => p.id === deleteConfirmId)?.name && (
                <><span className="text-zinc-200 font-medium">&ldquo;{projects.find(p => p.id === deleteConfirmId)!.name}&rdquo;</span> will be permanently deleted.</>
              )}
            </p>
            <p className="text-xs text-red-400/70 mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
              <button onClick={confirmDeleteProject} className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal (authenticated — all templates unlocked) */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full mx-auto"
            style={{ maxWidth: step === "template" ? 680 : 480 }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                {step === "details" && (
                  <button onClick={() => setStep("template")} className="text-zinc-500 hover:text-zinc-300">
                    <ChevronRight size={16} className="rotate-180" />
                  </button>
                )}
                <h2 className="text-sm font-bold text-zinc-100">
                  {step === "template" ? "Choose a starting point" : "Project details"}
                </h2>
              </div>
              <button onClick={() => setShow(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>

            {step === "template" && (
              <div className="p-6">
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
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Templates</p>
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
                          <span className="text-[10px] font-mono text-indigo-300 shrink-0">{fmtUSD(tpl.total_monthly)}/mo</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {tpl.selections.slice(0, 3).map((s) => (
                            <span key={s.toolId} className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-700 text-zinc-400">{s.toolName}</span>
                          ))}
                          {tpl.selections.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-700 text-zinc-500">+{tpl.selections.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500"
                    />
                    {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description <span className="text-zinc-600">(optional)</span></label>
                    <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
                      placeholder="Brief description…" rows={3}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShow(false)} className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
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

/* ── ProfileMenu ─────────────────────────────────────────────── */
function ProfileMenu({ session }: { session: NonNullable<ReturnType<typeof useSession>["data"]> }) {
  const [open, setOpen]               = useState(false);
  const [confirm, setConfirm]         = useState<"signout" | "delete" | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = () => { setOpen(false); setConfirm("signout"); };
  const handleDeleteAccount = () => { setOpen(false); setDeleteInput(""); setConfirm("delete"); };

  const confirmSignOut = () => signOut({ callbackUrl: "/" });

  const confirmDelete = async () => {
    setDeleting(true);
    await fetch("/api/account", { method: "DELETE" });
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 rounded-lg hover:bg-zinc-800 px-2 py-1.5 transition-colors"
        >
          {session.user?.image
            ? <img src={session.user.image} alt="" className="w-7 h-7 rounded-full border border-zinc-700" referrerPolicy="no-referrer" />
            : <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold">{(session.user?.name ?? "U")[0]}</div>
          }
          <ChevronDown size={13} className={`text-zinc-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-52 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl z-50 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-xs font-semibold text-zinc-200 truncate">{session.user?.name ?? "User"}</p>
              <p className="text-[10px] text-zinc-500 truncate">{session.user?.email ?? ""}</p>
            </div>
            {/* Actions */}
            <div className="py-1">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <LogOut size={14} className="text-zinc-500" /> Sign out
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
              >
                <Trash2 size={14} className="text-red-500" /> Delete account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm sign out */}
      {confirm === "signout" && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-sm font-bold text-zinc-100">Sign out?</h2>
              <button onClick={() => setConfirm(null)} className="text-zinc-500 hover:text-zinc-300"><X size={15} /></button>
            </div>
            <p className="text-xs text-zinc-500 mb-6">You can sign back in any time with Google.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
              <button onClick={confirmSignOut} className="flex-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 px-4 py-2.5 text-sm font-medium text-white transition-colors">Sign out</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm delete account */}
      {confirm === "delete" && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-sm font-bold text-red-400">Delete account?</h2>
              <button onClick={() => setConfirm(null)} className="text-zinc-500 hover:text-zinc-300"><X size={15} /></button>
            </div>
            <p className="text-xs text-zinc-400 mb-2 leading-relaxed">This will permanently delete your account and sign you out. Your projects will remain but will no longer be linked to any account.</p>
            <p className="text-xs text-red-400/70 mb-5">This cannot be undone.</p>
            <div className="mb-5">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Type <span className="font-mono text-red-400">delete</span> to confirm
              </label>
              <input
                autoFocus
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && deleteInput === "delete" && confirmDelete()}
                placeholder="delete"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-red-500 font-mono"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
              <button
                onClick={confirmDelete}
                disabled={deleting || deleteInput !== "delete"}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
