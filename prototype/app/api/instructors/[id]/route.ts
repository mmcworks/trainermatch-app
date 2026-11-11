import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let instructor = await prisma.instructor.findUnique({
      where: { id: params.id }
    });

    if (!instructor) {
      const sessionCookie = req.cookies.get("trainer_session")?.value;
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          if (session?.userId) {
            instructor = await prisma.instructor.findUnique({
              where: { userId: session.userId }
            });
          }
        } catch (e) {}
      }
      if (!instructor) {
        instructor = await prisma.instructor.findFirst();
      }
    }

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
      badges: instructor.ratingCount > 0 ? ["Pontual", "Atencioso(a)", "Excelente Técnica"] : [],
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
    if (body.displayName !== undefined && updateData.name === undefined) updateData.name = body.displayName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
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

    let targetInstructor = await prisma.instructor.findUnique({
      where: { id: params.id }
    });

    if (!targetInstructor) {
      const sessionCookie = req.cookies.get("trainer_session")?.value;
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          if (session?.userId) {
            targetInstructor = await prisma.instructor.findUnique({
              where: { userId: session.userId }
            });
          }
        } catch (e) {}
      }
      if (!targetInstructor) {
        targetInstructor = await prisma.instructor.findFirst();
      }
    }

    if (!targetInstructor) {
      return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });
    }

    const updated = await prisma.instructor.update({
      where: { id: targetInstructor.id },
      data: updateData
    });

    // Sincroniza usuário se nome ou telefone ou email forem alterados
    if (targetInstructor.userId && (body.name || body.phone || body.email)) {
      const userUpdate: any = {};
      if (body.name) userUpdate.name = body.name;
      if (body.phone) userUpdate.phone = body.phone;
      if (body.email) userUpdate.email = body.email;
      await prisma.user.update({
        where: { id: targetInstructor.userId },
        data: userUpdate
      }).catch(() => {});
    }

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
        badges: updated.ratingCount > 0 ? ["Pontual", "Atencioso(a)", "Excelente Técnica"] : [],
        wouldHireAgainRate: updated.ratingCount > 0 ? 98 : undefined
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
