import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);

  if (!hasDbUrl) {
    return NextResponse.json({
      status: "degraded",
      database: {
        configured: false,
        message: "A variável de ambiente DATABASE_URL não está configurada na Vercel. O aplicativo está operando em modo offline / fallback de navegador (localStorage)."
      }
    }, { status: 200 });
  }

  try {
    const [userCount, gymCount, instructorCount, shiftCount] = await Promise.all([
      prisma.user.count(),
      prisma.gym.count(),
      prisma.instructor.count(),
      prisma.shift.count()
    ]);

    // Se o banco estiver conectado mas completamente vazio, inicializa com os usuários de teste
    if (userCount === 0) {
      try {
        const passwordHash = await bcrypt.hash("12345qwe", 10);
        
        // Cria usuário Academia
        await prisma.user.create({
          data: {
            email: "movagym@email.com",
            passwordHash,
            role: "ACADEMIA",
            name: "Academia Mova",
            phone: "(27) 99881-2233",
            document: "12.345.678/0001-90",
            gym: {
              create: {
                name: "Academia Mova",
                cnpj: "12.345.678/0001-90",
                phone: "(27) 99881-2233",
                email: "movagym@email.com",
                address: "Rua das Palmeiras, 120, Praia do Canto, Vitória - ES",
                neighborhood: "Praia do Canto",
                city: "Vitória",
                rating: 4.8,
                ratingCount: 32,
                plan: "essencial",
                modalities: JSON.stringify(["Musculação", "Spinning", "Funcional", "Pilates"]),
                pricingRules: JSON.stringify({
                  modalityRates: { "Musculação": 40, "Spinning": 55, "Funcional": 45, "Pilates": 50 },
                  peakHourAddition: 5,
                  weekendAddition: 8
                })
              }
            }
          }
        });

        // Cria usuário Professor
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
                bio: "Profissional de Educação Física com 8 anos de experiência.",
                rating: 4.9,
                ratingCount: 47,
                hourlyRate: 45,
                modalities: JSON.stringify(["Musculação", "Spinning", "Funcional"]),
                pixKeys: JSON.stringify([
                  { id: "pix-1", type: "cpf", key: "123.456.789-00", bank: "Nubank", isDefault: true }
                ]),
                availability: JSON.stringify([])
              }
            }
          }
        });
      } catch (seedErr: any) {
        console.warn("Auto-seed falhou:", seedErr.message);
      }
    }

    return NextResponse.json({
      status: "healthy",
      database: {
        configured: true,
        connected: true,
        users: userCount,
        gyms: gymCount,
        instructors: instructorCount,
        shifts: shiftCount
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      database: {
        configured: true,
        connected: false,
        error: error.message
      }
    }, { status: 500 });
  }
}
