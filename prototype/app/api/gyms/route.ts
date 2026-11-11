import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function safeJson(val: any, fallback: any) {
  if (!val) return fallback;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const gyms = await prisma.gym.findMany({
      orderBy: { rating: "desc" }
    });

    const parsed = gyms.map((g) => ({
      ...g,
      modalities: safeJson(g.modalities, []),
      pricingRules: safeJson(g.pricingRules, undefined)
    }));

    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

