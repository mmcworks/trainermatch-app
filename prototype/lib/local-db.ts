import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export interface DbData {
  users: any[];
  gyms: any[];
  instructors: any[];
  shifts: any[];
  proposals: any[];
}

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NODE_ENV === "production"
);
const DATA_DIR = IS_SERVERLESS ? path.join("/tmp", "trainer-data") : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "app-db.json");

let memoryDb: DbData | null = null;

function getDefaultData(): DbData {
  const defaultHash = bcrypt.hashSync("12345qwe", 10);

  const lucasUserId = "user-lucas-1";
  const movaUserId = "user-mova-1";

  const defaultInstructor = {
    id: "inst-1",
    userId: lucasUserId,
    name: "Lucas Ferreira",
    displayName: "Lucas Ferreira",
    email: "lucasf@email.com",
    phone: "(27) 99999-1234",
    cpf: "123.456.789-00",
    cnpj: "",
    cref: "049182-G/SP",
    avatar: "",
    bio: "Profissional de Educação Física com 8 anos de experiência em treinamento funcional e musculação.",
    birthDate: "1994-06-15",
    rating: 4.9,
    ratingCount: 47,
    hourlyRate: 45,
    minHourlyRate: 40,
    allowNegotiation: true,
    modalities: JSON.stringify(["Musculação", "Funcional", "Spinning"]),
    pixKeys: JSON.stringify([
      { id: "pix-1", type: "cpf", key: "123.456.789-00", bank: "Nubank", isDefault: true }
    ]),
    availability: JSON.stringify([]),
    blockedDates: JSON.stringify([]),
    blockedDateSlots: JSON.stringify([]),
    offeredSlots: JSON.stringify([]),
    notificationsEnabled: JSON.stringify({ push: true, whatsapp: true, email: true }),
    workExperiences: JSON.stringify([]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const defaultGym = {
    id: "gym-1",
    userId: movaUserId,
    name: "Academia Mova",
    cnpj: "14.285.912/0001-44",
    phone: "(27) 99881-2233",
    email: "movagym@email.com",
    address: "Rua das Palmeiras, 120, Praia do Canto, Vitória - ES",
    neighborhood: "Praia do Canto",
    city: "Vitória",
    logo: "",
    facadeUrl: "",
    managerName: "Carlos Eduardo Silva",
    managerRole: "Coordenador Geral / Sócio",
    managerPhone: "(27) 99812-4455",
    managerEmail: "carlos.gerencia@movafit.com.br",
    rating: 4.8,
    ratingCount: 32,
    plan: "essencial",
    modalities: JSON.stringify(["Musculação", "Spinning", "Funcional", "Pilates"]),
    pricingRules: JSON.stringify({
      modalityRates: { "Musculação": 40, "Spinning": 55, "Funcional": 45, "Pilates": 50 },
      peakHourAddition: 5,
      weekendAddition: 8
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const defaultUsers = [
    {
      id: lucasUserId,
      email: "lucasf@email.com",
      passwordHash: defaultHash,
      role: "PROFESSOR",
      name: "Lucas Ferreira",
      phone: "(27) 99999-1234",
      document: "123.456.789-00",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: movaUserId,
      email: "movagym@email.com",
      passwordHash: defaultHash,
      role: "ACADEMIA",
      name: "Academia Mova",
      phone: "(27) 99881-2233",
      document: "14.285.912/0001-44",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  return {
    users: defaultUsers,
    gyms: [defaultGym],
    instructors: [defaultInstructor],
    shifts: [],
    proposals: []
  };
}

export function readDb(): DbData {
  if (memoryDb && memoryDb.instructors && memoryDb.instructors.length > 0) {
    return memoryDb;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getDefaultData();
      try { fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8"); } catch (e) {}
      memoryDb = initial;
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(content);
    if (!data.instructors || data.instructors.length === 0) {
      const initial = getDefaultData();
      data.instructors = initial.instructors;
      data.gyms = initial.gyms;
      data.users = initial.users;
      try { writeDb(data); } catch (e) {}
    }
    memoryDb = data;
    return data;
  } catch (err) {
    console.error("[local-db] Erro ao ler banco local:", err);
    if (!memoryDb) memoryDb = getDefaultData();
    return memoryDb;
  }
}

export function writeDb(data: DbData): void {
  memoryDb = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[local-db] Erro ao gravar banco local no disco (mantido em memória):", err);
  }
}

function matchWhere(item: any, where: any): boolean {
  if (!where) return true;
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;
    if (typeof val === "object" && val !== null) {
      if ("in" in val && Array.isArray((val as any).in)) {
        if (!(val as any).in.includes(item[key])) return false;
        continue;
      }
      if ("not" in val) {
        if (item[key] === (val as any).not) return false;
        continue;
      }
    }
    if (item[key] !== val) return false;
  }
  return true;
}

export function createModelClient<T extends { id: string }>(tableName: keyof DbData) {
  return {
    findMany: async (args?: { where?: any; include?: any; orderBy?: any }) => {
      const db = readDb();
      let list = (db[tableName] as any[]) || [];
      if (args?.where) {
        list = list.filter((item) => matchWhere(item, args.where));
      }
      // Populate relations
      if (args?.include) {
        list = list.map((item) => {
          const res = { ...item };
          if (args.include.user && item.userId) {
            res.user = db.users.find((u) => u.id === item.userId) || null;
          }
          if (args.include.gym) {
            if (item.gymId) res.gym = db.gyms.find((g) => g.id === item.gymId) || null;
            else res.gym = db.gyms.find((g) => g.userId === item.id) || null;
          }
          if (args.include.instructor) {
            if (item.instructorId) res.instructor = db.instructors.find((i) => i.id === item.instructorId) || null;
            else res.instructor = db.instructors.find((i) => i.userId === item.id) || null;
          }
          return res;
        });
      }
      return list;
    },

    findUnique: async (args: { where: any; include?: any }) => {
      const db = readDb();
      const list = (db[tableName] as any[]) || [];
      const item = list.find((it) => matchWhere(it, args.where));
      if (!item) return null;
      const res = { ...item };
      if (args.include) {
        if (args.include.user && item.userId) {
          res.user = db.users.find((u) => u.id === item.userId) || null;
        }
        if (args.include.gym) {
          if (item.gymId) res.gym = db.gyms.find((g) => g.id === item.gymId) || null;
          else res.gym = db.gyms.find((g) => g.userId === item.id) || null;
        }
        if (args.include.instructor) {
          if (item.instructorId) res.instructor = db.instructors.find((i) => i.id === item.instructorId) || null;
          else res.instructor = db.instructors.find((i) => i.userId === item.id) || null;
        }
      }
      return res;
    },

    findFirst: async (args?: { where?: any; include?: any }) => {
      const db = readDb();
      let list = (db[tableName] as any[]) || [];
      if (args?.where) {
        list = list.filter((item) => matchWhere(item, args.where));
      }
      const item = list[0] || null;
      if (!item) return null;
      const res = { ...item };
      if (args?.include) {
        if (args.include.user && item.userId) {
          res.user = db.users.find((u) => u.id === item.userId) || null;
        }
        if (args.include.gym) {
          if (item.gymId) res.gym = db.gyms.find((g) => g.id === item.gymId) || null;
          else res.gym = db.gyms.find((g) => g.userId === item.id) || null;
        }
        if (args.include.instructor) {
          if (item.instructorId) res.instructor = db.instructors.find((i) => i.id === item.instructorId) || null;
          else res.instructor = db.instructors.find((i) => i.userId === item.id) || null;
        }
      }
      return res;
    },

    create: async (args: { data: any; include?: any }) => {
      const db = readDb();
      const list = (db[tableName] as any[]) || [];
      const id = args.data.id || `${String(tableName).slice(0, 4)}-${Date.now()}`;
      const newItem = {
        id,
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.push(newItem);
      (db as any)[tableName] = list;
      writeDb(db);
      return newItem;
    },

    update: async (args: { where: any; data: any; include?: any }) => {
      const db = readDb();
      const list = (db[tableName] as any[]) || [];
      const idx = list.findIndex((it) => matchWhere(it, args.where));
      if (idx === -1) {
        // Upsert if not found
        const newItem = {
          id: args.where.id || `${String(tableName).slice(0, 4)}-${Date.now()}`,
          ...args.data,
          updatedAt: new Date().toISOString()
        };
        list.push(newItem);
        (db as any)[tableName] = list;
        writeDb(db);
        return newItem;
      }
      list[idx] = {
        ...list[idx],
        ...args.data,
        updatedAt: new Date().toISOString()
      };
      (db as any)[tableName] = list;
      writeDb(db);
      return list[idx];
    },

    delete: async (args: { where: any }) => {
      const db = readDb();
      const list = (db[tableName] as any[]) || [];
      const item = list.find((it) => matchWhere(it, args.where));
      (db as any)[tableName] = list.filter((it) => !matchWhere(it, args.where));
      writeDb(db);
      return item;
    },

    count: async (args?: { where?: any }) => {
      const db = readDb();
      let list = (db[tableName] as any[]) || [];
      if (args?.where) {
        list = list.filter((item) => matchWhere(item, args.where));
      }
      return list.length;
    }
  };
}

export function createLocalPrismaFallback() {
  return {
    user: createModelClient("users"),
    gym: createModelClient("gyms"),
    instructor: createModelClient("instructors"),
    shift: createModelClient("shifts"),
    proposal: createModelClient("proposals")
  };
}
