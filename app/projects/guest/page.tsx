"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  ChevronRight, ChevronDown, Receipt, Tag, Check,
  Server, Cloud, ArrowLeft, Save, Share2, Lock, X, Activity,
} from "lucide-react";
import ArchDiagram, { type ArchDiagramHandle } from "@/app/components/ArchDiagram";

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
  isTokenBased?: boolean; inputTokensM?: number; outputTokensM?: number;
  priceInputPer1m?: number; priceOutputPer1m?: number;
}

function calcTokenPrice(i: number, o: number, ir: number, or_: number) { return i * ir + o * or_; }
const fmtUSD = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const PROVIDER_COLORS: Record<string, string> = { aws: "#FF9900", azure: "#0078D4", gcp: "#4285F4" };

function groupByProvider(instances: SelfHostInstance[]) {
  const map = new Map<string, { provider: string; providerLabel: string; instances: SelfHostInstance[] }>();
  for (const inst of instances) {
    if (!map.has(inst.provider))
      map.set(inst.provider, { provider: inst.provider, providerLabel: inst.provider_label, instances: [] });
    map.get(inst.provider)!.instances.push(inst);
  }
  return [...map.values()];
}

export default function GuestProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">Loading…</div>}>
      <GuestProjectPageInner />
    </Suspense>
  );
}

function GuestProjectPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [categories, setCategories]       = useState<Category[]>([]);
  const [expandedCats, setExpandedCats]   = useState<Set<number>>(new Set());
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());
  const [toolTab, setToolTab]             = useState<Record<number, "managed" | "selfhost">>({});
  const [toolProvider, setToolProvider]   = useState<Record<number, string>>({});
  const [selected, setSelected]           = useState<SelectedItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [tokenModal, setTokenModal]       = useState<{ tool: Tool; plan: Plan; inputM: number; outputM: number } | null>(null);
  const [planPopover, setPlanPopover]     = useState<{ toolId: number; catName: string } | null>(null);
  const [modalTab, setModalTab]           = useState<"managed" | "selfhost">("managed");
  const [modalProvider, setModalProvider] = useState<string>("");
  const diagramRef = useRef<ArchDiagramHandle>(null);
  const [unitLabel, setUnitLabel]       = useState("");
  const [baseVolume, setBaseVolume]     = useState<number | "">(0);
  const [targetVolume, setTargetVolume] = useState<number | "">("");

  // Save/share flow state
  const [saveModal, setSaveModal]   = useState<"signin" | "details" | null>(null);
  const [saveIntent, setSaveIntent] = useState<"save" | "share">("save");
  const [projName, setProjName]     = useState("");
  const [projDesc, setProjDesc]     = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(cats => {
      setCategories(Array.isArray(cats) ? cats : []);

      // Load template from sessionStorage if present
      const raw = sessionStorage.getItem("guestTemplate");
      if (raw) {
        try {
          const tpl = JSON.parse(raw) as {
            name: string;
            selections: Array<{
              toolId: number; toolName: string; categoryName: string;
              planId: number; planName: string; price: number;
              isSelfHosted: boolean; provider?: string; instanceType?: string;
              isTokenBased?: boolean; inputTokensM?: number; outputTokensM?: number;
              priceInputPer1m?: number; priceOutputPer1m?: number;
            }>;
          };
          const seen = new Set<number>();
          const deduped = tpl.selections.filter(s => {
            if (seen.has(s.toolId)) return false;
            seen.add(s.toolId);
            return true;
          });
          setSelected(deduped.map(s => ({
            toolId: s.toolId, toolName: s.toolName, categoryName: s.categoryName,
            planId: s.planId ?? 0, planName: s.planName ?? "", price: s.price ?? 0,
            isSelfHosted: s.isSelfHosted ?? false,
            isTokenBased: s.isTokenBased, inputTokensM: s.inputTokensM,
            outputTokensM: s.outputTokensM, priceInputPer1m: s.priceInputPer1m,
            priceOutputPer1m: s.priceOutputPer1m,
          })));
        } catch { /* ignore bad JSON */ }
        sessionStorage.removeItem("guestTemplate");

        // Load multiplier defaults if stored
        const mult = sessionStorage.getItem("guestMultiplier");
        if (mult) {
          try {
            const m = JSON.parse(mult) as { label: string; base: number; target: number };
            setUnitLabel(m.label);
            setBaseVolume(m.base);
            setTargetVolume(m.target);
          } catch { /* ignore */ }
          sessionStorage.removeItem("guestMultiplier");
        }
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // After returning from Google sign-in, restore selections and show details modal
  useEffect(() => {
    if (status !== "authenticated") return;
    const restore = searchParams.get("restore");
    if (!restore) return;
    try {
      const raw = sessionStorage.getItem("guest_selections");
      const intent = (sessionStorage.getItem("guest_save_intent") ?? "save") as "save" | "share";
      if (raw) {
        const items = JSON.parse(raw) as SelectedItem[];
        setSelected(items);
        setSaveIntent(intent);
        setSaveModal("details");
        sessionStorage.removeItem("guest_selections");
        sessionStorage.removeItem("guest_save_intent");
      }
    } catch { /* ignore */ }
  }, [status, searchParams]);

  const toggle = (set: Set<number>, id: number) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  const hasSelfHost = (t: Tool) => (t.self_hosting?.length ?? 0) > 0;
  const activeTab   = (t: Tool) => toolTab[t.id] ?? (t.plans.length > 0 ? "managed" : "selfhost");
  const activeProv  = (id: number, providers: { provider: string }[]) => toolProvider[id] ?? providers[0]?.provider ?? "";

  const upsertSelection = (item: SelectedItem) => {
    setSelected(prev => {
      const exists = prev.find(s => s.toolId === item.toolId);
      if (exists && exists.planId === item.planId && exists.instanceType === item.instanceType)
        return prev.filter(s => s.toolId !== item.toolId);
      if (exists) return prev.map(s => s.toolId === item.toolId ? item : s);
      return [...prev, item];
    });
  };

  const handlePlanClick = (tool: Tool, plan: Plan, categoryName: string) => {
    if (plan.is_token_based) {
      const existing = selected.find(s => s.toolId === tool.id && s.planId === plan.id);
      setTokenModal({ tool, plan, inputM: existing?.inputTokensM ?? 1, outputM: existing?.outputTokensM ?? 0.5 });
    } else {
      upsertSelection({ toolId: tool.id, toolName: tool.name, categoryName, planId: plan.id, planName: plan.name, price: plan.price, isSelfHosted: false });
    }
  };

  const confirmToken = () => {
    if (!tokenModal) return;
    const { tool, plan, inputM, outputM } = tokenModal;
    const ir = plan.price_input_per_1m ?? 0, or_ = plan.price_output_per_1m ?? 0;
    const catName = categories.find(c => c.tools.some(t => t.id === tool.id))?.name ?? "";
    const item: SelectedItem = {
      toolId: tool.id, toolName: tool.name, categoryName: catName,
      planId: plan.id, planName: plan.name, price: calcTokenPrice(inputM, outputM, ir, or_),
      isSelfHosted: false, isTokenBased: true, inputTokensM: inputM, outputTokensM: outputM,
      priceInputPer1m: ir, priceOutputPer1m: or_,
    };
    setSelected(prev => { const e = prev.find(s => s.toolId === item.toolId); return e ? prev.map(s => s.toolId === item.toolId ? item : s) : [...prev, item]; });
    setTokenModal(null);
  };

  const isSelected = (toolId: number, planId: number, instanceType?: string) =>
    selected.some(s => s.toolId === toolId && (instanceType ? s.instanceType === instanceType : s.planId === planId));

  const total = selected.reduce((sum, s) => sum + Number(s.price), 0);
  const archTools = selected.map(s => ({ id: s.toolId, name: s.toolName, price: s.price, categoryName: s.categoryName }));

  const openSaveFlow = (intent: "save" | "share") => {
    setSaveIntent(intent);
    if (status === "authenticated") {
      setSaveModal("details");
    } else {
      setSaveModal("signin");
    }
  };

  const handleSignIn = () => {
    sessionStorage.setItem("guest_selections", JSON.stringify(selected));
    sessionStorage.setItem("guest_save_intent", saveIntent);
    signIn("google", { callbackUrl: "/projects/guest?restore=1" });
  };

  const handleSaveProject = async () => {
    if (!projName.trim()) { setSaveError("Project name is required"); return; }
    setSaving(true);
    const total = selected.reduce((sum, s) => sum + Number(s.price), 0);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: projName.trim(), description: projDesc.trim() || null, selections: selected, total_monthly: total }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveError(data.error ?? "Failed to save"); return; }
    router.push(`/projects/${data.id}${saveIntent === "share" ? "?share=1" : ""}`);
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">Loading…</div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-zinc-100">Untitled project</h1>
            <p className="text-[10px] text-zinc-500">Guest mode — not saved</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-white">{fmtUSD(total)}<span className="text-zinc-500 font-normal">/mo</span></span>
          <button
            onClick={() => openSaveFlow("share")}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={() => openSaveFlow("save")}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            <Save size={14} /> Save
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
            {categories.map(cat => (
              <div key={cat.id}>
                <button onClick={() => setExpandedCats(toggle(expandedCats, cat.id))}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
                  <span>{cat.name}</span>
                  <ChevronRight size={14} className={`text-zinc-500 transition-transform duration-200 ${expandedCats.has(cat.id) ? "rotate-90" : ""}`} />
                </button>
                {expandedCats.has(cat.id) && (
                  <div className="pb-1">
                    {cat.tools.map(tool => {
                      const selfProviders = groupByProvider(tool.self_hosting ?? []);
                      const tab = activeTab(tool);
                      return (
                        <div key={tool.id}>
                          <button onClick={() => setExpandedTools(toggle(expandedTools, tool.id))}
                            className={`flex w-full items-center justify-between px-7 py-2 text-xs transition-colors ${selected.some(s => s.toolId === tool.id) ? "bg-indigo-600/20 text-indigo-300" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}>
                            <span className="font-medium">{tool.name}</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${expandedTools.has(tool.id) ? "rotate-180" : ""}`} />
                          </button>
                          {expandedTools.has(tool.id) && (
                            <div className="pl-7 pb-1">
                              <div className="flex gap-1 mb-2 mt-1">
                                {tool.plans.length > 0 && (
                                  <button onClick={() => setToolTab(p => ({ ...p, [tool.id]: "managed" }))}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] transition-colors ${tab === "managed" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                                    <Cloud size={10} /> Managed
                                  </button>
                                )}
                                {hasSelfHost(tool) && (
                                  <button onClick={() => setToolTab(p => ({ ...p, [tool.id]: "selfhost" }))}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] transition-colors ${tab === "selfhost" ? "bg-emerald-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                                    <Server size={10} /> Self-host
                                  </button>
                                )}
                              </div>
                              {tab === "managed" && tool.plans.map(plan => (
                                <button key={plan.id} onClick={() => handlePlanClick(tool, plan, cat.name)}
                                  className={`flex w-full items-start gap-2 px-3 py-2 text-[10px] rounded-md transition-colors mb-0.5 ${isSelected(tool.id, plan.id) ? "bg-indigo-700/30 text-indigo-200" : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"}`}>
                                  {isSelected(tool.id, plan.id) ? <Check size={11} className="mt-0.5 text-indigo-400 shrink-0" /> : <div className="w-[11px] shrink-0" />}
                                  <div className="text-left">
                                    <div className="font-semibold flex items-center gap-1.5">{plan.name}
                                      {plan.is_popular && <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-400 uppercase font-bold">Popular</span>}
                                    </div>
                                    {plan.is_token_based
                                      ? <div className="font-mono mt-0.5 text-indigo-300/70">${plan.price_input_per_1m}/M in · ${plan.price_output_per_1m}/M out</div>
                                      : <div className="font-mono mt-0.5">{fmtUSD(plan.price)}/mo</div>}
                                  </div>
                                </button>
                              ))}
                              {tab === "selfhost" && selfProviders.length > 0 && (() => {
                                const provKey = activeProv(tool.id, selfProviders);
                                const provData = selfProviders.find(p => p.provider === provKey);
                                return (
                                  <div>
                                    <div className="flex gap-1 mb-2 flex-wrap">
                                      {selfProviders.map(prov => (
                                        <button key={prov.provider} onClick={() => setToolProvider(p => ({ ...p, [tool.id]: prov.provider }))}
                                          style={{ borderColor: provKey === prov.provider ? PROVIDER_COLORS[prov.provider] : "#3f3f46" }}
                                          className={`px-2 py-0.5 rounded text-[9px] font-semibold border transition-colors ${provKey === prov.provider ? "text-white" : "text-zinc-500"}`}>
                                          {prov.providerLabel}
                                        </button>
                                      ))}
                                    </div>
                                    {provData?.instances.map(inst => (
                                      <button key={inst.instance_id}
                                        onClick={() => upsertSelection({ toolId: tool.id, toolName: tool.name, categoryName: cat.name, planId: -inst.instance_id, planName: `${provData.providerLabel} · ${inst.instance_type}`, price: inst.price_monthly, isSelfHosted: true, provider: provData.provider, instanceType: inst.instance_type })}
                                        className={`flex w-full items-start gap-2 px-3 py-2 text-[10px] rounded-md transition-colors mb-0.5 ${isSelected(tool.id, -inst.instance_id, inst.instance_type) ? "bg-emerald-700/20 text-emerald-200" : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"}`}>
                                        {isSelected(tool.id, -inst.instance_id, inst.instance_type) ? <Check size={11} className="mt-0.5 text-emerald-400 shrink-0" /> : <div className="w-[11px] shrink-0" />}
                                        <div className="text-left w-full">
                                          <div className="font-semibold flex items-center gap-1.5">{inst.instance_type}
                                            {inst.is_recommended && <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-400 uppercase font-bold">Recommended</span>}
                                          </div>
                                          <div className="text-[9px] text-zinc-500 mt-0.5">{inst.vcpu} vCPU · {inst.memory_gb} GB RAM · {inst.region}</div>
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
            {/* Selected tools table */}
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
                      {selected.map(sel => {
                        let toolForSel: Tool | undefined;
                        let catForSel = sel.categoryName;
                        for (const cat of categories) {
                          const t = cat.tools.find(t => t.id === sel.toolId);
                          if (t) { toolForSel = t; catForSel = cat.name; break; }
                        }
                        const selfProviders = groupByProvider(toolForSel?.self_hosting ?? []);
                        const hasSelfHostOpt = selfProviders.length > 0;
                        const hasPlans = (toolForSel?.plans?.length ?? 0) > 0;
                        const canChange = hasPlans || hasSelfHostOpt;
                        const isPopoverOpen = planPopover?.toolId === sel.toolId;
                        return (
                          <tr key={sel.toolId} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40 transition-colors">
                            <td className="px-4 py-3">
                              <button onClick={() => {
                                if (!canChange || !toolForSel) return;
                                const providers = groupByProvider(toolForSel.self_hosting ?? []);
                                setModalTab(hasPlans ? "managed" : "selfhost");
                                setModalProvider(providers[0]?.provider ?? "");
                                setPlanPopover({ toolId: sel.toolId, catName: catForSel });
                              }} className={`text-zinc-200 font-medium text-left flex items-center gap-1.5 ${canChange ? "hover:text-indigo-300 transition-colors" : ""}`}>
                                {sel.toolName}
                                {canChange && <ChevronDown size={12} className="text-zinc-600" />}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-zinc-400 text-xs">
                              <div>{sel.planName}</div>
                              {sel.isTokenBased && <div className="text-zinc-600 font-mono mt-0.5">{sel.inputTokensM}M in · {sel.outputTokensM}M out</div>}
                            </td>
                            <td className="px-4 py-3">
                              {sel.isSelfHosted
                                ? <span className="flex items-center gap-1 text-[10px] text-emerald-400"><Server size={10} /> Self-hosted</span>
                                : <span className="flex items-center gap-1 text-[10px] text-indigo-400"><Cloud size={10} /> Managed</span>}
                            </td>
                            <td className="px-4 py-3 text-zinc-400 text-xs">{sel.categoryName}</td>
                            <td className="px-4 py-3 text-right font-mono text-zinc-200">{fmtUSD(sel.price)}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => setSelected(p => p.filter(s => s.toolId !== sel.toolId))}
                                className="text-zinc-600 hover:text-red-400 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <ArchDiagram ref={diagramRef} selected={archTools} />
          </section>

          {/* Summary */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="sticky top-0 rounded-xl bg-indigo-950 border border-indigo-800/50 p-5 shadow-lg">
              <div className="flex items-center gap-2 border-b border-indigo-800/50 pb-3 text-indigo-300">
                <Receipt size={15} strokeWidth={1.75} />
                <h2 className="text-xs font-semibold uppercase tracking-wider">Monthly Estimate</h2>
              </div>
              <div className="mt-4 space-y-2">
                {selected.map(sel => (
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

            {/* Cost Multiplier */}
            {selected.length > 0 && total > 0 && (
              <div className="mt-4 rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3 text-zinc-400">
                  <Activity size={13} strokeWidth={1.75} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Cost Multiplier</span>
                </div>
                <div className="mb-3">
                  <label className="block text-[10px] text-zinc-500 mb-1">What are you processing?</label>
                  <input value={unitLabel} onChange={e => setUnitLabel(e.target.value)}
                    placeholder="e.g. resume, document, image…"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500" />
                </div>
                <div className="mb-3">
                  <label className="block text-[10px] text-zinc-500 mb-1">Current estimate based on</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1"
                      value={baseVolume === 0 ? "" : baseVolume}
                      onChange={e => setBaseVolume(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                      placeholder="e.g. 1000"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500" />
                    <span className="text-[10px] text-zinc-500 shrink-0">/mo</span>
                  </div>
                </div>
                {unitLabel.trim() && baseVolume ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-[10px] text-zinc-500 mb-1">Scale to</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1"
                          value={targetVolume}
                          onChange={e => setTargetVolume(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                          placeholder="e.g. 5000"
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500" />
                        <span className="text-[10px] text-zinc-500 shrink-0">/mo</span>
                      </div>
                    </div>
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

      {/* Save / Share sign-in & details modal */}
      {saveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSaveModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-100">
                {saveModal === "signin" ? "Sign in to save" : saveIntent === "share" ? "Save & share project" : "Save project"}
              </h2>
              <button onClick={() => setSaveModal(null)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
            </div>

            {saveModal === "signin" && (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center mx-auto mb-4">
                  <Lock size={20} className="text-indigo-400" />
                </div>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                  Sign in with Google to save your selections to your account.
                  {saveIntent === "share" && " You'll then get a shareable link."}
                </p>
                <button
                  onClick={handleSignIn}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.705A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.037l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.584c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.963L3.964 7.295C4.672 5.163 6.656 3.584 9 3.584z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            )}

            {saveModal === "details" && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Project name</label>
                  <input
                    autoFocus
                    value={projName}
                    onChange={e => { setProjName(e.target.value); setSaveError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleSaveProject()}
                    placeholder="e.g. AI Recruitment Platform"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500"
                  />
                  {saveError && <p className="text-xs text-red-400 mt-1.5">{saveError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description <span className="text-zinc-600">(optional)</span></label>
                  <textarea
                    value={projDesc}
                    onChange={e => setProjDesc(e.target.value)}
                    placeholder="Brief description…"
                    rows={3}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setSaveModal(null)} className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveProject} disabled={saving} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white transition-colors">
                    {saving ? "Saving…" : saveIntent === "share" ? "Save & continue" : "Save project"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan change modal */}
      {planPopover && (() => {
        let toolForModal: Tool | undefined;
        for (const cat of categories) {
          const t = cat.tools.find(t => t.id === planPopover.toolId);
          if (t) { toolForModal = t; break; }
        }
        if (!toolForModal) return null;
        const sel = selected.find(s => s.toolId === planPopover.toolId);
        const selfProviders = groupByProvider(toolForModal.self_hosting ?? []);
        const activeProvKey = modalProvider || selfProviders[0]?.provider || "";
        const provData = selfProviders.find(p => p.provider === activeProvKey);
        const hasPlans = toolForModal.plans.length > 0;
        const hasSelfHostOpt = selfProviders.length > 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setPlanPopover(null)}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold text-zinc-100">{toolForModal.name}</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Select a plan or deployment option</p>
                </div>
                <button onClick={() => setPlanPopover(null)} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">×</button>
              </div>
              {hasPlans && hasSelfHostOpt && (
                <div className="flex gap-1 px-5 pt-3">
                  <button onClick={() => setModalTab("managed")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${modalTab === "managed" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300 bg-zinc-800"}`}><Cloud size={11} /> Managed</button>
                  <button onClick={() => setModalTab("selfhost")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${modalTab === "selfhost" ? "bg-emerald-700 text-white" : "text-zinc-500 hover:text-zinc-300 bg-zinc-800"}`}><Server size={11} /> Self-host</button>
                </div>
              )}
              <div className="px-5 py-3 max-h-96 overflow-y-auto space-y-1">
                {(modalTab === "managed" || !hasSelfHostOpt) && hasPlans && toolForModal.plans.map(plan => {
                  const isCurrent = !sel?.isSelfHosted && sel?.planId === plan.id;
                  return (
                    <button key={plan.id} onClick={() => {
                      setPlanPopover(null);
                      if (plan.is_token_based) {
                        setTokenModal({ tool: toolForModal!, plan, inputM: sel?.inputTokensM ?? 1, outputM: sel?.outputTokensM ?? 0.5 });
                      } else {
                        setSelected(prev => prev.map(s => s.toolId === planPopover.toolId ? { ...s, planId: plan.id, planName: plan.name, price: plan.price, isSelfHosted: false, isTokenBased: false, provider: undefined, instanceType: undefined, inputTokensM: undefined, outputTokensM: undefined } : s));
                      }
                    }} className={`flex w-full items-start gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors ${isCurrent ? "bg-indigo-700/30 text-indigo-200" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}>
                      <div className="mt-0.5 w-3.5 shrink-0">{isCurrent && <Check size={12} className="text-indigo-400" />}</div>
                      <div className="text-left flex-1">
                        <div className="font-semibold flex items-center gap-1.5">{plan.name}{plan.is_popular && <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-400 uppercase font-bold">Popular</span>}</div>
                        {plan.is_token_based ? <div className="font-mono text-[10px] text-indigo-300/70 mt-1">${plan.price_input_per_1m}/M in · ${plan.price_output_per_1m}/M out</div> : <div className="font-mono text-[10px] mt-1">{fmtUSD(plan.price)}/mo</div>}
                      </div>
                    </button>
                  );
                })}
                {(modalTab === "selfhost" || !hasPlans) && hasSelfHostOpt && (
                  <div>
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {selfProviders.map(prov => (
                        <button key={prov.provider} onClick={() => setModalProvider(prov.provider)}
                          style={{ borderColor: activeProvKey === prov.provider ? PROVIDER_COLORS[prov.provider] : "#3f3f46" }}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-colors ${activeProvKey === prov.provider ? "text-white" : "text-zinc-500"}`}>
                          {prov.providerLabel}
                        </button>
                      ))}
                    </div>
                    {provData?.instances.map(inst => {
                      const isCurrent = sel?.isSelfHosted && sel?.instanceType === inst.instance_type;
                      return (
                        <button key={inst.instance_id} onClick={() => {
                          setPlanPopover(null);
                          setSelected(prev => prev.map(s => s.toolId === planPopover.toolId ? { ...s, planId: -inst.instance_id, planName: `${provData.providerLabel} · ${inst.instance_type}`, price: inst.price_monthly, isSelfHosted: true, provider: provData.provider, instanceType: inst.instance_type, isTokenBased: false } : s));
                        }} className={`flex w-full items-start gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors mb-1 ${isCurrent ? "bg-emerald-700/20 text-emerald-200" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}>
                          <div className="mt-0.5 w-3.5 shrink-0">{isCurrent && <Check size={12} className="text-emerald-400" />}</div>
                          <div className="text-left flex-1">
                            <div className="font-semibold flex items-center gap-1.5">{inst.instance_type}{inst.is_recommended && <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-400 uppercase font-bold">Recommended</span>}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{inst.vcpu} vCPU · {inst.memory_gb} GB RAM · {inst.region}</div>
                            <div className="font-mono text-[10px] mt-1 flex justify-between"><span>{fmtUSD(inst.price_monthly)}/mo</span><span className="text-zinc-600">${inst.price_hourly}/hr</span></div>
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

      {/* Token modal */}
      {tokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-sm font-bold text-zinc-100 mb-1">{tokenModal.plan.name}</h2>
            <p className="text-xs text-zinc-500 mb-5">Set your estimated monthly token usage.</p>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Input tokens / month (millions) · ${tokenModal.plan.price_input_per_1m}/M</label>
                <input type="number" min="0" step="0.1" value={tokenModal.inputM}
                  onChange={e => setTokenModal({ ...tokenModal, inputM: Math.max(0, Number(e.target.value)) })}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-100 outline-none focus:border-indigo-500" />
              </div>
              {(tokenModal.plan.price_output_per_1m ?? 0) > 0 && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Output tokens / month (millions) · ${tokenModal.plan.price_output_per_1m}/M</label>
                  <input type="number" min="0" step="0.1" value={tokenModal.outputM}
                    onChange={e => setTokenModal({ ...tokenModal, outputM: Math.max(0, Number(e.target.value)) })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-100 outline-none focus:border-indigo-500" />
                </div>
              )}
            </div>
            <div className="rounded-lg bg-indigo-950 border border-indigo-800/50 px-4 py-3 mb-5 flex items-center justify-between">
              <span className="text-xs text-indigo-400">Estimated / month</span>
              <span className="font-mono text-lg font-semibold text-white">{fmtUSD(calcTokenPrice(tokenModal.inputM, tokenModal.outputM, tokenModal.plan.price_input_per_1m ?? 0, tokenModal.plan.price_output_per_1m ?? 0))}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTokenModal(null)} className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
              <button onClick={confirmToken} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors">Add to estimate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
