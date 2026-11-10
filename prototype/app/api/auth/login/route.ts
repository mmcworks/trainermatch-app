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

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        gym: true,
        instructor: true
      }
    });

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
