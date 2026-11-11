import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Validação real: checa se o e-mail existe no banco de dados
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "E-mail não encontrado no sistema. Verifique o endereço digitado ou realize seu cadastro.",
          code: "USER_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Código simulado para ambiente de testes e validação
    return NextResponse.json({
      success: true,
      message: "Código de segurança gerado com sucesso.",
      email: user.email,
      name: user.name,
      testCode: "849201"
    });
  } catch (error: any) {
    console.error("Erro na verificação de recuperação de senha:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao processar recuperação de senha." },
      { status: 500 }
    );
  }
}
