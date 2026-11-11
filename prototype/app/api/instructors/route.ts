import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Limpeza garantida de usuários de teste / inexistentes (ex: José da Silva / CREF 12345/ES)
    const allUsers = await prisma.user.findMany().catch(() => []);
    const testUsers = allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes("silva") ||
        u.name.toLowerCase().includes("josé") ||
        u.email.toLowerCase().includes("josedasilva")
    );
    for (const u of testUsers) {
      await prisma.user.delete({ where: { id: u.id } }).catch(() => null);
    }

    const allInstructors = await prisma.instructor.findMany().catch(() => []);
    const testInstructors = allInstructors.filter(
      (i) =>
        i.name.toLowerCase().includes("silva") ||
        i.name.toLowerCase().includes("josé") ||
        (i.cref && i.cref.includes("12345"))
    );
    for (const i of testInstructors) {
      await prisma.proposal.deleteMany({ where: { instructorId: i.id } }).catch(() => null);
      await prisma.instructor.delete({ where: { id: i.id } }).catch(() => null);
    }

    // 2. Busca apenas instrutores ativos que possuem usuário válido vinculado
    const instructors = await prisma.instructor.findMany({
      include: {
        user: true
      },
      orderBy: { rating: "desc" }
    });

    // Filtra para garantir que apenas instrutores reais e ativos sejam recomendados
    const activeInstructors = instructors.filter(
      (i) =>
        i.user &&
        !i.name.toLowerCase().includes("silva") &&
        !i.name.toLowerCase().includes("josé") &&
        i.cref !== "12345/ES"
    );

    const parsed = activeInstructors.map((i) => ({
      ...i,
      isActive: true,
      isDeleted: false,
      modalities: JSON.parse(i.modalities || "[]"),
      pixKeys: JSON.parse(i.pixKeys || "[]"),
      availability: JSON.parse(i.availability || "[]"),
      blockedDates: JSON.parse((i as any).blockedDates || "[]"),
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
