"use client";

import { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  Panel,
  BackgroundVariant,
  Handle,
  Position,
  type NodeProps,
  MarkerType,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Network, ArrowRight, ArrowDown, LayoutGrid,
  Pencil, Trash2, X, ArrowLeftRight,
} from "lucide-react";

/* ─── types ─────────────────────────────────────────────────── */
interface Tool { id: number; name: string; price: number }
interface SelectedTool extends Tool { categoryName: string }
interface Props {
  selected: SelectedTool[];
  initialEdges?: Edge[];
  initialDir?: Direction;
  readOnly?: boolean;
  onChange?: () => void;
}

export interface ArchDiagramHandle {
  getDiagram: () => { nodes: Node[]; edges: Edge[]; dir: Direction };
}
type Direction = "LR" | "TB";
type EdgeStyle = "default" | "straight" | "step" | "smoothstep";

/* ─── colours ───────────────────────────────────────────────── */
const CAT_COLORS: Record<string, { bg: string; border: string; text: string; chip: string }> = {
  "AI & LLM":     { bg: "#13123a", border: "#6366f1", text: "#a5b4fc", chip: "#6366f122" },
  Infrastructure: { bg: "#0d2e1a", border: "#22c55e", text: "#86efac", chip: "#22c55e22" },
  Storage:        { bg: "#1a1308", border: "#f59e0b", text: "#fcd34d", chip: "#f59e0b22" },
  Monitoring:     { bg: "#0c2033", border: "#38bdf8", text: "#7dd3fc", chip: "#38bdf822" },
};
const DEF_COLOR = { bg: "#18181b", border: "#52525b", text: "#d4d4d8", chip: "#52525b22" };
const col = (c: string) => CAT_COLORS[c] ?? DEF_COLOR;
type Color = typeof DEF_COLOR;

const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

/* ─── tool node ─────────────────────────────────────────────── */
function ToolNode({ data }: NodeProps) {
  const d = data as { label: string; price: number; color: Color };
  return (
    <div style={{
      background: "#09090b", border: `1px solid ${d.color.border}55`,
      borderRadius: 6, padding: "6px 10px", minWidth: 130, position: "relative",
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: d.color.border, width: 9, height: 9, border: "none", cursor: "crosshair" }} />
      <div style={{ fontSize: 10, fontWeight: 600, color: "#e4e4e7" }}>{d.label}</div>
      <div style={{
        fontSize: 9, marginTop: 3, display: "inline-block", fontFamily: "monospace",
        color: d.color.text, background: d.color.chip, borderRadius: 4, padding: "1px 5px",
      }}>
        {fmtUSD(d.price)}/mo
      </div>
      <Handle type="source" position={Position.Right}
        style={{ background: d.color.border, width: 9, height: 9, border: "none", cursor: "crosshair" }} />
    </div>
  );
}

/* ─── category node ─────────────────────────────────────────── */
function CategoryNode({ data }: NodeProps) {
  const d = data as { label: string; color: Color };
  return (
    <div style={{
      width: "100%", height: "100%",
      border: `1.5px solid ${d.color.border}`, borderRadius: 10, background: d.color.bg,
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: d.color.border, width: 8, height: 8, border: "none" }} />
      <Handle type="target" position={Position.Top}
        style={{ background: d.color.border, width: 8, height: 8, border: "none" }} />
      <div style={{
        padding: "7px 12px 5px", borderBottom: `1px solid ${d.color.border}33`,
        fontSize: 11, fontWeight: 700, color: d.color.text,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: d.color.border, display: "inline-block",
        }} />
        {d.label}
      </div>
    </div>
  );
}

/* ─── entry node ─────────────────────────────────────────────── */
function EntryNode() {
  return (
    <div style={{
      background: "#052e16", border: "1.5px solid #22c55e",
      borderRadius: 20, padding: "6px 18px", position: "relative",
      display: "flex", alignItems: "center", gap: 6,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: "#22c55e", display: "inline-block", flexShrink: 0,
      }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#86efac" }}>User / Input</span>
      <Handle type="source" position={Position.Right}
        style={{ background: "#22c55e", width: 9, height: 9, border: "none" }} />
      <Handle type="source" position={Position.Bottom}
        style={{ background: "#22c55e", width: 9, height: 9, border: "none" }} />
    </div>
  );
}

/* ─── exit node ──────────────────────────────────────────────── */
function ExitNode() {
  return (
    <div style={{
      background: "#1e1b4b", border: "1.5px solid #6366f1",
      borderRadius: 20, padding: "6px 18px", position: "relative",
      display: "flex", alignItems: "center", gap: 6,
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: "#6366f1", width: 9, height: 9, border: "none" }} />
      <Handle type="target" position={Position.Top}
        style={{ background: "#6366f1", width: 9, height: 9, border: "none" }} />
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: "#6366f1", display: "inline-block", flexShrink: 0,
      }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#c7d2fe" }}>Response / Output</span>
    </div>
  );
}

