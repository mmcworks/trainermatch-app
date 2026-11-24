import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "E-mail e código de verificação são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    // 1. Busca o código de verificação mais recente para o e-mail
    const verificationRecord = await prisma.emailVerificationCode.findFirst({
      where: { email: cleanEmail },
      orderBy: { createdAt: "desc" }
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { error: "Nenhum código pendente encontrado para este e-mail. Solicite um novo código." },
        { status: 400 }
      );
    }

    // 2. Verifica se o código expirou (15 minutos)
    if (new Date() > verificationRecord.expiresAt) {
      return NextResponse.json(
        { error: "Este código expirou. Clique em 'Reenviar código' para receber um novo." },
        { status: 400 }
      );
    }

    // 3. Verifica limite de tentativas (segurança contra força bruta)
    if (verificationRecord.attempts >= 5) {
      return NextResponse.json(
        { error: "Limite de tentativas excedido para este código. Solicite um novo código." },
        { status: 400 }
      );
    }

    // 4. Confere se os dígitos conferem
    if (verificationRecord.code !== cleanCode) {
      await prisma.emailVerificationCode.update({
        where: { id: verificationRecord.id },
        data: { attempts: { increment: 1 } }
      });

      const remainingAttempts = 4 - verificationRecord.attempts;
      const attemptWarning = remainingAttempts > 0 
        ? ` (${remainingAttempts} tentativa${remainingAttempts > 1 ? "s" : ""} restante${remainingAttempts > 1 ? "s" : ""})`
        : "";

      return NextResponse.json(
        { error: `Código de verificação incorreto.${attemptWarning}` },
        { status: 400 }
      );
    }

    // 5. Sucesso! Marca o usuário como verificado
    const user = await prisma.user.update({
      where: { email: cleanEmail },
      data: { emailVerified: true },
      include: {
        gym: true,
        instructor: true
      }
    });

    // 6. Limpa todos os códigos de verificação pendentes para este e-mail
    try {
      await prisma.emailVerificationCode.deleteMany({
        where: { email: cleanEmail }
      });
    } catch (cleanupErr) {
      console.warn("Aviso ao limpar códigos pós-validação:", cleanupErr);
    }

    const userRole = user.role.toLowerCase() as "academia" | "professor";

    // 7. Retorna o usuário autenticado e grava o cookie de sessão
    const response = NextResponse.json({
      success: true,
      message: "E-mail validado com sucesso!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole,
        phone: user.phone,
        document: user.document,
        gym: user.gym ? {
          ...user.gym,
          managerName: (user.gym as any).managerName || "",
          managerPhone: (user.gym as any).managerPhone || "",
          managerEmail: (user.gym as any).managerEmail || "",
          managerRole: (user.gym as any).managerRole || "",
          modalities: JSON.parse(user.gym.modalities || "[]"),
          pricingRules: user.gym.pricingRules ? JSON.parse(user.gym.pricingRules) : undefined
        } : null,
        instructor: user.instructor ? {
          ...user.instructor,
          displayName: (user.instructor as any).displayName || user.instructor.name,
          birthDate: (user.instructor as any).birthDate || "",
          cnpj: (user.instructor as any).cnpj || "",
          modalities: JSON.parse(user.instructor.modalities || "[]"),
          pixKeys: JSON.parse(user.instructor.pixKeys || "[]"),
          availability: JSON.parse(user.instructor.availability || "[]"),
          blockedDates: JSON.parse((user.instructor as any).blockedDates || "[]"),
          blockedDateSlots: JSON.parse((user.instructor as any).blockedDateSlots || "[]"),
          offeredSlots: JSON.parse((user.instructor as any).offeredSlots || "[]"),
          notificationsEnabled: JSON.parse((user.instructor as any).notificationsEnabled || "{\"push\":true,\"whatsapp\":true,\"email\":true}"),
          workExperiences: JSON.parse((user.instructor as any).workExperiences || "[]")
        } : null
      }
    });

    response.cookies.set("trainer_session", JSON.stringify({
      userId: user.id,
      email: user.email,
      role: userRole,
      entityId: userRole === "academia" ? user.gym?.id : user.instructor?.id
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30 // 30 dias
    });

    return response;
  } catch (error: any) {
    console.error("Erro ao validar e-mail:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao processar validação do código." },
      { status: 500 }
    );
  }
}
