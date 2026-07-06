"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight, ChevronDown, Receipt, Tag, Trash2, Check, Server, Cloud,
} from "lucide-react";
import ArchDiagram from "./components/ArchDiagram";

/* ─── types ─────────────────────────────────────────────────── */
interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  is_popular: boolean;
}

interface SelfHostInstance {
  instance_id: number;
  provider: string;
  provider_label: string;
  instance_type: string;
  vcpu: number;
  memory_gb: number;
  price_hourly: number;
  price_monthly: number;
  region: string;
  notes: string;
  is_recommended: boolean;
}

interface Tool {
  id: number;
  name: string;
  description: string;
  plans: Plan[];
  self_hosting: SelfHostInstance[];
}

interface Category {
  id: number;
  name: string;
  tools: Tool[];
}

interface SelectedItem {
  toolId: number;
  toolName: string;
  categoryName: string;
  planId: number;
  planName: string;
  price: number;
  isSelfHosted: boolean;
  provider?: string;
  instanceType?: string;
}

/* ─── helpers ────────────────────────────────────────────────── */
const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const PROVIDER_COLORS: Record<string, string> = {
  aws:   "#FF9900",
  azure: "#0078D4",
  gcp:   "#4285F4",
};

/* ─── component ──────────────────────────────────────────────── */
export default function Home() {
  const [categories, setCategories]       = useState<Category[]>([]);
  const [expandedCats, setExpandedCats]   = useState<Set<number>>(new Set());
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());
  const [toolTab, setToolTab]             = useState<Record<number, "managed" | "selfhost">>({});
  const [toolProvider, setToolProvider]   = useState<Record<number, string>>({});
  const [selected, setSelected]           = useState<SelectedItem[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* group self_hosting flat list by provider */
  const groupByProvider = (instances: SelfHostInstance[]) => {
    const map = new Map<string, { provider: string; providerLabel: string; instances: SelfHostInstance[] }>();
    for (const inst of instances) {
      if (!map.has(inst.provider)) {
        map.set(inst.provider, { provider: inst.provider, providerLabel: inst.provider_label, instances: [] });
      }
      map.get(inst.provider)!.instances.push(inst);
    }
    return [...map.values()];
  };

  /* ── sidebar helpers ── */
  const toggle = (set: Set<number>, id: number) => {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  };

  const hasSelfHost = (tool: Tool) => tool.self_hosting?.length > 0;

  const activeTab = (toolId: number) => toolTab[toolId] ?? "managed";
  const activeProvider = (toolId: number, providers: { provider: string }[]) =>
    toolProvider[toolId] ?? providers[0]?.provider ?? "";

  /* ── selection ── */
  const upsertSelection = (item: SelectedItem) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.toolId === item.toolId);
      if (exists && exists.planId === item.planId && exists.instanceType === item.instanceType) {
        return prev.filter((s) => s.toolId !== item.toolId);
      }
      if (exists) return prev.map((s) => s.toolId === item.toolId ? item : s);
      return [...prev, item];
    });
  };

  const isSelected = (toolId: number, planId: number, instanceType?: string) =>
    selected.some((s) =>
      s.toolId === toolId &&
      (instanceType ? s.instanceType === instanceType : s.planId === planId)
    );

  const total = selected.reduce((sum, s) => sum + Number(s.price), 0);

  const archTools = selected.map((s) => ({
    id: s.toolId, name: s.toolName, price: s.price, categoryName: s.categoryName,
  }));

  /* ── render ── */
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-76 shrink-0 border-r border-zinc-800 bg-zinc-900 overflow-y-auto" style={{ width: 300 }}>
        <div className="px-4 py-5 border-b border-zinc-800">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Categories</p>
          <h1 className="mt-1 text-sm font-bold text-zinc-100">AI Cost Estimator</h1>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-xs text-zinc-500">Loading…</div>
        ) : (
          <nav className="py-2">
            {categories.map((cat) => (
              <div key={cat.id}>
                {/* Category header */}
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
                      const tab           = activeTab(tool.id);

                      return (
                        <div key={tool.id}>
                          {/* Tool row */}
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
                              {/* Tab switcher */}
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
                                <button
                                  key={plan.id}
                                  onClick={() => upsertSelection({
                                    toolId: tool.id, toolName: tool.name, categoryName: cat.name,
                                    planId: plan.id, planName: plan.name, price: plan.price,
                                    isSelfHosted: false,
                                  })}
                                  className={`flex w-full items-start gap-2 px-3 py-2 text-[10px] rounded-md transition-colors mb-0.5 ${
                                    isSelected(tool.id, plan.id)
                                      ? "bg-indigo-700/30 text-indigo-200"
                                      : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                                  }`}
                                >
                                  {isSelected(tool.id, plan.id)
                                    ? <Check size={11} className="mt-0.5 text-indigo-400 shrink-0" />
                                    : <div className="w-[11px] shrink-0" />}
                                  <div className="text-left">
                                    <div className="font-semibold flex items-center gap-1.5">
                                      {plan.name}
                                      {plan.is_popular && (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-400 uppercase font-bold">Popular</span>
                                      )}
                                    </div>
                                    {plan.description && (
                                      <div className="text-[9px] text-zinc-500 mt-0.5 leading-tight">{plan.description}</div>
                                    )}
                                    <div className="font-mono mt-0.5">{fmtUSD(plan.price)}/mo</div>
                                  </div>
                                </button>
                              ))}

                              {/* Self-host picker */}
                              {tab === "selfhost" && selfProviders.length > 0 && (() => {
                                const provKey  = activeProvider(tool.id, selfProviders);
                                const provData = selfProviders.find((p) => p.provider === provKey);

                                return (
                                  <div>
                                    {/* Provider tabs */}
                                    <div className="flex gap-1 mb-2 flex-wrap">
                                      {selfProviders.map((prov) => (
                                        <button
                                          key={prov.provider}
                                          onClick={() => setToolProvider((p) => ({ ...p, [tool.id]: prov.provider }))}
                                          style={{ borderColor: provKey === prov.provider ? PROVIDER_COLORS[prov.provider] : "#3f3f46" }}
                                          className={`px-2 py-0.5 rounded text-[9px] font-semibold border transition-colors ${
                                            provKey === prov.provider ? "text-white" : "text-zinc-500"
                                          }`}
                                        >
                                          {prov.providerLabel}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Instances */}
                                    {provData?.instances.map((inst) => (
                                      <button
                                        key={inst.instance_id}
                                        onClick={() => upsertSelection({
                                          toolId: tool.id, toolName: tool.name, categoryName: cat.name,
                                          planId: -inst.instance_id,
                                          planName: `${provData.providerLabel} · ${inst.instance_type}`,
                                          price: inst.price_monthly,
                                          isSelfHosted: true,
                                          provider: provData.provider,
                                          instanceType: inst.instance_type,
                                        })}
                                        className={`flex w-full items-start gap-2 px-3 py-2 text-[10px] rounded-md transition-colors mb-0.5 ${
                                          isSelected(tool.id, -inst.instance_id, inst.instance_type)
                                            ? "bg-emerald-700/20 text-emerald-200"
                                            : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                                        }`}
                                      >
                                        {isSelected(tool.id, -inst.instance_id, inst.instance_type)
                                          ? <Check size={11} className="mt-0.5 text-emerald-400 shrink-0" />
                                          : <div className="w-[11px] shrink-0" />}
                                        <div className="text-left w-full">
                                          <div className="font-semibold flex items-center gap-1.5">
                                            {inst.instance_type}
                                            {inst.is_recommended && (
                                              <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-400 uppercase font-bold">Recommended</span>
                                            )}
                                          </div>
                                          <div className="text-[9px] text-zinc-500 mt-0.5">
                                            {inst.vcpu} vCPU · {inst.memory_gb} GB RAM · {inst.region}
                                          </div>
                                          {inst.notes && (
                                            <div className="text-[9px] text-zinc-600 mt-0.5 leading-tight">{inst.notes}</div>
                                          )}
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
        )}
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col lg:flex-row gap-6 p-6 overflow-auto">
        <section className="flex-1 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Tag size={16} className="text-zinc-500" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Selected Tools</h2>
            </div>

            {selected.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 py-20 text-center">
                <p className="text-zinc-500 text-sm">No tools selected yet.</p>
                <p className="text-zinc-600 text-xs mt-1">Expand tools in the sidebar and choose a plan or self-host option.</p>
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
                        <td className="px-4 py-3 text-zinc-400 text-xs">{sel.planName}</td>
                        <td className="px-4 py-3">
                          {sel.isSelfHosted ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                              <Server size={10} /> Self-hosted
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-indigo-400">
                              <Cloud size={10} /> Managed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs">{sel.categoryName}</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-200">{fmtUSD(sel.price)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setSelected((p) => p.filter((s) => s.toolId !== sel.toolId))}
                            className="text-zinc-600 hover:text-red-400 transition-colors" aria-label="Remove">
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ArchDiagram selected={archTools} />
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

            {selected.length > 0 && (
              <div className="mt-4 border-t border-indigo-800/50 pt-4 flex items-end justify-between">
                <span className="text-xs text-indigo-400">Total / month</span>
                <span className="font-mono text-2xl font-semibold text-white">{fmtUSD(total)}</span>
              </div>
            )}

            {selected.length === 0 && (
              <p className="mt-4 text-xs text-indigo-400/60 text-center">Select plans to see the total</p>
            )}

            {selected.length > 0 && (
              <div className="mt-3 rounded-lg bg-indigo-900/40 px-3 py-2 text-center">
                <p className="text-[10px] text-indigo-400/70 uppercase tracking-wider">Annual</p>
                <p className="font-mono text-sm font-medium text-indigo-200">{fmtUSD(total * 12)}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
