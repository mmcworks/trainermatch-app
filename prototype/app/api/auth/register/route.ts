import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationCodeEmail } from "@/lib/email";
import { isValidEmail, isValidCpf, isValidCnpj, isValidPhone } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      role,
      name,
      phone,
      document,
      crefOrCnpj,
      address,
      neighborhood,
      city,
      logoOrAvatar
    } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Validação de Formato do E-mail
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "Por favor, informe um endereço de e-mail válido (ex: seu.nome@email.com)." }, { status: 400 });
    }

    // 2. Checa se o e-mail já existe
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      return NextResponse.json({
        error: "Este e-mail já está cadastrado no TrainerMatch.",
        code: "EMAIL_ALREADY_EXISTS",
        email: cleanEmail
      }, { status: 409 });
    }

    const normalizedRole = role.toUpperCase() === "ACADEMIA" ? "ACADEMIA" : "PROFESSOR";

    // 3. Validação de Documento (CPF para Professor / CNPJ para Academia)
    if (normalizedRole === "PROFESSOR") {
      const docCpf = document || "";
      if (!isValidCpf(docCpf)) {
        return NextResponse.json({ error: "CPF inválido. Verifique os números digitados." }, { status: 400 });
      }
    } else {
      const docCnpj = document || crefOrCnpj || "";
      if (!isValidCnpj(docCnpj)) {
        return NextResponse.json({ error: "CNPJ inválido. Verifique os números digitados." }, { status: 400 });
      }
    }

    // 4. Validação de Telefone (se informado)
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ error: "Telefone inválido. Informe o DDD e o número com 9 dígitos." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let newUser;

    if (normalizedRole === "ACADEMIA") {
      newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: "ACADEMIA",
          name,
          phone: phone || "",
          document: document || crefOrCnpj || "",
          emailVerified: false,
          gym: {
            create: {
              name,
              cnpj: document || crefOrCnpj || "",
              phone: phone || "",
              email: cleanEmail,
              address: address || "Vitória, ES",
              neighborhood: neighborhood || "Centro",
              city: city || "Vitória",
              logo: logoOrAvatar || "",
              facadeUrl: "",
              rating: 5.0,
              ratingCount: 0,
              plan: "gratis",
              modalities: JSON.stringify(["Musculação", "Funcional"]),
              pricingRules: JSON.stringify({
                modalityRates: { "Musculação": 40, "Funcional": 45 },
                peakHourAddition: 5,
                weekendAddition: 8
              })
            }
          }
        },
        include: {
          gym: true
        }
      });
    } else {
      newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: "PROFESSOR",
          name,
          phone: phone || "",
          document: document || "",
          emailVerified: false,
          instructor: {
            create: {
              name,
              displayName: name,
              birthDate: body.birthDate || "",
              email: cleanEmail,
              phone: phone || "",
              cpf: document || "",
              cnpj: body.cnpj || "",
              cref: crefOrCnpj || "",
              avatar: logoOrAvatar || "",
              bio: "",
              rating: 5.0,
              ratingCount: 0,
              hourlyRate: 45,
              modalities: JSON.stringify([]),
              pixKeys: JSON.stringify(document ? [{ id: "pix-1", type: "cpf", key: document, isDefault: true }] : []),
              availability: JSON.stringify([]),
              blockedDateSlots: JSON.stringify([]),
              offeredSlots: JSON.stringify([]),
              notificationsEnabled: JSON.stringify({ push: true, whatsapp: true, email: true }),
              workExperiences: JSON.stringify([])
            }
          }
        },
        include: {
          instructor: true
        }
      });
    }

    // 1. Gera código criptograficamente seguro de 6 dígitos
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // 2. Remove códigos anteriores pendentes para o mesmo e-mail (caso tenha recadastrado)
    try {
      await prisma.emailVerificationCode.deleteMany({
        where: { email: cleanEmail }
      });
    } catch (cleanupErr) {
      console.warn("Aviso ao limpar códigos anteriores:", cleanupErr);
    }

    // 3. Salva novo código no banco
    await prisma.emailVerificationCode.create({
      data: {
        email: cleanEmail,
        code: verificationCode,
        expiresAt,
        attempts: 0
      }
    });

    // 4. Dispara e-mail via Resend
    const emailResult = await sendVerificationCodeEmail({
      toEmail: cleanEmail,
      code: verificationCode,
      name
    });

    // Detecta se estamos usando o domínio de testes do Resend ou se o envio falhou
    const isUsingTestingDomain = !process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL.includes("resend.dev");
    const isDemoMode = !emailResult.success || isUsingTestingDomain;

    // 5. Retorna status exigindo validação do código
    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: cleanEmail,
      name,
      role: normalizedRole.toLowerCase(),
      emailSent: emailResult.success,
      emailDeliveryError: emailResult.error || null,
      devCode: isDemoMode ? verificationCode : undefined,
      isDemoMode,
      message: emailResult.success
        ? "Conta criada com sucesso! Enviamos um código de verificação para o seu e-mail."
        : "Conta criada! Como o domínio próprio ainda não está ativo no Resend, utilize o código de segurança gerado na tela."
    });
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar conta." }, { status: 500 });
  }
}
