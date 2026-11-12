import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      role,
      name,
      phone,
      document,
      crefOrCnpj,
      address,
      neighborhood,
      city,
      logoOrAvatar
    } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Checa se o e-mail já existe
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado. Tente fazer login." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedRole = role.toUpperCase() === "ACADEMIA" ? "ACADEMIA" : "PROFESSOR";

    let newUser;

    if (normalizedRole === "ACADEMIA") {
      newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: "ACADEMIA",
          name,
          phone: phone || "",
          document: document || crefOrCnpj || "",
          gym: {
            create: {
              name,
              cnpj: document || crefOrCnpj || "",
              phone: phone || "",
              email: cleanEmail,
              address: address || "Vitória, ES",
              neighborhood: neighborhood || "Centro",
              city: city || "Vitória",
              logo: logoOrAvatar || "",
              facadeUrl: "",
              rating: 5.0,
              ratingCount: 0,
              plan: "gratis",
              modalities: JSON.stringify(["Musculação", "Funcional"]),
              pricingRules: JSON.stringify({
                modalityRates: { "Musculação": 40, "Funcional": 45 },
                peakHourAddition: 5,
                weekendAddition: 8
              })
              // 0 aulas/turnos!
            }
          }
        },
        include: {
          gym: true
        }
      });
    } else {
      newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: "PROFESSOR",
          name,
          phone: phone || "",
          document: document || "",
          instructor: {
            create: {
              name,
              email: cleanEmail,
              phone: phone || "",
              cpf: document || "",
              cref: crefOrCnpj || "",
              avatar: logoOrAvatar || "",
              bio: "",
              rating: 5.0,
              ratingCount: 0,
              hourlyRate: 45,
              modalities: JSON.stringify([]),
              pixKeys: JSON.stringify(document ? [{ id: "pix-1", type: "cpf", key: document, isDefault: true }] : []),
              availability: JSON.stringify([]) // 0 horários na grade!
            }
          }
        },
        include: {
          instructor: true
        }
      });
    }

    const createdUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        gym: true,
        instructor: true
      }
    });

    if (!createdUser) {
      return NextResponse.json({ error: "Erro ao carregar usuário criado" }, { status: 500 });
    }

    const userRole = createdUser.role.toLowerCase() as "academia" | "professor";

    const response = NextResponse.json({
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: userRole,
        phone: createdUser.phone,
        document: createdUser.document,
        gym: createdUser.gym ? {
          ...createdUser.gym,
          modalities: JSON.parse(createdUser.gym.modalities || "[]"),
          pricingRules: createdUser.gym.pricingRules ? JSON.parse(createdUser.gym.pricingRules) : undefined
        } : null,
        instructor: createdUser.instructor ? {
          ...createdUser.instructor,
          modalities: JSON.parse(createdUser.instructor.modalities || "[]"),
          pixKeys: JSON.parse(createdUser.instructor.pixKeys || "[]"),
          availability: JSON.parse(createdUser.instructor.availability || "[]")
        } : null
      }
    });

    response.cookies.set("trainer_session", JSON.stringify({
      userId: createdUser.id,
      email: createdUser.email,
      role: userRole,
      entityId: userRole === "academia" ? createdUser.gym?.id : createdUser.instructor?.id
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar conta." }, { status: 500 });
  }
}
