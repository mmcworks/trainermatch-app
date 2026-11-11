import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gymId = searchParams.get("gymId");
    const status = searchParams.get("status");

    const where: any = {};
    if (gymId) where.gymId = gymId;
    if (status) where.status = status;

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        gym: true,
        confirmedInstructor: true,
        proposals: {
          include: {
            instructor: true
          }
        }
      },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" }
      ]
    });

    const parsedShifts = shifts.map((s) => ({
      ...s,
      rate: Number(s.rate || 45),
      maxRate: Number(s.rate || 45),
      title: `${s.modality} - Aula`,
      gym: s.gym ? {
        ...s.gym,
        modalities: JSON.parse(s.gym.modalities || "[]"),
        pricingRules: s.gym.pricingRules ? JSON.parse(s.gym.pricingRules) : undefined
      } : undefined,
      confirmedInstructor: s.confirmedInstructor ? {
        ...s.confirmedInstructor,
        modalities: JSON.parse(s.confirmedInstructor.modalities || "[]"),
        pixKeys: JSON.parse(s.confirmedInstructor.pixKeys || "[]"),
        availability: JSON.parse(s.confirmedInstructor.availability || "[]")
      } : undefined,
      proposals: s.proposals.map((p) => ({
        ...p,
        history: JSON.parse(p.history || "[]"),
        instructor: {
          ...p.instructor,
          modalities: JSON.parse(p.instructor.modalities || "[]"),
          pixKeys: JSON.parse(p.instructor.pixKeys || "[]"),
          availability: JSON.parse(p.instructor.availability || "[]")
        }
      }))
    }));

    return NextResponse.json(parsedShifts);
  } catch (error: any) {
    console.error("Erro ao listar turnos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Criação em lote (grade semanal / múltiplos horários)
    if (Array.isArray(body.shifts)) {
      const createdShifts = [];
      for (const item of body.shifts) {
        const itemRate = Number(item.rate ?? item.maxRate ?? 45);
        const created = await prisma.shift.create({
          data: {
            gymId: item.gymId,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            modality: item.modality,
            rate: itemRate,
            status: item.status || "aberto"
          }
        });
        createdShifts.push({
          ...created,
          rate: created.rate,
          maxRate: created.rate,
          title: `${created.modality} - Aula`
        });
      }
      return NextResponse.json({ success: true, count: createdShifts.length, shifts: createdShifts });
    }

    // Criação individual
    const shiftData = body.shift || body;
    if (!shiftData.gymId || !shiftData.date || !shiftData.startTime || !shiftData.endTime || !shiftData.modality) {
      return NextResponse.json({ error: "Dados incompletos para criação do turno" }, { status: 400 });
    }

    const calculatedRate = Number(shiftData.rate ?? shiftData.maxRate ?? 45);

    const created = await prisma.shift.create({
      data: {
        gymId: shiftData.gymId,
        date: shiftData.date,
        startTime: shiftData.startTime,
        endTime: shiftData.endTime,
        modality: shiftData.modality,
        rate: calculatedRate,
        status: shiftData.status || "aberto"
      },
      include: {
        gym: true
      }
    });

    return NextResponse.json({
      success: true,
      shift: {
        ...created,
        rate: created.rate,
        maxRate: created.rate,
        title: `${created.modality} - Aula`
      }
    });
  } catch (error: any) {
    console.error("Erro ao criar turno:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
