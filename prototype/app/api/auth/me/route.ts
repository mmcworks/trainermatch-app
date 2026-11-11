import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
          modalities: JSON.parse(user.gym.modalities || "[]"),
          pricingRules: user.gym.pricingRules ? JSON.parse(user.gym.pricingRules) : undefined
        } : null,
        instructor: user.instructor ? {
          ...user.instructor,
          modalities: JSON.parse(user.instructor.modalities || "[]"),
          pixKeys: JSON.parse(user.instructor.pixKeys || "[]"),
          availability: JSON.parse(user.instructor.availability || "[]"),
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
