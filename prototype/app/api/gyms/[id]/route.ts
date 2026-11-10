import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gym = await prisma.gym.findUnique({
      where: { id: params.id }
    });
    if (!gym) return NextResponse.json({ error: "Academia não encontrada" }, { status: 404 });

    return NextResponse.json({
      ...gym,
      modalities: JSON.parse(gym.modalities || "[]"),
      pricingRules: gym.pricingRules ? JSON.parse(gym.pricingRules) : undefined
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

    const updated = await prisma.gym.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      gym: {
        ...updated,
        modalities: JSON.parse(updated.modalities || "[]"),
        pricingRules: updated.pricingRules ? JSON.parse(updated.pricingRules) : undefined
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
