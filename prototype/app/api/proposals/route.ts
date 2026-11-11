import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shiftId = searchParams.get("shiftId");
    const instructorId = searchParams.get("instructorId");

    const where: any = {};
    if (shiftId) where.shiftId = shiftId;
    if (instructorId) where.instructorId = instructorId;

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        shift: {
          include: {
            gym: true
          }
        },
        instructor: true
      },
      orderBy: { createdAt: "desc" }
    });

    const parsed = proposals.map((p) => ({
      ...p,
      history: JSON.parse(p.history || "[]"),
      shift: {
        ...p.shift,
        rate: Number(p.shift.rate || 45),
        maxRate: Number(p.shift.rate || 45),
        title: `${p.shift.modality} - Aula`,
        gym: p.shift.gym ? {
          ...p.shift.gym,
          modalities: JSON.parse(p.shift.gym.modalities || "[]"),
          pricingRules: p.shift.gym.pricingRules ? JSON.parse(p.shift.gym.pricingRules) : undefined
        } : undefined
      },
      instructor: {
        ...p.instructor,
        modalities: JSON.parse(p.instructor.modalities || "[]"),
        pixKeys: JSON.parse(p.instructor.pixKeys || "[]"),
        availability: JSON.parse(p.instructor.availability || "[]")
      }
    }));

    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, proposalId, shiftId, instructorId, rate, counterRate, senderRole } = body;

    // Ação: Aceitar Proposta (Contratação)
    if (action === "accept" && proposalId) {
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: { shift: true }
      });

      if (!proposal) {
        return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
      }

      // 1. Atualiza proposta para aceita
      const updatedProposal = await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: "aceita" }
      });

      // 2. Vincula professor contratado ao turno e confirma o turno
      await prisma.shift.update({
        where: { id: proposal.shiftId },
        data: {
          status: "confirmado",
          confirmedInstructorId: proposal.instructorId,
          rate: proposal.rate
        }
      });

      // 3. Finaliza propostas concorrentes para o mesmo turno
      await prisma.proposal.updateMany({
        where: {
          shiftId: proposal.shiftId,
          id: { not: proposalId },
          status: "pendente"
        },
        data: { status: "expirada" }
      });

      return NextResponse.json({ success: true, proposal: updatedProposal });
    }

    // Ação: Recusar Proposta
    if (action === "reject" && proposalId) {
      const updatedProposal = await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: "recusada" }
      });
      return NextResponse.json({ success: true, proposal: updatedProposal });
    }

    // Ação: Contraproposta
    if (action === "counter" && proposalId && counterRate) {
      const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
      if (!proposal) return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });

      const history = JSON.parse(proposal.history || "[]");
      history.push({
        sender: senderRole || "professor",
        rate: counterRate,
        timestamp: new Date().toISOString()
      });

      const updated = await prisma.proposal.update({
        where: { id: proposalId },
        data: {
          rate: Number(counterRate),
          history: JSON.stringify(history)
        }
      });
      return NextResponse.json({ success: true, proposal: updated });
    }

    // Ação Padrão: Criar Nova Proposta / Candidatura / Convite
    if (!shiftId || !instructorId) {
      return NextResponse.json({ error: "shiftId e instructorId são obrigatórios" }, { status: 400 });
    }

    // Checa se já existe proposta para este turno e professor
    const existing = await prisma.proposal.findFirst({
      where: { shiftId, instructorId }
    });

    if (existing) {
      return NextResponse.json({ success: true, proposal: existing, alreadyExisted: true });
    }

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    const proposalRate = Number(rate) || Number(shift?.rate) || 45;

    const created = await prisma.proposal.create({
      data: {
        shiftId,
        instructorId,
        rate: proposalRate,
        status: "pendente",
        history: JSON.stringify([
          {
            sender: senderRole || "professor",
            rate: proposalRate,
            timestamp: new Date().toISOString()
          }
        ])
      },
      include: {
        shift: { include: { gym: true } },
        instructor: true
      }
    });

    // Se o turno estiver em aberto, atualiza para negociando
    if (shift && shift.status === "aberto") {
      await prisma.shift.update({
        where: { id: shiftId },
        data: { status: "negociando" }
      });
    }

    return NextResponse.json({ success: true, proposal: created });
  } catch (error: any) {
    console.error("Erro nas propostas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
