import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendVerificationCodeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Por favor, informe um endereço de e-mail válido." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verifica se o usuário existe no sistema
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, name: true, emailVerified: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado. Verifique o e-mail ou realize seu cadastro." },
        { status: 404 }
      );
    }

    // Se já foi validado anteriormente, avisa amigavelmente
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Sua conta já está validada! Você pode fazer login diretamente." },
        { status: 400 }
      );
    }

    // 2. Rate-limiting: verifica se houve disparo nos últimos 60 segundos
    const recentCode = await prisma.emailVerificationCode.findFirst({
      where: { email: cleanEmail },
      orderBy: { createdAt: "desc" }
    });

    if (recentCode) {
      const timeSinceLastSend = Date.now() - new Date(recentCode.createdAt).getTime();
      const COOLDOWN_MS = 60 * 1000; // 60 segundos
      if (timeSinceLastSend < COOLDOWN_MS) {
        const remainingSec = Math.ceil((COOLDOWN_MS - timeSinceLastSend) / 1000);
        return NextResponse.json(
          { error: `Aguarde ${remainingSec} segundo${remainingSec > 1 ? "s" : ""} antes de solicitar um novo código.` },
          { status: 429 }
        );
      }
    }

    // 3. Gera novo código de 6 dígitos
    const newCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Remove registros anteriores
    try {
      await prisma.emailVerificationCode.deleteMany({
        where: { email: cleanEmail }
      });
    } catch (cleanupErr) {
      console.warn("Aviso ao limpar códigos anteriores no reenvio:", cleanupErr);
    }

    // Salva novo código
    await prisma.emailVerificationCode.create({
      data: {
        email: cleanEmail,
        code: newCode,
        expiresAt,
        attempts: 0
      }
    });

    // 4. Dispara e-mail
    const emailResult = await sendVerificationCodeEmail({
      toEmail: cleanEmail,
      code: newCode,
      name: user.name
    });

    const isUsingTestingDomain = !process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL.includes("resend.dev");
    const isDemoMode = !emailResult.success || isUsingTestingDomain;

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      emailDeliveryError: emailResult.error || null,
      devCode: isDemoMode ? newCode : undefined,
      isDemoMode,
      message: emailResult.success
        ? "Novo código de verificação enviado com sucesso para seu e-mail!"
        : "Novo código de segurança gerado para teste!"
    });
  } catch (error: any) {
    console.error("Erro no reenvio de código:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao reenviar código de verificação." },
      { status: 500 }
    );
  }
}
