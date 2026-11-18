import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("trainer_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    if (!session?.userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        gym: true,
        instructor: true
      }
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userRole = user.role.toLowerCase() as "academia" | "professor";

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole,
        phone: user.phone,
        document: user.document,
        gym: user.gym ? {
          ...user.gym,
          managerName: (user.gym as any).managerName || "",
          managerPhone: (user.gym as any).managerPhone || "",
          managerEmail: (user.gym as any).managerEmail || "",
          managerRole: (user.gym as any).managerRole || "",
          modalities: JSON.parse(user.gym.modalities || "[]"),
          pricingRules: user.gym.pricingRules ? JSON.parse(user.gym.pricingRules) : undefined
        } : null,
        instructor: user.instructor ? {
          ...user.instructor,
          displayName: (user.instructor as any).displayName || user.instructor.name,
          birthDate: (user.instructor as any).birthDate || "",
          cnpj: (user.instructor as any).cnpj || "",
          modalities: JSON.parse(user.instructor.modalities || "[]"),
          pixKeys: JSON.parse(user.instructor.pixKeys || "[]"),
          availability: JSON.parse(user.instructor.availability || "[]"),
          blockedDates: JSON.parse((user.instructor as any).blockedDates || "[]"),
          blockedDateSlots: JSON.parse((user.instructor as any).blockedDateSlots || "[]"),
          offeredSlots: JSON.parse((user.instructor as any).offeredSlots || "[]"),
          notificationsEnabled: JSON.parse((user.instructor as any).notificationsEnabled || "{\"push\":true,\"whatsapp\":true,\"email\":true}"),
          criteria: {
            pontualidade: user.instructor.rating,
            tecnica: user.instructor.rating,
            postura: user.instructor.rating
          },
          badges: user.instructor.ratingCount > 0 ? ["Pontual", "Atencioso(a)", "Excelente Técnica"] : [],
          wouldHireAgainRate: user.instructor.ratingCount > 0 ? 98 : undefined
        } : null
      }
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 401 });
  }
}