const nodeTypes = { toolNode: ToolNode, categoryNode: CategoryNode, entryNode: EntryNode, exitNode: ExitNode };

/* ─── layout constants ───────────────────────────────────────── */
const TOOL_W = 148;
const TOOL_H  = 46;
const TOOL_GAP = 10;
const CAT_PAD_X   = 14;
const CAT_PAD_TOP = 40;
const CAT_PAD_BOT = 14;
const CAT_GAP = 60;
const ENTRY_W = 140;
const ENTRY_H = 36;
const EXIT_W  = 170;
const EXIT_H  = 36;

/* build only the nodes/edges for ONE category + its tools */
function buildCategoryNodes(
  catName: string,
  tools: SelectedTool[],
  catIndex: number,
  dir: Direction,
  existingCatPos?: { x: number; y: number },
): Node[] {
  const color = col(catName);
  const catId = `cat-${catName}`;
  const h = CAT_PAD_TOP + tools.length * (TOOL_H + TOOL_GAP) - TOOL_GAP + CAT_PAD_BOT;
  const w = CAT_PAD_X * 2 + TOOL_W;

  const isLR = dir === "LR";
  const defaultPos = isLR
    ? { x: 40 + ENTRY_W + 80, y: catIndex * (h + CAT_GAP) }
    : { x: catIndex * (w + CAT_GAP), y: 40 + ENTRY_H + 80 };

  const catPos = existingCatPos ?? defaultPos;

  const nodes: Node[] = [{
    id: catId,
    type: "categoryNode",
    position: catPos,
    data: { label: catName, color },
    style: { width: w, height: h },
  }];

  tools.forEach((tool, ti) => {
    nodes.push({
      id: `tool-${tool.id}`,
      type: "toolNode",
      parentId: catId,
      extent: "parent",
      position: { x: CAT_PAD_X, y: CAT_PAD_TOP + ti * (TOOL_H + TOOL_GAP) },
      data: { label: tool.name, price: tool.price, color },
      draggable: false,
    });
  });

  return nodes;
}

function entryNode(dir: Direction): Node {
  return {
    id: "entry",
    type: "entryNode",
    position: dir === "LR" ? { x: 40, y: 40 } : { x: 40, y: 40 },
    data: {},
    style: { width: ENTRY_W, height: ENTRY_H },
  };
}

function exitNode(dir: Direction, catCount: number, totalH: number): Node {
  const isLR = dir === "LR";
  return {
    id: "exit",
    type: "exitNode",
    position: isLR
      ? { x: 40 + ENTRY_W + 80 + (CAT_PAD_X * 2 + TOOL_W) + 80, y: 40 }
      : { x: 40, y: 40 + ENTRY_H + 80 + totalH + 80 },
    data: {},
    style: { width: EXIT_W, height: EXIT_H },
  };
}


