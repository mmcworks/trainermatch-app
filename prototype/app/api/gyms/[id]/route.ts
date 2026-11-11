import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeJson(val: any, fallback: any) {
  if (!val) return fallback;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let gym = await prisma.gym.findUnique({
      where: { id: params.id }
    });

    if (!gym) {
      const sessionCookie = req.cookies.get("trainer_session")?.value;
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          if (session?.userId) {
            gym = await prisma.gym.findUnique({
              where: { userId: session.userId }
            });
          }
        } catch (e) {}
      }
      if (!gym) {
        gym = await prisma.gym.findFirst();
      }
    }

    if (!gym) return NextResponse.json({ error: "Academia não encontrada" }, { status: 404 });

    return NextResponse.json({
      ...gym,
      modalities: safeJson(gym.modalities, []),
      pricingRules: safeJson(gym.pricingRules, undefined)
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
    if (body.cnpj !== undefined) updateData.cnpj = body.cnpj;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.neighborhood !== undefined) updateData.neighborhood = body.neighborhood;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.facadeUrl !== undefined) updateData.facadeUrl = body.facadeUrl;
    if (body.plan !== undefined) updateData.plan = body.plan;

    if (body.modalities !== undefined) {
      updateData.modalities = typeof body.modalities === "string" ? body.modalities : JSON.stringify(body.modalities);
    }
    if (body.pricingRules !== undefined) {
      updateData.pricingRules = typeof body.pricingRules === "string" ? body.pricingRules : JSON.stringify(body.pricingRules);
    }

    let targetGym = await prisma.gym.findUnique({
      where: { id: params.id }
    });

    if (!targetGym) {
      const sessionCookie = req.cookies.get("trainer_session")?.value;
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          if (session?.userId) {
            targetGym = await prisma.gym.findUnique({
              where: { userId: session.userId }
            });
          }
        } catch (e) {}
      }
      if (!targetGym) {
        targetGym = await prisma.gym.findFirst();
      }
    }

    if (!targetGym) {
      return NextResponse.json({ error: "Academia não encontrada" }, { status: 404 });
    }

    const updated = await prisma.gym.update({
      where: { id: targetGym.id },
      data: updateData
    });

    // Sincroniza usuário se nome, telefone ou email forem alterados
    if (targetGym.userId && (body.name || body.phone || body.email)) {
      const userUpdate: any = {};
      if (body.name) userUpdate.name = body.name;
      if (body.phone) userUpdate.phone = body.phone;
      if (body.email) userUpdate.email = body.email;
      await prisma.user.update({
        where: { id: targetGym.userId },
        data: userUpdate
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      gym: {
        ...updated,
        modalities: safeJson(updated.modalities, []),
        pricingRules: safeJson(updated.pricingRules, undefined)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
