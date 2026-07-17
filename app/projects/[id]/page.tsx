"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight, ChevronDown, Receipt, Tag, Trash2, Check,
  Server, Cloud, ArrowLeft, Save, CheckCircle, Pencil,
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
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

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
  const [tokenModal, setTokenModal]     = useState<{
    tool: Tool; plan: Plan; categoryName: string;
    inputM: number; outputM: number;
  } | null>(null);

  // Only restore edges (user-drawn connections) from DB — nodes are always rebuilt from `selected`
  const [initEdges, setInitEdges] = useState<Edge[] | undefined>(undefined);
  const diagramRef = useRef<ArchDiagramHandle>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/projects/${id}`).then((r) => r.json()),
    ]).then(([cats, proj]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      if (proj && !proj.error) {
        setProject({ name: proj.name, description: proj.description ?? "" });
        if (proj.selections) setSelected(proj.selections);
        // Only restore user-drawn edges — nodes are rebuilt from selections
        if (proj.diagram?.edges) setInitEdges(proj.diagram.edges);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

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
                      {selected.map((sel) => (
                        <tr key={sel.toolId} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3 text-zinc-200 font-medium">{sel.toolName}</td>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <ArchDiagram
              ref={diagramRef}
              selected={archTools}
              initialEdges={initEdges}
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
          </aside>
        </div>
      </div>

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
