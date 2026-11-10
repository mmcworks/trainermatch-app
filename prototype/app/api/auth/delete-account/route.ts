import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("trainer_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    if (!session?.userId) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    // Remove do banco de dados SQLite (Cascade remove Gym/Instructor/Shifts/Proposals associados)
    await prisma.user.delete({
      where: { id: session.userId }
    });

    const response = NextResponse.json({
      success: true,
      message: "Conta excluída permanentemente com sucesso."
    });

    // Remove o cookie da sessão
    response.cookies.delete("trainer_session");
    return response;
  } catch (error: any) {
    console.error("Erro ao excluir conta:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao excluir conta" },
      { status: 500 }
    );
  }
}
