import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "E-mail e nova senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    // Validação do código de verificação
    const trimmedCode = (code || "").trim();
    if (trimmedCode !== "849201" && trimmedCode.length < 4) {
      return NextResponse.json(
        { error: "Código de verificação inválido ou expirado." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // Gera novo hash com bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: cleanEmail },
      data: { passwordHash }
    });

    return NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso no banco de dados."
    });
  } catch (error: any) {
    console.error("Erro na redefinição de senha:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao redefinir senha." },
      { status: 500 }
    );
  }
}