/* ─── edge edit panel ────────────────────────────────────────── */
interface EdgePanelProps {
  edge: Edge;
  onUpdate: (id: string, patch: Partial<Edge>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const EDGE_TYPES: { value: EdgeStyle; label: string }[] = [
  { value: "default",    label: "Curved" },
  { value: "straight",   label: "Straight" },
  { value: "step",       label: "Step" },
  { value: "smoothstep", label: "Smooth step" },
];

const EDGE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#38bdf8", "#f43f5e", "#a855f7", "#e4e4e7"];

function EdgePanel({ edge, onUpdate, onDelete, onClose }: EdgePanelProps) {
  const hasMarker = !!(edge.markerEnd as { type?: MarkerType } | undefined)?.type;
  const currentColor = (edge.style?.stroke as string) ?? "#6366f1";
  const currentType  = (edge.type as EdgeStyle) ?? "default";
  const label        = (edge.label as string) ?? "";

  return (
    <div style={{
      position: "absolute", top: 10, right: 10, zIndex: 10,
      background: "#18181b", border: "1px solid #3f3f46",
      borderRadius: 10, padding: "12px 14px", width: 230,
      boxShadow: "0 4px 24px #00000060",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Edit Connection
        </span>
        <button onClick={onClose} style={{ color: "#52525b", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
          <X size={14} />
        </button>
      </div>

      {/* Label */}
      <label style={{ fontSize: 10, color: "#71717a", display: "block", marginBottom: 4 }}>Label</label>
      <input
        value={label}
        onChange={(e) => onUpdate(edge.id, { label: e.target.value })}
        placeholder="e.g. calls, reads from…"
        style={{
          width: "100%", background: "#09090b", border: "1px solid #3f3f46",
          borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#e4e4e7",
          marginBottom: 10, boxSizing: "border-box", outline: "none",
        }}
      />

      {/* Line type */}
      <label style={{ fontSize: 10, color: "#71717a", display: "block", marginBottom: 4 }}>Line style</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 10 }}>
        {EDGE_TYPES.map(({ value, label: lbl }) => (
          <button
            key={value}
            onClick={() => onUpdate(edge.id, { type: value })}
            style={{
              fontSize: 10, padding: "4px 6px", borderRadius: 5, cursor: "pointer",
              border: `1px solid ${currentType === value ? "#6366f1" : "#3f3f46"}`,
              background: currentType === value ? "#312e81" : "#09090b",
              color: currentType === value ? "#c7d2fe" : "#a1a1aa",
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Colour */}
      <label style={{ fontSize: 10, color: "#71717a", display: "block", marginBottom: 4 }}>Colour</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {EDGE_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onUpdate(edge.id, {
              style: { ...edge.style, stroke: c },
              markerEnd: hasMarker ? { type: MarkerType.ArrowClosed, color: c } : undefined,
            })}
            style={{
              width: 18, height: 18, borderRadius: "50%", background: c, cursor: "pointer",
              border: currentColor === c ? "2px solid #fff" : "2px solid transparent",
            }}
          />
        ))}
      </div>

      {/* Direction arrow toggle */}
      <label style={{ fontSize: 10, color: "#71717a", display: "block", marginBottom: 4 }}>Arrow</label>
      <button
        onClick={() => onUpdate(edge.id, {
          markerEnd: hasMarker
            ? undefined
            : { type: MarkerType.ArrowClosed, color: currentColor },
        })}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 10, padding: "5px 10px", borderRadius: 6, cursor: "pointer",
          border: `1px solid ${hasMarker ? "#6366f1" : "#3f3f46"}`,
          background: hasMarker ? "#312e81" : "#09090b",
          color: hasMarker ? "#c7d2fe" : "#a1a1aa",
          marginBottom: 10, width: "100%",
        }}
      >
        <ArrowLeftRight size={12} />
        {hasMarker ? "Arrow on (click to remove)" : "Arrow off (click to add)"}
      </button>

      {/* Animated toggle */}
      <button
        onClick={() => onUpdate(edge.id, { animated: !edge.animated })}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 10, padding: "5px 10px", borderRadius: 6, cursor: "pointer",
          border: `1px solid ${edge.animated ? "#6366f1" : "#3f3f46"}`,
          background: edge.animated ? "#312e81" : "#09090b",
          color: edge.animated ? "#c7d2fe" : "#a1a1aa",
          marginBottom: 12, width: "100%",
        }}
      >
        Animated: {edge.animated ? "on" : "off"}
      </button>

      {/* Delete */}
      <button
        onClick={() => { onDelete(edge.id); onClose(); }}
        style={{
          display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
          width: "100%", fontSize: 10, padding: "5px 10px", borderRadius: 6, cursor: "pointer",
          border: "1px solid #7f1d1d", background: "#1c0a0a", color: "#f87171",
        }}
      >
        <Trash2 size={12} /> Delete connection
      </button>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────── */
const ArchDiagram = forwardRef<ArchDiagramHandle, Props>(function ArchDiagram(
  { selected, initialEdges, initialDir, readOnly = false, onChange }, ref
) {
  const [dir, setDir] = useState<Direction>(initialDir ?? "LR");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges ?? []);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  useImperativeHandle(ref, () => ({
    getDiagram: () => ({ nodes, edges, dir }),
  }), [nodes, edges, dir]);

  // Track which category names and tool ids are currently in the diagram
  const prevCatNames = useRef<Set<string>>(new Set());
  const prevToolIds  = useRef<Set<number>>(new Set());
  const catIndexRef  = useRef<Map<string, number>>(new Map());

  // Incremental sync — only add/remove deltas, never reset existing positions/edges
  useEffect(() => {
    const groups = new Map<string, SelectedTool[]>();
    for (const t of selected) {
      if (!groups.has(t.categoryName)) groups.set(t.categoryName, []);
      groups.get(t.categoryName)!.push(t);
    }

    const newCatNames = new Set(groups.keys());
    const newToolIds  = new Set(selected.map((t) => t.id));

    // ── removals ──
    const removedCats  = [...prevCatNames.current].filter((c) => !newCatNames.has(c));
    const removedTools = [...prevToolIds.current].filter((id) => !newToolIds.has(id));

    const removeIds = new Set<string>([
      ...removedCats.map((c) => `cat-${c}`),
      ...removedTools.map((id) => `tool-${id}`),
    ]);

    if (removeIds.size > 0) {
      setNodes((ns) => ns.filter((n) => !removeIds.has(n.id)));
      setEdges((es) => es.filter((e) => !removeIds.has(e.id) && !removeIds.has(e.source) && !removeIds.has(e.target)));
    }

    // ── additions ──
    const addedCats  = [...newCatNames].filter((c) => !prevCatNames.current.has(c));
    const addedTools = selected.filter((t) => !prevToolIds.current.has(t.id));

    // Assign stable index for new categories
    addedCats.forEach((c) => {
      if (!catIndexRef.current.has(c)) {
        catIndexRef.current.set(c, catIndexRef.current.size);
      }
    });

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Entry + Exit nodes — always ensure they exist
    setNodes((ns) => {
      let updated = ns;
      const hasEntry = ns.some((n) => n.id === "entry");
      const hasExit  = ns.some((n) => n.id === "exit");
      // Compute total height for exit positioning in TB mode
      let totalH = 0;
      for (const tools of groups.values()) {
        totalH += CAT_PAD_TOP + tools.length * (TOOL_H + TOOL_GAP) - TOOL_GAP + CAT_PAD_BOT + CAT_GAP;
      }
      if (!hasEntry && selected.length > 0) updated = [entryNode(dir), ...updated];
      if (!hasExit  && selected.length > 0) updated = [...updated, exitNode(dir, groups.size, totalH)];
      return updated;
    });

    // Add new categories (no auto-connections — user draws their own edges)
    addedCats.forEach((catName) => {
      const tools = groups.get(catName)!;
      const idx = catIndexRef.current.get(catName)!;
      const catNodes = buildCategoryNodes(catName, tools, idx, dir);
      newNodes.push(...catNodes);
    });

    // Add tools that belong to existing categories (category already in diagram)
    const newToolsInExistingCats = addedTools.filter(
      (t) => !addedCats.includes(t.categoryName)
    );
    if (newToolsInExistingCats.length > 0) {
      newToolsInExistingCats.forEach((tool) => {
        const color = col(tool.categoryName);
        const catTools = groups.get(tool.categoryName)!;
        const ti = catTools.findIndex((t) => t.id === tool.id);
        const catId = `cat-${tool.categoryName}`;

        // Update category height
        const h = CAT_PAD_TOP + catTools.length * (TOOL_H + TOOL_GAP) - TOOL_GAP + CAT_PAD_BOT;
        setNodes((ns) =>
          ns.map((n) =>
            n.id === catId ? { ...n, style: { ...n.style, height: h } } : n
          )
        );

        newNodes.push({
          id: `tool-${tool.id}`,
          type: "toolNode",
          parentId: catId,
          extent: "parent",
          position: { x: CAT_PAD_X, y: CAT_PAD_TOP + ti * (TOOL_H + TOOL_GAP) },
          data: { label: tool.name, price: tool.price, color },
          draggable: false,
        });
      });
    }

    if (newNodes.length > 0) setNodes((ns) => [...ns, ...newNodes]);
    if (newEdges.length > 0) setEdges((es) => {
      // On first load, merge saved edges with auto-generated hub edges
      // (initialEdges already seeded via useEdgesState, so just append new hub edges)
      const existingIds = new Set(es.map((e) => e.id));
      const fresh = newEdges.filter((e) => !existingIds.has(e.id));
      return fresh.length > 0 ? [...es, ...fresh] : es;
    });

    prevCatNames.current = newCatNames;
    prevToolIds.current  = newToolIds;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Direction change: reposition only category nodes that haven't been manually moved
  const handleDirChange = (newDir: Direction) => {
    setDir(newDir);
    setNodes((ns) => {
      // compute total height for exit node TB positioning
      let totalH = 0;
      const catNodes = ns.filter((n) => n.id.startsWith("cat-"));
      catNodes.forEach((n) => { totalH += ((n.style?.height as number) ?? 120) + CAT_GAP; });

      return ns.map((n) => {
        if (n.id === "entry") {
          return { ...n, position: { x: 40, y: 40 } };
        }
        if (n.id === "exit") {
          const isLR = newDir === "LR";
          return {
            ...n,
            position: isLR
              ? { x: 40 + ENTRY_W + 80 + (CAT_PAD_X * 2 + TOOL_W) + 80, y: 40 }
              : { x: 40, y: 40 + ENTRY_H + 80 + totalH + 80 },
          };
        }
        if (!n.id.startsWith("cat-")) return n;
        const catName = n.id.replace("cat-", "");
        const idx = catIndexRef.current.get(catName) ?? 0;
        const h = (n.style?.height as number) ?? 120;
        const w = (n.style?.width as number) ?? 180;
        const isLR = newDir === "LR";
        const newPos = isLR
          ? { x: 40 + ENTRY_W + 80, y: idx * (h + CAT_GAP) }
          : { x: idx * (w + CAT_GAP), y: 40 + ENTRY_H + 80 };
        return { ...n, position: newPos };
      });
    });
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({
          ...connection,
          animated: true,
          type: "default",
          style: { stroke: "#6366f1", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
        }, eds)
      );
      onChange?.();
    },
    [setEdges, onChange]
  );

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
  }, []);

  const onPaneClick = useCallback(() => setSelectedEdge(null), []);

  const updateEdge = useCallback((id: string, patch: Partial<Edge>) => {
    setEdges((eds) =>
      eds.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
    setSelectedEdge((prev) => prev && prev.id === id ? { ...prev, ...patch } : prev);
    onChange?.();
  }, [setEdges, onChange]);

  const deleteEdge = useCallback((id: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== id));
    onChange?.();
  }, [setEdges, onChange]);

  // Keep selectedEdge in sync with edges state
  useEffect(() => {
    if (!selectedEdge) return;
    setEdges((eds) => {
      const updated = eds.find((e) => e.id === selectedEdge.id);
      if (updated) setSelectedEdge(updated);
      return eds;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges.length]);

  const handleEdgeChanges = useCallback((changes: EdgeChange[]) => {
    // Unselect edge panel when backspace-deleted
    const deletions = changes.filter((c) => c.type === "remove");
    if (deletions.length > 0 && selectedEdge) {
      const ids = deletions.map((c) => c.id);
      if (ids.includes(selectedEdge.id)) setSelectedEdge(null);
    }
    onEdgesChange(changes);
  }, [onEdgesChange, selectedEdge]);

  if (selected.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 py-14 text-center">
        <Network size={28} className="text-zinc-600 mb-2" strokeWidth={1.5} />
        <p className="text-zinc-500 text-sm">Architecture diagram will appear here.</p>
        <p className="text-zinc-600 text-xs mt-1">Select tools from the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      {/* toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Network size={15} className="text-zinc-500" strokeWidth={1.75} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Architecture Diagram
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {!readOnly && selectedEdge && (
            <span className="flex items-center gap-1 text-[10px] text-indigo-400">
              <Pencil size={10} /> Editing connection
            </span>
          )}
          <div className="flex items-center gap-1 rounded-lg border border-zinc-700 p-0.5">
            <button
              onClick={() => handleDirChange("LR")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
                dir === "LR" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ArrowRight size={12} /> Horizontal
            </button>
            <button
              onClick={() => handleDirChange("TB")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
                dir === "TB" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ArrowDown size={12} /> Vertical
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 520, position: "relative" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgeChanges}
          onConnect={readOnly ? undefined : onConnect}
          onEdgeClick={readOnly ? undefined : onEdgeClick}
          onPaneClick={onPaneClick}
          onNodeDragStop={readOnly ? undefined : () => onChange?.()}
          nodeTypes={nodeTypes}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          colorMode="dark"
          deleteKeyCode={readOnly ? null : "Backspace"}
          elevateEdgesOnSelect
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
          <Controls />
          <MiniMap
            nodeColor={(n) =>
              n.id === "entry" ? "#22c55e" :
              n.id === "exit"  ? "#6366f1" :
              n.id.startsWith("cat-") ? "#27272a" : "#09090b"
            }
            style={{ background: "#18181b", border: "1px solid #27272a" }}
          />
          <Panel position="bottom-left">
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 text-[10px] text-zinc-500 flex items-center gap-1.5">
              <LayoutGrid size={11} />
              Drag blocks · Draw connections between tool handles · Click edge to edit · Backspace to delete
            </div>
          </Panel>
        </ReactFlow>

        {/* Edge edit panel */}
        {selectedEdge && (
          <EdgePanel
            edge={selectedEdge}
            onUpdate={updateEdge}
            onDelete={deleteEdge}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </div>
    </div>
  );
});

export default ArchDiagram;