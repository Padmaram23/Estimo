"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight, ChevronDown, Receipt, Tag, Trash2, Check,
  Server, Cloud, ArrowLeft, Save, CheckCircle, Pencil, Share2, Copy, X, Activity,
} from "lucide-react";
import ArchDiagram, { type ArchDiagramHandle } from "@/app/components/ArchDiagram";
import type { Edge } from "@xyflow/react";

/* ─── types ─────────────────────────────────────────────────── */
interface Plan {
  id: number; name: string; description: string;
  price: number; billing_cycle: string; features: string[]; is_popular: boolean;
  is_token_based: boolean;
  price_input_per_1m: number | null;
  price_output_per_1m: number | null;
}
interface SelfHostInstance {
  instance_id: number; provider: string; provider_label: string;
  instance_type: string; vcpu: number; memory_gb: number;
  price_hourly: number; price_monthly: number; region: string;
  notes: string; is_recommended: boolean;
}
interface Tool {
  id: number; name: string; description: string;
  plans: Plan[]; self_hosting: SelfHostInstance[];
}
interface Category { id: number; name: string; tools: Tool[] }
interface SelectedItem {
  toolId: number; toolName: string; categoryName: string;
  planId: number; planName: string; price: number;
  isSelfHosted: boolean; provider?: string; instanceType?: string;
  // token-based extras
  isTokenBased?: boolean;
  inputTokensM?: number;   // millions per month
  outputTokensM?: number;
  priceInputPer1m?: number;
  priceOutputPer1m?: number;
}

/* token price calculator */
function calcTokenPrice(inputM: number, outputM: number, inRate: number, outRate: number) {
  return inputM * inRate + outputM * outRate;
}

/* ─── helpers ────────────────────────────────────────────────── */
const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const PROVIDER_COLORS: Record<string, string> = {
  aws: "#FF9900", azure: "#0078D4", gcp: "#4285F4",
};

function groupByProvider(instances: SelfHostInstance[]) {
  const map = new Map<string, { provider: string; providerLabel: string; instances: SelfHostInstance[] }>();
  for (const inst of instances) {
    if (!map.has(inst.provider))
      map.set(inst.provider, { provider: inst.provider, providerLabel: inst.provider_label, instances: [] });
    map.get(inst.provider)!.instances.push(inst);
  }
  return [...map.values()];
}

/* ─── page ───────────────────────────────────────────────────── */
export default function ProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">Loading…</div>}>
      <ProjectPageInner />
    </Suspense>
  );
}

