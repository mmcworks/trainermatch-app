import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const instructors = await prisma.instructor.findMany({
      orderBy: { rating: "desc" }
    });

    const parsed = instructors.map((i) => ({
      ...i,
      modalities: JSON.parse(i.modalities || "[]"),
      pixKeys: JSON.parse(i.pixKeys || "[]"),
      availability: JSON.parse(i.availability || "[]"),
      blockedDates: JSON.parse((i as any).blockedDates || "[]"),
      criteria: {
        pontualidade: i.rating,
        tecnica: i.rating,
        postura: i.rating
      },
      badges: i.ratingCount > 0 ? ["Pontualidade Britânica", "Super Atencioso", "Excelente Técnica"] : [],
      wouldHireAgainRate: i.ratingCount > 0 ? 98 : undefined
    }));

    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
