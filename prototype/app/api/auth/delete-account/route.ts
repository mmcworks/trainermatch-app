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

    // Busca o usuário para verificar se é professor ou academia
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { instructor: true, gym: true }
    });

    if (user?.instructor) {
      const instructorId = user.instructor.id;
      // Remove todas as propostas do professor (em especial propostas pendentes)
      await prisma.proposal.deleteMany({
        where: { instructorId }
      }).catch(() => null);
    }

    if (user?.gym) {
      const gymId = user.gym.id;
      // Remove propostas pendentes ligadas aos turnos desta academia
      await prisma.proposal.deleteMany({
        where: {
          shift: { gymId },
          status: "pendente"
        }
      }).catch(() => null);
    }

    // Remove do banco de dados (Cascade remove Gym/Instructor/Turnos do usuário)
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
