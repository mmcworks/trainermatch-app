import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: params.id }
    });
    if (!instructor) return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });

    return NextResponse.json({
      ...instructor,
      modalities: JSON.parse(instructor.modalities || "[]"),
      pixKeys: JSON.parse(instructor.pixKeys || "[]"),
      availability: JSON.parse(instructor.availability || "[]"),
      criteria: {
        pontualidade: instructor.rating,
        tecnica: instructor.rating,
        postura: instructor.rating
      },
      badges: instructor.ratingCount > 0 ? ["Pontualidade Britânica", "Super Atencioso", "Excelente Técnica"] : [],
      wouldHireAgainRate: instructor.ratingCount > 0 ? 98 : undefined
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

    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.cref !== undefined) updateData.cref = body.cref;
    if (body.cpf !== undefined) updateData.cpf = body.cpf;
    if (body.hourlyRate !== undefined) updateData.hourlyRate = Number(body.hourlyRate);

    if (body.modalities !== undefined) {
      updateData.modalities = typeof body.modalities === "string" ? body.modalities : JSON.stringify(body.modalities);
    }
    if (body.pixKeys !== undefined) {
      updateData.pixKeys = typeof body.pixKeys === "string" ? body.pixKeys : JSON.stringify(body.pixKeys);
    }
    if (body.availability !== undefined) {
      updateData.availability = typeof body.availability === "string" ? body.availability : JSON.stringify(body.availability);
    }
    if (body.blockedDates !== undefined) {
      updateData.blockedDates = typeof body.blockedDates === "string" ? body.blockedDates : JSON.stringify(body.blockedDates);
    }

    const updated = await prisma.instructor.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      instructor: {
        ...updated,
        modalities: JSON.parse(updated.modalities || "[]"),
        pixKeys: JSON.parse(updated.pixKeys || "[]"),
        availability: JSON.parse(updated.availability || "[]"),
        blockedDates: JSON.parse((updated as any).blockedDates || "[]"),
        criteria: {
          pontualidade: updated.rating,
          tecnica: updated.rating,
          postura: updated.rating
        },
        badges: updated.ratingCount > 0 ? ["Pontualidade Britânica", "Super Atencioso", "Excelente Técnica"] : [],
        wouldHireAgainRate: updated.ratingCount > 0 ? 98 : undefined
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
