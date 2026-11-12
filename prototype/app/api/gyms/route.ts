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
    let gyms = await prisma.gym.findMany({
      orderBy: { rating: "desc" }
    });

    if (gyms.length === 0) {
      try {
        const bcrypt = (await import("bcryptjs")).default;
        const passwordHash = await bcrypt.hash("12345qwe", 10);
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
                logo: "",
                facadeUrl: "",
                rating: 4.8,
                ratingCount: 32,
                plan: "essencial",
                modalities: JSON.stringify(["Musculação", "Spinning", "Funcional", "Pilates"]),
                pricingRules: JSON.stringify({
                  modalityRates: {
                    "Musculação": 40,
                    "Spinning": 55,
                    "Funcional": 45,
                    "Pilates": 50
                  },
                  peakHourAddition: 5,
                  weekendAddition: 8
                })
              }
            }
          }
        });

        gyms = await prisma.gym.findMany({
          orderBy: { rating: "desc" }
        });
      } catch (seedErr) {
        console.error("Auto-seed gym error:", seedErr);
      }
    }

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

