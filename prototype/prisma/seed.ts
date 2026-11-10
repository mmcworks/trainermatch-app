import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Limpa registros anteriores para garantir inicialização limpa
  await prisma.proposal.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.gym.deleteMany({});
  await prisma.instructor.deleteMany({});
  await prisma.user.deleteMany({});

  const saltRounds = 10;
  const commonPasswordHash = await bcrypt.hash("12345qwe", saltRounds);

  // 1. Usuário Academia: movagym@email.com
  const gymUser = await prisma.user.create({
    data: {
      email: "movagym@email.com",
      passwordHash: commonPasswordHash,
      role: "ACADEMIA",
      name: "Academia Mova",
      phone: "(27) 99881-2233",
      document: "12.345.678/0001-90",
      gym: {
        create: {
          name: "Academia Mova",
          cnpj: "12.345.678/0001-90",
          phone: "(27) 99881-2233",
          email: "movagym@email.com",
          address: "Rua das Palmeiras, 120, Praia do Canto, Vitória - ES",
          neighborhood: "Praia do Canto",
          city: "Vitória",
          logo: "",
          facadeUrl: "",
          rating: 4.8,
          ratingCount: 32,
          plan: "essencial",
          modalities: JSON.stringify(["Musculação", "Spinning", "Funcional", "Pilates"]),
          pricingRules: JSON.stringify({
            modalityRates: {
              "Musculação": 40,
              "Spinning": 55,
              "Funcional": 45,
              "Pilates": 50
            },
            peakHourAddition: 5,
            weekendAddition: 8
          })
          // Nenhuma aula e nenhum horário cadastrado!
        }
      }
    },
    include: {
      gym: true
    }
  });

  console.log(`✓ Academia criada: ${gymUser.email} (ID da Academia: ${gymUser.gym?.id})`);

  // 2. Usuário Professor: lucasf@email.com
  const instructorUser = await prisma.user.create({
    data: {
      email: "lucasf@email.com",
      passwordHash: commonPasswordHash,
      role: "PROFESSOR",
      name: "Lucas Ferreira",
      phone: "(27) 99999-1234",
      document: "123.456.789-00",
      instructor: {
        create: {
          name: "Lucas Ferreira",
          email: "lucasf@email.com",
          phone: "(27) 99999-1234",
          cpf: "123.456.789-00",
          cref: "049182-G/SP",
          avatar: "",
          bio: "Profissional de Educação Física com 8 anos de experiência. Especialista em Treinamento de Força, Hipertrofia e Ciclismo Indoor.",
          rating: 4.9,
          ratingCount: 47,
          hourlyRate: 45,
          modalities: JSON.stringify(["Musculação", "Spinning", "Funcional"]),
          pixKeys: JSON.stringify([
            {
              id: "pix-1",
              type: "cpf",
              key: "123.456.789-00",
              bank: "Nubank",
              isDefault: true
            }
          ]),
          availability: JSON.stringify([]) // Grade semanal zerada/limpa!
          // Nenhuma aula agendada!
        }
      }
    },
    include: {
      instructor: true
    }
  });

  console.log(`✓ Professor criado: ${instructorUser.email} (ID do Professor: ${instructorUser.instructor?.id})`);
  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
