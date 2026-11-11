import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        gym: true,
        instructor: true
      }
    });

    // Se o banco estiver conectado mas ainda não tiver os usuários padrão semeados
    if (!user && (cleanEmail === "movagym@email.com" || cleanEmail === "lucasf@email.com")) {
      try {
        const defaultHash = await bcrypt.hash("12345qwe", 10);
        if (cleanEmail === "movagym@email.com") {
          user = await prisma.user.create({
            data: {
              email: "movagym@email.com",
              passwordHash: defaultHash,
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
            },
            include: { gym: true, instructor: true }
          });
        } else if (cleanEmail === "lucasf@email.com") {
          user = await prisma.user.create({
            data: {
              email: "lucasf@email.com",
              passwordHash: defaultHash,
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
            },
            include: { gym: true, instructor: true }
          });
        }
      } catch (err: any) {
        console.warn("Auto-criação de usuário demo falhou:", err?.message);
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado. Verifique seu e-mail ou cadastre-se." }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: "Senha incorreta. Tente novamente." }, { status: 401 });
    }

    const userRole = user.role.toLowerCase() as "academia" | "professor";

    // Se o usuário especificou o perfil e não bate com a conta
    if (role && role.toLowerCase() !== userRole) {
      return NextResponse.json({
        error: `Esta conta está registrada como ${userRole === "academia" ? "Academia" : "Professor"}. Alterne a aba para entrar.`
      }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole,
        phone: user.phone,
        document: user.document,
        gym: user.gym ? {
          ...user.gym,
          modalities: JSON.parse(user.gym.modalities || "[]"),
          pricingRules: user.gym.pricingRules ? JSON.parse(user.gym.pricingRules) : undefined
        } : null,
        instructor: user.instructor ? {
          ...user.instructor,
          modalities: JSON.parse(user.instructor.modalities || "[]"),
          pixKeys: JSON.parse(user.instructor.pixKeys || "[]"),
          availability: JSON.parse(user.instructor.availability || "[]")
        } : null
      }
    });

    // Configura cookie de sessão HTTP seguro
    response.cookies.set("trainer_session", JSON.stringify({
      userId: user.id,
      email: user.email,
      role: userRole,
      entityId: userRole === "academia" ? user.gym?.id : user.instructor?.id
    }), {
      httpOnly: false, // acessível no cliente para hidratação do store
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30 // 30 dias
    });

    return response;
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: error.message || "Erro interno no servidor" }, { status: 500 });
  }
}
