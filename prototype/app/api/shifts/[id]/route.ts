import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: params.id },
      include: {
        gym: true,
        confirmedInstructor: true,
        proposals: {
          include: {
            instructor: true
          }
        }
      }
    });

    if (!shift) {
      return NextResponse.json({ error: "Turno não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ...shift,
      gym: shift.gym ? {
        ...shift.gym,
        modalities: JSON.parse(shift.gym.modalities || "[]"),
        pricingRules: shift.gym.pricingRules ? JSON.parse(shift.gym.pricingRules) : undefined
      } : undefined,
      confirmedInstructor: shift.confirmedInstructor ? {
        ...shift.confirmedInstructor,
        modalities: JSON.parse(shift.confirmedInstructor.modalities || "[]"),
        pixKeys: JSON.parse(shift.confirmedInstructor.pixKeys || "[]"),
        availability: JSON.parse(shift.confirmedInstructor.availability || "[]")
      } : undefined,
      proposals: shift.proposals.map((p) => ({
        ...p,
        history: JSON.parse(p.history || "[]")
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.confirmedInstructorId !== undefined) updateData.confirmedInstructorId = body.confirmedInstructorId;
    if (body.rate !== undefined) updateData.rate = Number(body.rate);
    if (body.instructorCheckInAt !== undefined) {
      updateData.instructorCheckInAt = body.instructorCheckInAt ? new Date(body.instructorCheckInAt) : null;
    }
    if (body.gymValidatedAt !== undefined) {
      updateData.gymValidatedAt = body.gymValidatedAt ? new Date(body.gymValidatedAt) : null;
    }
    if (body.completedAt !== undefined) {
      updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    }
    if (body.cancelledBy !== undefined) updateData.cancelledBy = body.cancelledBy;
    if (body.cancelledByName !== undefined) updateData.cancelledByName = body.cancelledByName;
    if (body.cancellationReason !== undefined) updateData.cancellationReason = body.cancellationReason;
    if (body.cancelledAt !== undefined) {
      updateData.cancelledAt = body.cancelledAt ? new Date(body.cancelledAt) : null;
    }

    const updated = await prisma.shift.update({
      where: { id: params.id },
      data: updateData,
      include: {
        gym: true,
        confirmedInstructor: true
      }
    });

    return NextResponse.json({ success: true, shift: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.shift.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true, message: "Turno excluído com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
