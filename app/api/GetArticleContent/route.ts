// app/api/GetArticleContent/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "pfad fehlt" }, { status: 400 });
  }

  const decoded = decodeURIComponent(slug);
  const parts = decoded.split("/");

  // <-- Hier angepasst: nur "Database", nicht "app/Database"
  const databaseDir = path.join(process.cwd(), "Database");
  const filePath = path.join(databaseDir, ...parts) + ".md";

  try {
    await fs.access(filePath);
  } catch {
    return NextResponse.json(
      { error: "Datei nicht gefunden", path: filePath },
      { status: 404 }
    );
  }

  try {
    const content = await fs.readFile(filePath, "utf8");
    return new Response(content, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Lesefehler", path: filePath },
      { status: 500 }
    );
  }
}
