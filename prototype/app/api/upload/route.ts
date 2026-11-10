import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

    // Suporte a FormData (upload direto de arquivos)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "O arquivo excede o limite máximo permitido de 3 MB." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || ".jpg";
      const randomName = `${crypto.randomUUID()}${ext}`;

      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, randomName);
        fs.writeFileSync(filePath, buffer);
        return NextResponse.json({ url: `/uploads/${randomName}` });
      } catch (fsErr) {
        // Ambiente Serverless read-only (ex: Vercel): retorna DataURL inline
        const mimeType = file.type || "image/jpeg";
        const base64 = buffer.toString("base64");
        return NextResponse.json({ url: `data:${mimeType};base64,${base64}` });
      }
    }

    // Suporte a JSON com Base64 (Data URL)
    const body = await req.json();
    if (body.dataUrl) {
      const matches = body.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ error: "Data URL inválido" }, { status: 400 });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "O arquivo excede o limite máximo permitido de 3 MB." },
          { status: 400 }
        );
      }

      let ext = ".jpg";
      if (mimeType.includes("png")) ext = ".png";
      if (mimeType.includes("webp")) ext = ".webp";
      if (mimeType.includes("pdf")) ext = ".pdf";

      const randomName = `${crypto.randomUUID()}${ext}`;

      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, randomName);
        fs.writeFileSync(filePath, buffer);
        return NextResponse.json({ url: `/uploads/${randomName}` });
      } catch (fsErr) {
        // Ambiente Serverless read-only (ex: Vercel): retorna a DataURL diretamente
        return NextResponse.json({ url: body.dataUrl });
      }
    }

    return NextResponse.json({ error: "Formato de upload não suportado" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: error.message || "Falha no upload" }, { status: 500 });
  }
}
