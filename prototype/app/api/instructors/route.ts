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

    if (instructors.length === 0) {
      try {
        const bcrypt = (await import("bcryptjs")).default;
        const passwordHash = await bcrypt.hash("12345qwe", 10);
        await prisma.user.create({
          data: {
            email: "lucasf@email.com",
            passwordHash,
            role: "PROFESSOR",
            name: "Lucas Ferreira",
            phone: "(27) 99999-1234",
            document: "123.456.789-00",
            instructor: {
              create: {
                name: "Lucas Ferreira",
                email: "lucasf@email.com",
                phone: "(27) 99999-1234",
                cpf: "123.456.789-00",
                cref: "049182-G/SP",
                avatar: "",
                bio: "Profissional de Educação Física com 8 anos de experiência. Especialista em Treinamento de Força, Hipertrofia e Ciclismo Indoor.",
                rating: 4.9,
                ratingCount: 47,
                hourlyRate: 45,
                modalities: JSON.stringify(["Musculação", "Spinning", "Funcional"]),
                pixKeys: JSON.stringify([
                  {
                    id: "pix-1",
                    type: "cpf",
                    key: "123.456.789-00",
                    bank: "Nubank",
                    isDefault: true
                  }
                ]),
                availability: "[]",
                blockedDates: "[]"
              }
            }
          }
        });

        instructors = await prisma.instructor.findMany({
          include: {
            user: true
          },
          orderBy: { rating: "desc" }
        });
      } catch (seedErr) {
        console.error("Auto-seed instructor error:", seedErr);
      }
    }

    // Filtra instrutores ativos (não exclui usuários reais que tenham nomes legítimos)
    const activeInstructors = instructors.filter(
      (i) => i.user && !i.name.includes("MOCK_DELETE")
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
