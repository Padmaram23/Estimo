"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Cloud, Server, Receipt, Tag, Pencil,
} from "lucide-react";
import ArchDiagram, { type ArchDiagramHandle } from "@/app/components/ArchDiagram";
import type { Edge } from "@xyflow/react";

interface SelectedItem {
  toolId: number; toolName: string; categoryName: string;
  planId: number; planName: string; price: number;
  isSelfHosted: boolean; provider?: string; instanceType?: string;
  isTokenBased?: boolean; inputTokensM?: number; outputTokensM?: number;
  priceInputPer1m?: number; priceOutputPer1m?: number;
}

const fmtUSD = (n: number) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [project, setProject] = useState<{ id: number; name: string; description: string; share_edit: boolean } | null>(null);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [initEdges, setInitEdges] = useState<Edge[] | undefined>(undefined);
  const [initDir, setInitDir] = useState<"LR" | "TB" | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const diagramRef = useRef<ArchDiagramHandle>(null);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); setLoading(false); return; }
        setProject({ id: data.id, name: data.name, description: data.description ?? "", share_edit: data.share_edit });
        if (data.selections) setSelected(data.selections);
        if (data.diagram?.edges) setInitEdges(data.diagram.edges);
        if (data.diagram?.dir)   setInitDir(data.diagram.dir);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [token]);

  const total = selected.reduce((sum, s) => sum + Number(s.price), 0);
  const archTools = selected.map((s) => ({
    id: s.toolId, name: s.toolName, price: s.price, categoryName: s.categoryName,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
        Loading…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400 text-sm">This share link is invalid or has been revoked.</p>
        <button onClick={() => router.push("/")} className="text-indigo-400 text-xs hover:underline flex items-center gap-1">
          <ArrowLeft size={12} /> Go home
        </button>
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
            <h1 className="text-sm font-bold text-zinc-100">{project?.name}</h1>
            {project?.description && <p className="text-[10px] text-zinc-500">{project.description}</p>}
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-500">
            {project?.share_edit ? "View & Edit" : "View only"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-white">
            {fmtUSD(total)}<span className="text-zinc-500 font-normal">/mo</span>
          </span>
          {project?.share_edit && (
            <button
              onClick={() => router.push(`/projects/${project.id}`)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Pencil size={13} /> Edit project
            </button>
          )}
        </div>
      </header>

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
                <p className="text-zinc-500 text-sm">No tools in this project.</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {selected.map((sel) => (
                      <tr key={sel.toolId} className="border-b border-zinc-800/60 last:border-0">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Diagram (read-only — no onConnect, no edge editing) */}
          <ArchDiagram
            ref={diagramRef}
            selected={archTools}
            initialEdges={initEdges}
            initialDir={initDir}
            readOnly
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
                    {sel.isSelfHosted
                      ? <Server size={9} className="text-emerald-400 shrink-0" />
                      : <Cloud size={9} className="text-indigo-400 shrink-0" />}
                    {sel.toolName}
                  </span>
                  <span className="font-mono text-indigo-200 shrink-0">{fmtUSD(sel.price)}</span>
                </div>
              ))}
            </div>
            {selected.length > 0 && (
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
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
