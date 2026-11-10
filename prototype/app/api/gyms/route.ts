import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const gyms = await prisma.gym.findMany({
      orderBy: { rating: "desc" }
    });

    const parsed = gyms.map((g) => ({
      ...g,
      modalities: JSON.parse(g.modalities || "[]"),
      pricingRules: g.pricingRules ? JSON.parse(g.pricingRules) : undefined
    }));

    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
