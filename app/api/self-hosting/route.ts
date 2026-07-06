import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT
        cp.name        AS provider,
        cp.label       AS provider_label,
        cp.logo_key,
        ci.id          AS instance_id,
        ci.instance_type,
        ci.vcpu,
        ci.memory_gb,
        ci.price_hourly,
        ci.price_monthly,
        ci.region,
        tsh.tool_id,
        tsh.notes,
        tsh.is_recommended,
        t.name         AS tool_name
      FROM tool_self_hosting tsh
      JOIN cloud_instances ci   ON ci.id = tsh.instance_id  AND ci.is_deleted = FALSE
      JOIN cloud_providers cp   ON cp.id = ci.provider_id
      JOIN tools t              ON t.id  = tsh.tool_id      AND t.is_deleted = FALSE
      ORDER BY t.name, cp.name, ci.price_monthly
    `);

    // Group by tool → provider → instances
    const map = new Map<number, {
      toolId: number;
      toolName: string;
      providers: Map<string, {
        provider: string;
        providerLabel: string;
        logoKey: string;
        instances: {
          instanceId: number;
          instanceType: string;
          vcpu: number;
          memoryGb: number;
          priceHourly: number;
          priceMonthly: number;
          region: string;
          notes: string;
          isRecommended: boolean;
        }[];
      }>;
    }>();

    for (const row of rows) {
      if (!map.has(row.tool_id)) {
        map.set(row.tool_id, { toolId: row.tool_id, toolName: row.tool_name, providers: new Map() });
      }
      const tool = map.get(row.tool_id)!;
      if (!tool.providers.has(row.provider)) {
        tool.providers.set(row.provider, {
          provider: row.provider,
          providerLabel: row.provider_label,
          logoKey: row.logo_key,
          instances: [],
        });
      }
      tool.providers.get(row.provider)!.instances.push({
        instanceId: row.instance_id,
        instanceType: row.instance_type,
        vcpu: Number(row.vcpu),
        memoryGb: Number(row.memory_gb),
        priceHourly: Number(row.price_hourly),
        priceMonthly: Number(row.price_monthly),
        region: row.region,
        notes: row.notes,
        isRecommended: row.is_recommended,
      });
    }

    const result = [...map.values()].map((t) => ({
      toolId: t.toolId,
      toolName: t.toolName,
      providers: [...t.providers.values()],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch self-hosting options" }, { status: 500 });
  }
}
