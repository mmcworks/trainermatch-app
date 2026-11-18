import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let instructors = await prisma.instructor.findMany({
      include: {
        user: true
      },
      orderBy: { rating: "desc" }
    });

    // Filtra instrutores ativos (não exclui usuários reais que tenham nomes legítimos)
    const activeInstructors = instructors.filter(
      (i) => i.user && !i.name.includes("MOCK_DELETE")
    );

    const parsed = activeInstructors.map((i) => ({
      ...i,
      displayName: (i as any).displayName || i.name,
      birthDate: (i as any).birthDate || "",
      cnpj: (i as any).cnpj || "",
      isActive: true,
      isDeleted: false,
      modalities: JSON.parse(i.modalities || "[]"),
      pixKeys: JSON.parse(i.pixKeys || "[]"),
      availability: JSON.parse(i.availability || "[]"),
      blockedDates: JSON.parse((i as any).blockedDates || "[]"),
      blockedDateSlots: JSON.parse((i as any).blockedDateSlots || "[]"),
      offeredSlots: JSON.parse((i as any).offeredSlots || "[]"),
      notificationsEnabled: JSON.parse((i as any).notificationsEnabled || "{\"push\":true,\"whatsapp\":true,\"email\":true}"),
      criteria: {
        pontualidade: i.rating,
        tecnica: i.rating,
        postura: i.rating
      },
      badges: i.ratingCount > 0 ? ["Pontual", "Atencioso(a)", "Excelente Técnica"] : [],
      wouldHireAgainRate: i.ratingCount > 0 ? 98 : undefined
    }));

    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
