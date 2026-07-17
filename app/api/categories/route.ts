import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT
        c.id,
        c.name,
        COALESCE(
          json_agg(
            json_build_object(
              'id',          t.id,
              'name',        t.name,
              'description', t.description,
              'plans', (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'id',                   p.id,
                      'name',                 p.name,
                      'description',          p.description,
                      'price',                p.price,
                      'billing_cycle',        p.billing_cycle,
                      'features',             p.features,
                      'is_popular',           p.is_popular,
                      'is_token_based',       p.is_token_based,
                      'price_input_per_1m',   p.price_input_per_1m,
                      'price_output_per_1m',  p.price_output_per_1m
                    )
                    ORDER BY p.price
                  ),
                  '[]'
                )
                FROM plans p
                WHERE p.tool_id = t.id AND p.is_deleted = FALSE
              ),
              'self_hosting', (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'instance_id',   ci.id,
                      'provider',      cp.name,
                      'provider_label',cp.label,
                      'instance_type', ci.instance_type,
                      'vcpu',          ci.vcpu,
                      'memory_gb',     ci.memory_gb,
                      'price_hourly',  ci.price_hourly,
                      'price_monthly', ci.price_monthly,
                      'region',        ci.region,
                      'notes',         tsh.notes,
                      'is_recommended',tsh.is_recommended
                    )
                    ORDER BY cp.name, ci.price_monthly
                  ),
                  '[]'
                )
                FROM tool_self_hosting tsh
                JOIN cloud_instances ci ON ci.id = tsh.instance_id AND ci.is_deleted = FALSE
                JOIN cloud_providers cp ON cp.id = ci.provider_id
                WHERE tsh.tool_id = t.id
              )
            )
            ORDER BY t.name
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tools
       FROM category c
       LEFT JOIN tools t ON t.category_id = c.id AND t.is_deleted = FALSE
         AND (
           EXISTS (SELECT 1 FROM plans p WHERE p.tool_id = t.id AND p.is_deleted = FALSE)
           OR
           EXISTS (SELECT 1 FROM tool_self_hosting tsh WHERE tsh.tool_id = t.id)
         )
       WHERE c.is_deleted = FALSE
       GROUP BY c.id, c.name
       ORDER BY c.name`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
