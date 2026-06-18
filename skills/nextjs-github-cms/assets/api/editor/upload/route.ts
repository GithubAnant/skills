import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { uploadEditorImage } from "@/lib/editor-store";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed." },
        { status: 400 },
      );
    }

    // UUID prefix keeps uploads unique; sanitizing the name avoids breaking the
    // GitHub path (and the public URL) with spaces or odd characters.
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const fileName = `${randomUUID()}-${safeName}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const publicPath = await uploadEditorImage(fileName, buffer);
    return NextResponse.json({ path: publicPath });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