function ProjectPageInner() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const searchParams = useSearchParams();

  const [project, setProject]           = useState<{ name: string; description: string } | null>(null);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());
  const [toolTab, setToolTab]           = useState<Record<number, "managed" | "selfhost">>({});
  const [toolProvider, setToolProvider] = useState<Record<number, string>>({});
  const [selected, setSelected]         = useState<SelectedItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [autoSave, setAutoSave]         = useState(true);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tokenModal, setTokenModal]     = useState<{
    tool: Tool; plan: Plan; categoryName: string;
    inputM: number; outputM: number;
  } | null>(null);
  const [planPopover, setPlanPopover]   = useState<{ toolId: number; catName: string } | null>(null);
  const [modalTab, setModalTab]         = useState<"managed" | "selfhost">("managed");
  const [modalProvider, setModalProvider] = useState<string>("");
  const [shareOpen, setShareOpen]       = useState(false);
  const [shareToken, setShareToken]     = useState<string | null>(null);
  const [shareEdit, setShareEdit]       = useState(false);
  const [shareCopied, setShareCopied]   = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [signInPrompt, setSignInPrompt] = useState<"save" | "share" | null>(null);
  void setSignInPrompt; // reserved for future use

  // ── Unit economics metric ────────────────────────────────
  const [unitLabel, setUnitLabel]       = useState("");
  const [baseVolume, setBaseVolume]     = useState<number | "">(0);
  const [targetVolume, setTargetVolume] = useState<number | "">("");

  // Predefined multiplier defaults are applied inline when project loads

  // Only restore edges (user-drawn connections) from DB — nodes are always rebuilt from `selected`
  const [initEdges, setInitEdges] = useState<Edge[] | undefined>(undefined);
  const [initDir,   setInitDir]   = useState<"LR" | "TB" | undefined>(undefined);
  const diagramRef = useRef<ArchDiagramHandle>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ]).then(([cats, proj, tpls]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      if (proj && !proj.error) {
        setProject({ name: proj.name, description: proj.description ?? "" });

        // Match multiplier defaults from templates DB first, then fall back to keyword match
        const projText = (proj.name + " " + (proj.description ?? "")).toLowerCase();
        const matchedTpl = Array.isArray(tpls)
          ? tpls.find((t: { name: string; multiplier_label?: string }) =>
              t.multiplier_label && projText.includes(t.name.toLowerCase())
            )
          : null;

        if (matchedTpl?.multiplier_label) {
          setUnitLabel(matchedTpl.multiplier_label);
          setBaseVolume(matchedTpl.multiplier_base_volume ?? 1000);
          setTargetVolume(matchedTpl.multiplier_target_volume ?? 5000);
        } else {
          // Keyword fallback
          for (const def of [
            { match: /resume/,            label: "resume",       base: 500,    target: 2000  },
            { match: /image|vision/,      label: "image",        base: 2000,   target: 10000 },
            { match: /document|doc|rag/,  label: "document",     base: 1000,   target: 5000  },
            { match: /chat|assistant/,    label: "conversation", base: 1000,   target: 5000  },
            { match: /agent/,             label: "task",         base: 500,    target: 2000  },
            { match: /search/,            label: "search query", base: 10000,  target: 50000 },
          ]) {
            if (def.match.test(projText)) {
              setUnitLabel(def.label);
              setBaseVolume(def.base);
              setTargetVolume(def.target);
              break;
            }
          }
        }
        if (proj.selections) {
          // Deduplicate by toolId in case of legacy data with duplicates
          const seen = new Set<number>();
          const deduped = (proj.selections as SelectedItem[]).filter((s) => {
            if (seen.has(s.toolId)) return false;
            seen.add(s.toolId);
            return true;
          });

          // Auto-resolve selections with no plan: pick popular managed plan or first self-host
          const catList: Category[] = Array.isArray(cats) ? cats : [];
          const resolved = deduped.map((s) => {
            if (s.planId !== null && s.planId !== undefined && s.planId !== 0) return s;
            // find tool in categories
            let tool: Tool | undefined;
            let catName = s.categoryName;
            for (const cat of catList) {
              const t = cat.tools.find((t) => t.id === s.toolId);
              if (t) { tool = t; catName = cat.name; break; }
            }
            if (!tool) return s;
            // Try popular managed plan first, then first managed plan
            const managed = tool.plans.find((p) => p.is_popular) ?? tool.plans[0];
            if (managed && !managed.is_token_based) {
              return { ...s, planId: managed.id, planName: managed.name, price: managed.price, isSelfHosted: false, categoryName: catName };
            }
            // Fall back to recommended self-host instance
            const instances = tool.self_hosting ?? [];
            const inst = instances.find((i) => i.is_recommended) ?? instances[0];
            if (inst) {
              return { ...s, planId: -inst.instance_id, planName: `${inst.provider_label} · ${inst.instance_type}`, price: inst.price_monthly, isSelfHosted: true, provider: inst.provider, instanceType: inst.instance_type, categoryName: catName };
            }
            return s;
          });

          setSelected(resolved);
        }
        // Only restore user-drawn edges — nodes are rebuilt from selections
        if (proj.diagram?.edges) setInitEdges(proj.diagram.edges);
        if (proj.diagram?.dir)   setInitDir(proj.diagram.dir);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // Auto-open share panel when navigating from guest save+share flow
  useEffect(() => {
    if (searchParams.get("share") === "1" && !loading) {
      setShareOpen(true);
    }
  }, [loading, searchParams]);

  const toggle = (set: Set<number>, itemId: number) => {
    const next = new Set(set);
    if (next.has(itemId)) { next.delete(itemId); } else { next.add(itemId); }
    return next;
  };

  const hasSelfHost = (tool: Tool) => (tool.self_hosting?.length ?? 0) > 0;
  const activeTab = (tool: Tool) =>
    toolTab[tool.id] ?? (tool.plans.length > 0 ? "managed" : "selfhost");
  const activeProv  = (toolId: number, providers: { provider: string }[]) =>
    toolProvider[toolId] ?? providers[0]?.provider ?? "";

  const upsertSelection = (item: SelectedItem) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.toolId === item.toolId);
      if (exists && exists.planId === item.planId && exists.instanceType === item.instanceType)
        return prev.filter((s) => s.toolId !== item.toolId);
      if (exists) return prev.map((s) => s.toolId === item.toolId ? item : s);
      return [...prev, item];
    });
  };

  const handlePlanClick = (tool: Tool, plan: Plan, categoryName: string) => {
    if (plan.is_token_based) {
      const existing = selected.find((s) => s.toolId === tool.id && s.planId === plan.id);
      setTokenModal({
        tool, plan, categoryName,
        inputM:  existing?.inputTokensM  ?? 1,
        outputM: existing?.outputTokensM ?? 0.5,
      });
    } else {
      upsertSelection({
        toolId: tool.id, toolName: tool.name, categoryName,
        planId: plan.id, planName: plan.name, price: plan.price,
        isSelfHosted: false,
      });
    }
  };

  const confirmTokenModal = () => {
    if (!tokenModal) return;
    const { tool, plan, categoryName, inputM, outputM } = tokenModal;
    const inRate  = plan.price_input_per_1m  ?? 0;
    const outRate = plan.price_output_per_1m ?? 0;
    const price   = calcTokenPrice(inputM, outputM, inRate, outRate);
    const item: SelectedItem = {
      toolId: tool.id, toolName: tool.name, categoryName,
      planId: plan.id, planName: plan.name, price,
      isSelfHosted: false, isTokenBased: true,
      inputTokensM: inputM, outputTokensM: outputM,
      priceInputPer1m: inRate, priceOutputPer1m: outRate,
    };
    // Always replace or add — never toggle off
    setSelected((prev) => {
      const exists = prev.find((s) => s.toolId === item.toolId);
      if (exists) return prev.map((s) => s.toolId === item.toolId ? item : s);
      return [...prev, item];
    });
    setTokenModal(null);
  };

  const editTokenSelection = (sel: SelectedItem) => {
    // Find the plan from loaded categories
    let foundTool: Tool | undefined;
    let foundPlan: Plan | undefined;
    let foundCatName = sel.categoryName;
    for (const cat of categories) {
      for (const tool of cat.tools) {
        const plan = tool.plans.find((p) => p.id === sel.planId);
        if (plan) { foundTool = tool; foundPlan = plan; foundCatName = cat.name; break; }
      }
      if (foundPlan) break;
    }
    if (!foundTool || !foundPlan) return;
    setTokenModal({
      tool: foundTool, plan: foundPlan, categoryName: foundCatName,
      inputM:  sel.inputTokensM  ?? 1,
      outputM: sel.outputTokensM ?? 0.5,
    });
  };

  const isSelected = (toolId: number, planId: number, instanceType?: string) =>
    selected.some((s) =>
      s.toolId === toolId && (instanceType ? s.instanceType === instanceType : s.planId === planId)
    );

  const total = selected.reduce((sum, s) => sum + Number(s.price), 0);

  const archTools = selected.map((s) => ({
    id: s.toolId, name: s.toolName, price: s.price, categoryName: s.categoryName,
  }));

  const generateShareLink = async () => {
    setShareLoading(true);
    const res = await fetch(`/api/projects/${id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowEdit: shareEdit }),
    });
    const data = await res.json();
    setShareLoading(false);
    if (data.token) setShareToken(data.token);
  };

  const toggleShareEdit = async (val: boolean) => {
    setShareEdit(val);
    if (!shareToken) return;
    await fetch(`/api/projects/${id}/share`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowEdit: val }),
    });
  };

  const revokeShare = async () => {
    await fetch(`/api/projects/${id}/share`, { method: "DELETE" });
    setShareToken(null);
    setShareEdit(false);
  };

  const copyShareLink = () => {
    if (!shareToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Use a ref so triggerAutoSave always calls the latest saveProject without stale closure
  const saveProjectRef = useRef<() => Promise<void>>(async () => {});

  const saveProject = async () => {
    setSaving(true);
    const diagram = diagramRef.current?.getDiagram() ?? { nodes: [], edges: [] };
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagram,
        selections: selected,
        total_monthly: total,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Keep ref in sync with latest saveProject
  useEffect(() => {
    saveProjectRef.current = saveProject;
  });

  const triggerAutoSave = useCallback(() => {
    if (!autoSave) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { saveProjectRef.current(); }, 2000);
  }, [autoSave]);

  // Auto-save: debounce 2s after selections change
  useEffect(() => {
    if (!autoSave || loading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { saveProjectRef.current(); }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [selected, autoSave, loading]);
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Top bar */}
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-zinc-100">{project?.name ?? "Project"}</h1>
            {project?.description && (
              <p className="text-[10px] text-zinc-500">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-white">{fmtUSD(total)}<span className="text-zinc-500 font-normal">/mo</span></span>

          {/* Auto-save toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">Auto-save</span>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setAutoSave(v => !v)}
              onKeyDown={e => e.key === "Enter" && setAutoSave(v => !v)}
              title={autoSave ? "Auto-save on" : "Auto-save off"}
              style={{
                width: 34, height: 18, borderRadius: 9, cursor: "pointer", flexShrink: 0,
                background: autoSave ? "#4f46e5" : "#3f3f46",
                position: "relative", transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 2, left: autoSave ? 16 : 2,
                width: 14, height: 14, borderRadius: "50%", background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.4)", transition: "left 0.2s",
                display: "block",
              }} />
            </div>
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={saveProject}
            disabled={saving}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              saved
                ? "bg-emerald-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
            }`}
          >
            {saved ? <><CheckCircle size={14} /> Saved</> : saving ? "Saving…" : <><Save size={14} /> Save</>}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 border-r border-zinc-800 bg-zinc-900 overflow-y-auto">
          <div className="px-4 py-4 border-b border-zinc-800">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Categories</p>
          </div>
          <nav className="py-2">
            {categories.map((cat) => (
              <div key={cat.id}>
                <button
                  onClick={() => setExpandedCats(toggle(expandedCats, cat.id))}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <span>{cat.name}</span>
                  <ChevronRight size={14} className={`text-zinc-500 transition-transform duration-200 ${expandedCats.has(cat.id) ? "rotate-90" : ""}`} />
                </button>

                {expandedCats.has(cat.id) && (
                  <div className="pb-1">
                    {cat.tools.map((tool) => {
                      const selfProviders = groupByProvider(tool.self_hosting ?? []);
                      const tab = activeTab(tool);
                      return (
                        <div key={tool.id}>
                          <button
                            onClick={() => setExpandedTools(toggle(expandedTools, tool.id))}
                            className={`flex w-full items-center justify-between px-7 py-2 text-xs transition-colors ${
                              selected.some((s) => s.toolId === tool.id)
                                ? "bg-indigo-600/20 text-indigo-300"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            }`}
                          >
                            <span className="font-medium">{tool.name}</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${expandedTools.has(tool.id) ? "rotate-180" : ""}`} />
                          </button>

                          {expandedTools.has(tool.id) && (
                            <div className="pl-7 pb-1">
                              {/* Tabs */}
                              <div className="flex gap-1 mb-2 mt-1">
                                {tool.plans.length > 0 && (
                                  <button
                                    onClick={() => setToolTab((p) => ({ ...p, [tool.id]: "managed" }))}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] transition-colors ${tab === "managed" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                                  >
                                    <Cloud size={10} /> Managed
                                  </button>
                                )}
                                {hasSelfHost(tool) && (
                                  <button
                                    onClick={() => setToolTab((p) => ({ ...p, [tool.id]: "selfhost" }))}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] transition-colors ${tab === "selfhost" ? "bg-emerald-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                                  >
                                    <Server size={10} /> Self-host
                                  </button>
                                )}
                              </div>

                              {/* Managed plans */}
                              {tab === "managed" && tool.plans.map((plan) => (
                                <button key={plan.id}
                                  onClick={() => handlePlanClick(tool, plan, cat.name)}
                                  className={`flex w-full items-start gap-2 px-3 py-2 text-[10px] rounded-md transition-colors mb-0.5 ${isSelected(tool.id, plan.id) ? "bg-indigo-700/30 text-indigo-200" : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"}`}
                                >
                                  {isSelected(tool.id, plan.id) ? <Check size={11} className="mt-0.5 text-indigo-400 shrink-0" /> : <div className="w-[11px] shrink-0" />}
                                  <div className="text-left">
                                    <div className="font-semibold flex items-center gap-1.5">
                                      {plan.name}
                                      {plan.is_popular && <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-400 uppercase font-bold">Popular</span>}
                                    </div>
                                    {plan.description && <div className="text-[9px] text-zinc-500 mt-0.5 leading-tight">{plan.description}</div>}
                                    {plan.is_token_based ? (
                                      <div className="font-mono mt-0.5 text-indigo-300/70">
                                        ${plan.price_input_per_1m}/M in · ${plan.price_output_per_1m}/M out
                                      </div>
                                    ) : (
                                      <div className="font-mono mt-0.5">{fmtUSD(plan.price)}/mo</div>
                                    )}
                                  </div>
                                </button>
                              ))}

                              {/* Self-host */}
                              {tab === "selfhost" && selfProviders.length > 0 && (() => {
                                const provKey  = activeProv(tool.id, selfProviders);
                                const provData = selfProviders.find((p) => p.provider === provKey);
                                return (
                                  <div>
                                    <div className="flex gap-1 mb-2 flex-wrap">
                                      {selfProviders.map((prov) => (
                                        <button key={prov.provider}
                                          onClick={() => setToolProvider((p) => ({ ...p, [tool.id]: prov.provider }))}
                                          style={{ borderColor: provKey === prov.provider ? PROVIDER_COLORS[prov.provider] : "#3f3f46" }}
                                          className={`px-2 py-0.5 rounded text-[9px] font-semibold border transition-colors ${provKey === prov.provider ? "text-white" : "text-zinc-500"}`}
                                        >
                                          {prov.providerLabel}
                                        </button>
                                      ))}
                                    </div>
                                    {provData?.instances.map((inst) => (
                                      <button key={inst.instance_id}
                                        onClick={() => upsertSelection({ toolId: tool.id, toolName: tool.name, categoryName: cat.name, planId: -inst.instance_id, planName: `${provData.providerLabel} · ${inst.instance_type}`, price: inst.price_monthly, isSelfHosted: true, provider: provData.provider, instanceType: inst.instance_type })}
                                        className={`flex w-full items-start gap-2 px-3 py-2 text-[10px] rounded-md transition-colors mb-0.5 ${isSelected(tool.id, -inst.instance_id, inst.instance_type) ? "bg-emerald-700/20 text-emerald-200" : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"}`}
                                      >
                                        {isSelected(tool.id, -inst.instance_id, inst.instance_type) ? <Check size={11} className="mt-0.5 text-emerald-400 shrink-0" /> : <div className="w-[11px] shrink-0" />}
                                        <div className="text-left w-full">
                                          <div className="font-semibold flex items-center gap-1.5">
                                            {inst.instance_type}
                                            {inst.is_recommended && <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-400 uppercase font-bold">Recommended</span>}
                                          </div>
                                          <div className="text-[9px] text-zinc-500 mt-0.5">{inst.vcpu} vCPU · {inst.memory_gb} GB RAM · {inst.region}</div>
                                          {inst.notes && <div className="text-[9px] text-zinc-600 mt-0.5">{inst.notes}</div>}
                                          <div className="font-mono mt-0.5 flex justify-between">
                                            <span>{fmtUSD(inst.price_monthly)}/mo</span>
                                            <span className="text-zinc-600">${inst.price_hourly}/hr</span>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col lg:flex-row gap-6 p-6 overflow-auto">
          <section className="flex-1 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Tag size={16} className="text-zinc-500" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Selected Tools</h2>
              </div>
              {selected.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 py-16 text-center">
                  <p className="text-zinc-500 text-sm">No tools selected.</p>
                  <p className="text-zinc-600 text-xs mt-1">Pick tools from the sidebar.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
                        <th className="px-4 py-3 text-left font-medium">Tool</th>
                        <th className="px-4 py-3 text-left font-medium">Plan / Instance</th>
                        <th className="px-4 py-3 text-left font-medium">Type</th>
                        <th className="px-4 py-3 text-left font-medium">Category</th>
                        <th className="px-4 py-3 text-right font-medium">Price / mo</th>
                        <th className="w-10 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {selected.map((sel) => {
                        let toolForSel: Tool | undefined;
                        let catForSel = sel.categoryName;
                        for (const cat of categories) {
                          const t = cat.tools.find((t) => t.id === sel.toolId);
                          if (t) { toolForSel = t; catForSel = cat.name; break; }
                        }
                        const hasSelfHostOpt = (toolForSel?.self_hosting?.length ?? 0) > 0;
                        const hasPlans = (toolForSel?.plans?.length ?? 0) > 0;
                        const canChange = hasPlans || hasSelfHostOpt;

                        return (
                        <tr key={sel.toolId} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                if (!canChange || !toolForSel) return;
                                const providers = groupByProvider(toolForSel.self_hosting ?? []);
                                const defaultTab = hasPlans ? "managed" : "selfhost";
                                setModalTab(defaultTab);
                                setModalProvider(providers[0]?.provider ?? "");

                                // If exactly one managed plan — apply immediately without modal
                                if (toolForSel.plans.length === 1 && !hasSelfHostOpt) {
                                  const plan = toolForSel.plans[0];
                                  if (plan.is_token_based) {
                                    setTokenModal({
                                      tool: toolForSel,
                                      plan,
                                      categoryName: catForSel,
                                      inputM:  sel.inputTokensM  ?? 1,
                                      outputM: sel.outputTokensM ?? 0.5,
                                    });
                                  } else {
                                    setSelected((prev) => prev.map((s) =>
                                      s.toolId === sel.toolId
                                        ? { ...s, planId: plan.id, planName: plan.name, price: plan.price, isSelfHosted: false, isTokenBased: false, provider: undefined, instanceType: undefined, inputTokensM: undefined, outputTokensM: undefined, priceInputPer1m: undefined, priceOutputPer1m: undefined }
                                        : s
                                    ));
                                  }
                                  return;
                                }
                                setPlanPopover({ toolId: sel.toolId, catName: catForSel });
                              }}
                              className={`text-zinc-200 font-medium text-left flex items-center gap-1.5 ${canChange ? "hover:text-indigo-300 transition-colors" : ""}`}
                            >
                              {sel.toolName}
                              {canChange && <ChevronDown size={12} className="text-zinc-600" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">
                            <div>{sel.planName}</div>
                            {sel.isTokenBased && (
                              <div className="text-zinc-600 font-mono mt-0.5">
                                {sel.inputTokensM}M in · {sel.outputTokensM}M out
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {sel.isSelfHosted
                              ? <span className="flex items-center gap-1 text-[10px] text-emerald-400"><Server size={10} /> Self-hosted</span>
                              : <span className="flex items-center gap-1 text-[10px] text-indigo-400"><Cloud size={10} /> Managed</span>}
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">{sel.categoryName}</td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-200">{fmtUSD(sel.price)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {sel.isTokenBased && (
                                <button
                                  onClick={() => editTokenSelection(sel)}
                                  className="text-zinc-600 hover:text-indigo-400 transition-colors"
                                  aria-label="Edit tokens"
                                >
                                  <Pencil size={13} strokeWidth={1.75} />
                                </button>
                              )}
                              <button onClick={() => setSelected((p) => p.filter((s) => s.toolId !== sel.toolId))}
                                className="text-zinc-600 hover:text-red-400 transition-colors" aria-label="Remove">
                                <Trash2 size={14} strokeWidth={1.75} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <ArchDiagram
              ref={diagramRef}
              selected={archTools}
              initialEdges={initEdges}
              initialDir={initDir}
              onChange={triggerAutoSave}
            />
          </section>

          {/* Summary */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="sticky top-0 rounded-xl bg-indigo-950 border border-indigo-800/50 p-5 shadow-lg">
              <div className="flex items-center gap-2 border-b border-indigo-800/50 pb-3 text-indigo-300">
                <Receipt size={15} strokeWidth={1.75} />
                <h2 className="text-xs font-semibold uppercase tracking-wider">Monthly Estimate</h2>
              </div>
              <div className="mt-4 space-y-2">
                {selected.map((sel) => (
                  <div key={sel.toolId} className="flex justify-between text-xs">
                    <span className="text-indigo-300/70 truncate pr-2 flex items-center gap-1">
                      {sel.isSelfHosted ? <Server size={9} className="text-emerald-400 shrink-0" /> : <Cloud size={9} className="text-indigo-400 shrink-0" />}
                      {sel.toolName}
                    </span>
                    <span className="font-mono text-indigo-200 shrink-0">{fmtUSD(sel.price)}</span>
                  </div>
                ))}
              </div>
              {selected.length > 0 ? (
                <>
                  <div className="mt-4 border-t border-indigo-800/50 pt-4 flex items-end justify-between">
                    <span className="text-xs text-indigo-400">Total / month</span>
                    <span className="font-mono text-2xl font-semibold text-white">{fmtUSD(total)}</span>
                  </div>
                  <div className="mt-3 rounded-lg bg-indigo-900/40 px-3 py-2 text-center">
                    <p className="text-[10px] text-indigo-400/70 uppercase tracking-wider">Annual</p>
                    <p className="font-mono text-sm font-medium text-indigo-200">{fmtUSD(total * 12)}</p>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-xs text-indigo-400/60 text-center">Select plans to see the total</p>
              )}
            </div>

            {/* Unit economics multiplier */}
            {selected.length > 0 && total > 0 && (
              <div className="mt-4 rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3 text-zinc-400">
                  <Activity size={13} strokeWidth={1.75} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Cost Multiplier</span>
                </div>

                {/* Unit label */}
                <div className="mb-3">
                  <label className="block text-[10px] text-zinc-500 mb-1">What are you processing?</label>
                  <input
                    value={unitLabel}
                    onChange={e => setUnitLabel(e.target.value)}
                    placeholder="e.g. resume, document, image…"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Base volume */}
                <div className="mb-3">
                  <label className="block text-[10px] text-zinc-500 mb-1">Current estimate based on</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="1"
                      value={baseVolume === 0 ? "" : baseVolume}
                      onChange={e => setBaseVolume(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                      placeholder="e.g. 1000"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-zinc-500 shrink-0">/mo</span>
                  </div>
                </div>

                {/* Only show scale + results once label and base are set */}
                {unitLabel.trim() && baseVolume ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-[10px] text-zinc-500 mb-1">Scale to</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min="1"
                          value={targetVolume}
                          onChange={e => setTargetVolume(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                          placeholder="e.g. 5000"
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500"
                        />
                        <span className="text-[10px] text-zinc-500 shrink-0">/mo</span>
                      </div>
                    </div>

                    {/* Results — always show cost/unit; show delta only when target is set */}
                    {(() => {
                      const base = Number(baseVolume);
                      const costPerUnit = total / base;
                      const target = Number(targetVolume);
                      const targetCost = target ? costPerUnit * target : null;
                      const delta = targetCost !== null ? targetCost - total : null;
                      const multiplier = target ? target / base : null;
                      const isUp = delta !== null && delta > 0;
                      return (
                        <div className="space-y-2 pt-3 border-t border-zinc-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500">Cost per {unitLabel}</span>
                            <span className="text-xs font-mono text-zinc-300">{fmtUSD(costPerUnit)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500">{base.toLocaleString()} {unitLabel}s/mo</span>
                            <span className="text-xs font-mono text-indigo-300">{fmtUSD(total)}/mo</span>
                          </div>
                          {targetCost !== null && delta !== null && multiplier !== null && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500">{target.toLocaleString()} {unitLabel}s/mo</span>
                                <span className="text-xs font-mono text-zinc-300">{fmtUSD(targetCost)}/mo</span>
                              </div>
                              <div className="flex items-center justify-between rounded-lg px-2.5 py-2 mt-1"
                                style={{ background: isUp ? "#1c0a0a" : "#052e16", border: `1px solid ${isUp ? "#7f1d1d" : "#14532d"}` }}>
                                <span className="text-[10px]" style={{ color: isUp ? "#f87171" : "#86efac" }}>
                                  {multiplier.toFixed(1)}× volume
                                </span>
                                <span className="text-xs font-mono font-semibold" style={{ color: isUp ? "#f87171" : "#86efac" }}>
                                  {isUp ? "+" : ""}{fmtUSD(delta)}/mo
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-[10px] text-zinc-600 text-center py-2">
                    Fill in what you&apos;re processing and the volume to see cost projections
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Share modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShareOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-indigo-400" />
                <h2 className="text-sm font-bold text-zinc-100">Share project</h2>
              </div>
              <button onClick={() => setShareOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={16} />
              </button>
            </div>

            {!shareToken ? (
              <>
                <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                  Generate a link so anyone can view this project&apos;s cost estimate and architecture diagram.
                </p>
                {/* Edit access toggle */}
                <div className="flex items-center justify-between mb-6 px-3 py-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <div>
                    <p className="text-xs font-medium text-zinc-200">Allow editing</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Viewers can modify the project</p>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setShareEdit((v) => !v)}
                    onKeyDown={(e) => e.key === "Enter" && setShareEdit((v) => !v)}
                    style={{
                      width: 40, height: 22, borderRadius: 11, cursor: "pointer", flexShrink: 0,
                      background: shareEdit ? "#4f46e5" : "#52525b",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <span style={{
                      position: "absolute", top: 3, left: shareEdit ? 19 : 3,
                      width: 16, height: 16, borderRadius: "50%", background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.4)", transition: "left 0.2s",
                      display: "block",
                    }} />
                  </div>
                </div>
                <button
                  onClick={generateShareLink}
                  disabled={shareLoading}
                  className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white transition-colors"
                >
                  {shareLoading ? "Generating…" : "Generate link"}
                </button>
              </>
            ) : (
              <>
                <p className="text-[10px] text-zinc-500 mb-3">Anyone with this link can {shareEdit ? "view and edit" : "view"} this project.</p>
                {/* Link box */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700">
                  <span className="text-xs text-zinc-400 truncate flex-1 font-mono">
                    {typeof window !== "undefined" ? `${window.location.origin}/share/${shareToken}` : `/share/${shareToken}`}
                  </span>
                  <button
                    onClick={copyShareLink}
                    className={`shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${shareCopied ? "text-emerald-400" : "text-indigo-400 hover:text-indigo-300"}`}
                  >
                    <Copy size={11} /> {shareCopied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Edit access toggle */}
                <div className="flex items-center justify-between mb-5 px-3 py-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <div>
                    <p className="text-xs font-medium text-zinc-200">Allow editing</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Viewers can modify the project</p>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleShareEdit(!shareEdit)}
                    onKeyDown={(e) => e.key === "Enter" && toggleShareEdit(!shareEdit)}
                    style={{
                      width: 40, height: 22, borderRadius: 11, cursor: "pointer", flexShrink: 0,
                      background: shareEdit ? "#4f46e5" : "#52525b",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <span style={{
                      position: "absolute", top: 3, left: shareEdit ? 19 : 3,
                      width: 16, height: 16, borderRadius: "50%", background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.4)", transition: "left 0.2s",
                      display: "block",
                    }} />
                  </div>
                </div>

                <button
                  onClick={revokeShare}
                  className="w-full rounded-lg border border-red-900 text-red-400 hover:bg-red-950 px-4 py-2 text-xs font-medium transition-colors"
                >
                  Revoke link
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Plan change modal */}
      {planPopover && (() => {
        let toolForModal: Tool | undefined;
        for (const cat of categories) {
          const t = cat.tools.find((t) => t.id === planPopover.toolId);
          if (t) { toolForModal = t; break; }
        }
        if (!toolForModal) return null;
        const sel = selected.find((s) => s.toolId === planPopover.toolId);
        const selfProviders = groupByProvider(toolForModal.self_hosting ?? []);
        const activeProvKey = modalProvider || selfProviders[0]?.provider || "";
        const provData = selfProviders.find((p) => p.provider === activeProvKey);
        const hasPlans = toolForModal.plans.length > 0;
        const hasSelfHostOpt = selfProviders.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setPlanPopover(null)}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold text-zinc-100">{toolForModal.name}</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Select a plan or deployment option</p>
                </div>
                <button onClick={() => setPlanPopover(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Pencil size={14} className="hidden" /><span className="text-lg leading-none">×</span>
                </button>
              </div>

              {/* Tabs */}
              {hasPlans && hasSelfHostOpt && (
                <div className="flex gap-1 px-5 pt-3">
                  <button
                    onClick={() => setModalTab("managed")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${modalTab === "managed" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300 bg-zinc-800"}`}
                  >
                    <Cloud size={11} /> Managed
                  </button>
                  <button
                    onClick={() => setModalTab("selfhost")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${modalTab === "selfhost" ? "bg-emerald-700 text-white" : "text-zinc-500 hover:text-zinc-300 bg-zinc-800"}`}
                  >
                    <Server size={11} /> Self-host
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="px-5 py-3 max-h-96 overflow-y-auto space-y-1">
                {/* Managed plans */}
                {(modalTab === "managed" || !hasSelfHostOpt) && hasPlans && toolForModal.plans.map((plan) => {
                  const isCurrent = !sel?.isSelfHosted && sel?.planId === plan.id;
                  return (
                    <button key={plan.id}
                      onClick={() => {
                        setPlanPopover(null);
                        if (plan.is_token_based) {
                          setTokenModal({
                            tool: toolForModal!,
                            plan,
                            categoryName: planPopover.catName,
                            inputM:  sel?.inputTokensM  ?? 1,
                            outputM: sel?.outputTokensM ?? 0.5,
                          });
                        } else {
                          setSelected((prev) => prev.map((s) =>
                            s.toolId === planPopover.toolId
                              ? { ...s, planId: plan.id, planName: plan.name, price: plan.price, isSelfHosted: false, isTokenBased: false, provider: undefined, instanceType: undefined, inputTokensM: undefined, outputTokensM: undefined, priceInputPer1m: undefined, priceOutputPer1m: undefined }
                              : s
                          ));
                        }
                      }}
                      className={`flex w-full items-start gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors ${isCurrent ? "bg-indigo-700/30 text-indigo-200" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
                    >
                      <div className="mt-0.5 w-3.5 shrink-0">
                        {isCurrent && <Check size={12} className="text-indigo-400" />}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          {plan.name}
                          {plan.is_popular && <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-400 uppercase font-bold">Popular</span>}
                        </div>
                        {plan.description && <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{plan.description}</div>}
                        {plan.is_token_based ? (
                          <div className="font-mono text-[10px] text-indigo-300/70 mt-1">${plan.price_input_per_1m}/M in · ${plan.price_output_per_1m}/M out</div>
                        ) : (
                          <div className="font-mono text-[10px] mt-1">{fmtUSD(plan.price)}/mo</div>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Self-host */}
                {(modalTab === "selfhost" || !hasPlans) && hasSelfHostOpt && (
                  <div>
                    {/* Provider tabs */}
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {selfProviders.map((prov) => (
                        <button key={prov.provider}
                          onClick={() => setModalProvider(prov.provider)}
                          style={{ borderColor: activeProvKey === prov.provider ? PROVIDER_COLORS[prov.provider] : "#3f3f46" }}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-colors ${activeProvKey === prov.provider ? "text-white" : "text-zinc-500"}`}
                        >
                          {prov.providerLabel}
                        </button>
                      ))}
                    </div>
                    {provData?.instances.map((inst) => {
                      const isCurrent = sel?.isSelfHosted && sel?.instanceType === inst.instance_type;
                      return (
                        <button key={inst.instance_id}
                          onClick={() => {
                            setPlanPopover(null);
                            setSelected((prev) => prev.map((s) =>
                              s.toolId === planPopover.toolId
                                ? { ...s, planId: -inst.instance_id, planName: `${provData.providerLabel} · ${inst.instance_type}`, price: inst.price_monthly, isSelfHosted: true, provider: provData.provider, instanceType: inst.instance_type, isTokenBased: false, inputTokensM: undefined, outputTokensM: undefined, priceInputPer1m: undefined, priceOutputPer1m: undefined }
                                : s
                            ));
                          }}
                          className={`flex w-full items-start gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors mb-1 ${isCurrent ? "bg-emerald-700/20 text-emerald-200" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
                        >
                          <div className="mt-0.5 w-3.5 shrink-0">
                            {isCurrent && <Check size={12} className="text-emerald-400" />}
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-semibold flex items-center gap-1.5">
                              {inst.instance_type}
                              {inst.is_recommended && <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-400 uppercase font-bold">Recommended</span>}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{inst.vcpu} vCPU · {inst.memory_gb} GB RAM · {inst.region}</div>
                            <div className="font-mono text-[10px] mt-1 flex justify-between">
                              <span>{fmtUSD(inst.price_monthly)}/mo</span>
                              <span className="text-zinc-600">${inst.price_hourly}/hr</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Token pricing modal */}
      {tokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-sm font-bold text-zinc-100 mb-1">{tokenModal.plan.name}</h2>
            <p className="text-xs text-zinc-500 mb-5">
              Set your estimated monthly token usage to calculate the cost.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Input tokens / month
                  <span className="text-zinc-600 ml-1 font-normal">
                    (millions) · ${tokenModal.plan.price_input_per_1m}/M
                  </span>
                </label>
                <input
                  type="number" min="0" step="0.1"
                  value={tokenModal.inputM}
                  onChange={(e) => setTokenModal({ ...tokenModal, inputM: Math.max(0, Number(e.target.value)) })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-100 outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-zinc-600 mt-1">
                  = {(tokenModal.inputM * 1_000_000).toLocaleString()} tokens →{" "}
                  {fmtUSD(tokenModal.inputM * (tokenModal.plan.price_input_per_1m ?? 0))}
                </p>
              </div>

              {(tokenModal.plan.price_output_per_1m ?? 0) > 0 && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Output tokens / month
                    <span className="text-zinc-600 ml-1 font-normal">
                      (millions) · ${tokenModal.plan.price_output_per_1m}/M
                    </span>
                  </label>
                  <input
                    type="number" min="0" step="0.1"
                    value={tokenModal.outputM}
                    onChange={(e) => setTokenModal({ ...tokenModal, outputM: Math.max(0, Number(e.target.value)) })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-100 outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1">
                    = {(tokenModal.outputM * 1_000_000).toLocaleString()} tokens →{" "}
                    {fmtUSD(tokenModal.outputM * (tokenModal.plan.price_output_per_1m ?? 0))}
                  </p>
                </div>
              )}
            </div>

            {/* Estimated total */}
            <div className="rounded-lg bg-indigo-950 border border-indigo-800/50 px-4 py-3 mb-5 flex items-center justify-between">
              <span className="text-xs text-indigo-400">Estimated / month</span>
              <span className="font-mono text-lg font-semibold text-white">
                {fmtUSD(calcTokenPrice(
                  tokenModal.inputM, tokenModal.outputM,
                  tokenModal.plan.price_input_per_1m ?? 0,
                  tokenModal.plan.price_output_per_1m ?? 0,
                ))}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setTokenModal(null)}
                className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTokenModal}
                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors"
              >
                Add to estimate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
