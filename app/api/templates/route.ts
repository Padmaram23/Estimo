import { NextResponse } from "next/server";
import pool from "@/lib/db";

/* Layout constants — mirrors ArchDiagram */
const TOOL_H  = 46;
const TOOL_GAP = 10;
const CAT_PAD_X   = 14;
const CAT_PAD_TOP = 40;
const CAT_PAD_BOT = 14;
const CAT_GAP = 60;
const ENTRY_W = 140;
const ENTRY_H = 36;
const EXIT_W  = 170;
const TOOL_W = 148;

const CAT_COLORS: Record<string, { bg: string; border: string; text: string; chip: string }> = {
  "Foundation Models":          { bg: "#13123a", border: "#6366f1", text: "#a5b4fc", chip: "#6366f122" },
  "Inference Engines":          { bg: "#0d2e1a", border: "#22c55e", text: "#86efac", chip: "#22c55e22" },
  "LLM Gateways":               { bg: "#1a1308", border: "#f59e0b", text: "#fcd34d", chip: "#f59e0b22" },
  "AI Agent Frameworks":        { bg: "#0c2033", border: "#38bdf8", text: "#7dd3fc", chip: "#38bdf822" },
  "AI Orchestration Frameworks":{ bg: "#1a0c2e", border: "#a855f7", text: "#d8b4fe", chip: "#a855f722" },
  "Embedding Models":           { bg: "#1a1308", border: "#f59e0b", text: "#fcd34d", chip: "#f59e0b22" },
  "Vector Databases":           { bg: "#0c2033", border: "#38bdf8", text: "#7dd3fc", chip: "#38bdf822" },
  "Databases":                  { bg: "#0d2e1a", border: "#22c55e", text: "#86efac", chip: "#22c55e22" },
  "AI Observability":           { bg: "#1f1020", border: "#ec4899", text: "#f9a8d4", chip: "#ec489922" },
};
const DEF_COLOR = { bg: "#18181b", border: "#52525b", text: "#d4d4d8", chip: "#52525b22" };
const col = (c: string) => CAT_COLORS[c] ?? DEF_COLOR;

interface TemplateSelection {
  toolId: number; toolName: string; categoryName: string;
  planId: number | null; planName: string | null; price: number;
  isSelfHosted: boolean; provider?: string; instanceType?: string;
  isTokenBased?: boolean; inputTokensM?: number; outputTokensM?: number;
  priceInputPer1m?: number; priceOutputPer1m?: number;
  sort_order?: number;
  // resolved fields for tools with no explicit plan
  resolvedPlanId?: number | null;
  resolvedPlanName?: string | null;
  resolvedPrice?: number | null;
  resolvedIsTokenBased?: boolean | null;
  resolvedPriceInputPer1m?: number | null;
  resolvedPriceOutputPer1m?: number | null;
  resolvedIsSelfHosted?: boolean | null;
  resolvedProvider?: string | null;
  resolvedInstanceType?: string | null;
  resolvedInstancePrice?: number | null;
}

interface TemplateEdgeRow {
  source_tool: string; target_tool: string;
  label: string; edge_style: string; animated: boolean; color: string;
}

