import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    }

    if (!instructor) return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });

    return NextResponse.json({
      ...instructor,
      displayName: (instructor as any).displayName || instructor.name,
      birthDate: (instructor as any).birthDate || "",
      cnpj: (instructor as any).cnpj || "",
      modalities: JSON.parse(instructor.modalities || "[]"),
      pixKeys: JSON.parse(instructor.pixKeys || "[]"),
      availability: JSON.parse(instructor.availability || "[]"),
      blockedDates: JSON.parse((instructor as any).blockedDates || "[]"),
      blockedDateSlots: JSON.parse((instructor as any).blockedDateSlots || "[]"),
      offeredSlots: JSON.parse((instructor as any).offeredSlots || "[]"),
      notificationsEnabled: JSON.parse((instructor as any).notificationsEnabled || "{\"push\":true,\"whatsapp\":true,\"email\":true}"),
      workExperiences: JSON.parse((instructor as any).workExperiences || "[]"),
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
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.birthDate !== undefined) updateData.birthDate = body.birthDate;
    if (body.cnpj !== undefined) updateData.cnpj = body.cnpj;
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
    if (body.blockedDateSlots !== undefined) {
      updateData.blockedDateSlots = typeof body.blockedDateSlots === "string" ? body.blockedDateSlots : JSON.stringify(body.blockedDateSlots);
    }
    if (body.offeredSlots !== undefined) {
      updateData.offeredSlots = typeof body.offeredSlots === "string" ? body.offeredSlots : JSON.stringify(body.offeredSlots);
    }
    if (body.notificationsEnabled !== undefined) {
      updateData.notificationsEnabled = typeof body.notificationsEnabled === "string" ? body.notificationsEnabled : JSON.stringify(body.notificationsEnabled);
    }
    if (body.workExperiences !== undefined) {
      updateData.workExperiences = typeof body.workExperiences === "string" ? body.workExperiences : JSON.stringify(body.workExperiences);
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
    }

    if (!targetInstructor) {
      targetInstructor = await prisma.instructor.findFirst();
    }

    if (!targetInstructor) {
      return NextResponse.json({ error: "Professor não encontrado para atualização" }, { status: 404 });
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

    const response = NextResponse.json({
      success: true,
      instructor: {
        ...updated,
        displayName: (updated as any).displayName || updated.name,
        birthDate: (updated as any).birthDate || body.birthDate || "",
        cnpj: (updated as any).cnpj || "",
        modalities: JSON.parse(updated.modalities || "[]"),
        pixKeys: JSON.parse(updated.pixKeys || "[]"),
        availability: JSON.parse(updated.availability || "[]"),
        blockedDates: JSON.parse((updated as any).blockedDates || "[]"),
        blockedDateSlots: JSON.parse((updated as any).blockedDateSlots || "[]"),
        offeredSlots: JSON.parse((updated as any).offeredSlots || "[]"),
        notificationsEnabled: JSON.parse((updated as any).notificationsEnabled || "{\"push\":true,\"whatsapp\":true,\"email\":true}"),
        workExperiences: JSON.parse((updated as any).workExperiences || "[]"),
        criteria: {
          pontualidade: updated.rating,
          tecnica: updated.rating,
          postura: updated.rating
        },
        badges: updated.ratingCount > 0 ? ["Pontual", "Atencioso(a)", "Excelente Técnica"] : [],
        wouldHireAgainRate: updated.ratingCount > 0 ? 98 : undefined
      }
    });

    if (targetInstructor.userId) {
      response.cookies.set("trainer_session", JSON.stringify({
        userId: targetInstructor.userId,
        email: updated.email,
        role: "professor",
        entityId: updated.id
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
