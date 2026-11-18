const { execSync } = require("child_process");

console.log("[db-sync] Gerando cliente Prisma (@prisma/client)...");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (err) {
  console.error("[db-sync] Erro ao gerar Prisma Client:", err.message);
  process.exit(1);
}

// Se a variável DATABASE_URL estiver presente (ambiente de produção na Vercel / nuvem),
// sincroniza as colunas e tabelas do banco de dados automaticamente.
if (process.env.DATABASE_URL) {
  console.log("[db-sync] DATABASE_URL detectada! Sincronizando tabelas e colunas com o banco de dados...");
  try {
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
    console.log("[db-sync] Banco de dados sincronizado com sucesso!");
  } catch (err) {
    console.warn("[db-sync] Aviso ao executar prisma db push (prosseguindo com build):", err.message);
  }
} else {
  console.log("[db-sync] DATABASE_URL não configurada no ambiente local de build. Pulando sincronização remota.");
}
