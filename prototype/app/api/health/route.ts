import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);

  if (!hasDbUrl) {
    return NextResponse.json({
      status: "degraded",
      database: {
        configured: false,
        message: "A variável de ambiente DATABASE_URL não está configurada na Vercel. O aplicativo está operando em modo offline / fallback de navegador (localStorage)."
      }
    }, { status: 200 });
  }

  try {
    const [userCount, gymCount, instructorCount, shiftCount] = await Promise.all([
      prisma.user.count(),
      prisma.gym.count(),
      prisma.instructor.count(),
      prisma.shift.count()
    ]);



    return NextResponse.json({
      status: "healthy",
      database: {
        configured: true,
        connected: true,
        users: userCount,
        gyms: gymCount,
        instructors: instructorCount,
        shifts: shiftCount
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      database: {
        configured: true,
        connected: false,
        error: error.message
      }
    }, { status: 500 });
  }
}