function buildDiagram(selections: TemplateSelection[], templateEdges: TemplateEdgeRow[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodes: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const edges: any[] = [];

  // Deduplicate selections by toolId — tools seeded in multiple categories can produce duplicates
  const seenToolIds = new Set<number>();
  const uniqueSelections = selections.filter((s) => {
    if (seenToolIds.has(s.toolId)) return false;
    seenToolIds.add(s.toolId);
    return true;
  });

  const groups = new Map<string, TemplateSelection[]>();
  for (const s of uniqueSelections) {
    if (!groups.has(s.categoryName)) groups.set(s.categoryName, []);
    groups.get(s.categoryName)!.push(s);
  }

  // Compute total height for vertical layout of category blocks (kept for reference)
  for (const tools of groups.values()) {
    void (CAT_PAD_TOP + tools.length * (TOOL_H + TOOL_GAP) - TOOL_GAP + CAT_PAD_BOT + CAT_GAP);
  }

  // Entry node — top-left
  nodes.push({
    id: "entry", type: "entryNode",
    position: { x: 40, y: 40 },
    data: {},
    style: { width: ENTRY_W, height: ENTRY_H },
  });

  // Exit node — far right (LR default)
  nodes.push({
    id: "exit", type: "exitNode",
    position: { x: 40 + ENTRY_W + 80 + (CAT_PAD_X * 2 + TOOL_W) + 80, y: 40 },
    data: {},
    style: { width: EXIT_W, height: ENTRY_H },
  });

  // Build tool name → id map and track first/last tools by sort_order
  const toolIdByName = new Map<string, number>();
  for (const s of uniqueSelections) toolIdByName.set(s.toolName, s.toolId);

  let offset = 0;
  for (const [catName, tools] of groups) {
    const color = col(catName);
    const catId = `cat-${catName}`;
    const h = CAT_PAD_TOP + tools.length * (TOOL_H + TOOL_GAP) - TOOL_GAP + CAT_PAD_BOT;
    const w = CAT_PAD_X * 2 + TOOL_W;

    nodes.push({
      id: catId, type: "categoryNode",
      position: { x: 40 + ENTRY_W + 80, y: offset },
      data: { label: catName, color },
      style: { width: w, height: h },
    });

    tools.forEach((tool, ti) => {
      nodes.push({
        id: `tool-${tool.toolId}`, type: "toolNode",
        parentId: catId, extent: "parent",
        position: { x: CAT_PAD_X, y: CAT_PAD_TOP + ti * (TOOL_H + TOOL_GAP) },
        data: { label: tool.toolName, price: tool.price, color },
        draggable: false,
      });
    });

    offset += h + CAT_GAP;
  }

  // Wire template edges (tool → tool)
  for (const e of templateEdges) {
    const srcId = toolIdByName.get(e.source_tool);
    const tgtId = toolIdByName.get(e.target_tool);
    if (!srcId || !tgtId) continue;
    edges.push({
      id: `tpl-${srcId}-${tgtId}`,
      source: `tool-${srcId}`,
      target: `tool-${tgtId}`,
      label: e.label || undefined,
      type: e.edge_style ?? "default",
      animated: e.animated,
      style: { stroke: e.color, strokeWidth: 1.5 },
      markerEnd: { type: "arrowclosed", color: e.color },
    });
  }

  // Wire entry → first tool and last tool → exit based on sort_order
  if (uniqueSelections.length > 0) {
    const sorted = [...uniqueSelections].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const firstTool = sorted[0];
    const lastTool  = sorted[sorted.length - 1];

    edges.push({
      id: "entry-to-first",
      source: "entry",
      target: `tool-${firstTool.toolId}`,
      animated: true,
      deletable: false,
      style: { stroke: "#22c55e", strokeWidth: 1.5 },
      markerEnd: { type: "arrowclosed", color: "#22c55e" },
    });

    edges.push({
      id: "last-to-exit",
      source: `tool-${lastTool.toolId}`,
      target: "exit",
      animated: true,
      deletable: false,
      style: { stroke: "#6366f1", strokeWidth: 1.5 },
      markerEnd: { type: "arrowclosed", color: "#6366f1" },
    });
  }

  return { nodes, edges };
}

export async function GET() {
  try {
    const [tplRows, edgeRows] = await Promise.all([
      pool.query(`
        SELECT
          t.id, t.name, t.description, t.icon, t.category,
          COALESCE(
            json_agg(
              json_build_object(
                'toolId',           ts.tool_id,
                'toolName',         ts.tool_name,
                'categoryName',     ts.category_name,
                'planId',           ts.plan_id,
                'planName',         ts.plan_name,
                'price',            ts.price,
                'sort_order',       ts.sort_order,
                'isSelfHosted',     ts.is_self_hosted,
                'provider',         ts.provider,
                'instanceType',     ts.instance_type,
                'isTokenBased',     ts.is_token_based,
                'inputTokensM',     ts.input_tokens_m,
                'outputTokensM',    ts.output_tokens_m,
                'priceInputPer1m',  ts.price_input_per_1m,
                'priceOutputPer1m', ts.price_output_per_1m,
                'resolvedPlanId',   COALESCE(ts.plan_id,   best.plan_id),
                'resolvedPlanName', COALESCE(ts.plan_name, best.plan_name),
                'resolvedPrice',    COALESCE(
                  CASE WHEN ts.plan_id IS NOT NULL THEN ts.price END,
                  best.price
                ),
                'resolvedIsTokenBased',    COALESCE(
                  CASE WHEN ts.plan_id IS NOT NULL THEN ts.is_token_based END,
                  best.is_token_based
                ),
                'resolvedPriceInputPer1m', COALESCE(
                  CASE WHEN ts.plan_id IS NOT NULL THEN ts.price_input_per_1m END,
                  best.price_input_per_1m
                ),
                'resolvedPriceOutputPer1m', COALESCE(
                  CASE WHEN ts.plan_id IS NOT NULL THEN ts.price_output_per_1m END,
                  best.price_output_per_1m
                ),
                'resolvedIsSelfHosted', COALESCE(
                  CASE WHEN ts.plan_id IS NOT NULL THEN ts.is_self_hosted END,
                  best.is_self_hosted
                ),
                'resolvedProvider',     best_sh.provider,
                'resolvedInstanceType', best_sh.instance_type,
                'resolvedInstancePrice', best_sh.price_monthly
              ) ORDER BY ts.sort_order
            ) FILTER (WHERE ts.id IS NOT NULL),
            '[]'
          ) AS selections
        FROM templates t
        LEFT JOIN template_selections ts ON ts.template_id = t.id
        -- best managed plan for this tool (popular first, else cheapest non-zero, else free)
        LEFT JOIN LATERAL (
          SELECT
            p.id       AS plan_id,
            p.name     AS plan_name,
            p.price    AS price,
            p.is_token_based,
            p.price_input_per_1m,
            p.price_output_per_1m,
            FALSE      AS is_self_hosted
          FROM plans p
          WHERE p.tool_id = ts.tool_id AND p.is_deleted = FALSE
          ORDER BY p.is_popular DESC, p.price ASC
          LIMIT 1
        ) best ON ts.plan_id IS NULL
        -- best self-host instance (recommended first, else cheapest)
        LEFT JOIN LATERAL (
          SELECT
            cp.name          AS provider,
            ci.instance_type AS instance_type,
            ci.price_monthly AS price_monthly
          FROM tool_self_hosting tsh
          JOIN cloud_instances ci ON ci.id = tsh.instance_id AND ci.is_deleted = FALSE
          JOIN cloud_providers  cp ON cp.id = ci.provider_id
          WHERE tsh.tool_id = ts.tool_id
          ORDER BY tsh.is_recommended DESC, ci.price_monthly ASC
          LIMIT 1
        ) best_sh ON ts.plan_id IS NULL AND best.plan_id IS NULL
        WHERE t.is_deleted = FALSE
        GROUP BY t.id, t.name, t.description, t.icon, t.category
        ORDER BY t.id
      `),
      pool.query(`
        SELECT template_id, source_tool, target_tool, label, edge_style, animated, color
        FROM template_edges ORDER BY id
      `),
    ]);

    const edgesByTemplate = new Map<number, TemplateEdgeRow[]>();
    for (const row of edgeRows.rows) {
      if (!edgesByTemplate.has(row.template_id)) edgesByTemplate.set(row.template_id, []);
      edgesByTemplate.get(row.template_id)!.push(row);
    }

    const result = tplRows.rows.map((tpl) => {
      const selections = tpl.selections as TemplateSelection[];
      const tplEdges   = edgesByTemplate.get(tpl.id) ?? [];

      // Compute price for token-based selections; resolve price for tools with no explicit plan
      const hydratedSelections = selections.map((s) => {
        // Tool has an explicit plan in the template
        if (s.planId) {
          if (s.isTokenBased) {
            const price =
              (s.inputTokensM ?? 0) * (s.priceInputPer1m ?? 0) +
              (s.outputTokensM ?? 0) * (s.priceOutputPer1m ?? 0);
            return { ...s, price };
          }
          return s;
        }

        // No plan in template — use resolved best plan
        if (s.resolvedPlanId) {
          if (s.resolvedIsTokenBased) {
            const price =
              (s.inputTokensM ?? 0) * (s.resolvedPriceInputPer1m ?? 0) +
              (s.outputTokensM ?? 0) * (s.resolvedPriceOutputPer1m ?? 0);
            return { ...s, planId: s.resolvedPlanId, planName: s.resolvedPlanName ?? s.planName, price, isTokenBased: true, priceInputPer1m: s.resolvedPriceInputPer1m ?? undefined, priceOutputPer1m: s.resolvedPriceOutputPer1m ?? undefined, isSelfHosted: false };
          }
          return { ...s, planId: s.resolvedPlanId, planName: s.resolvedPlanName ?? s.planName, price: s.resolvedPrice ?? 0, isSelfHosted: false };
        }

        // Fall back to best self-host instance
        if (s.resolvedProvider && s.resolvedInstanceType) {
          return { ...s, planId: s.planId, planName: `${s.resolvedProvider} · ${s.resolvedInstanceType}`, price: s.resolvedInstancePrice ?? 0, isSelfHosted: true, provider: s.resolvedProvider, instanceType: s.resolvedInstanceType };
        }

        return s;
      });

      const total_monthly = hydratedSelections.reduce((sum, s) => sum + Number(s.price), 0);

      return {
        ...tpl,
        selections: hydratedSelections,
        total_monthly,
        diagram: buildDiagram(hydratedSelections, tplEdges),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
