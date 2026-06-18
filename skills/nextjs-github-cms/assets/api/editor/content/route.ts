import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SiteContentSchema } from "@/data/schemas";
import { isAuthenticated } from "@/lib/auth";
import { readEditorContent, writeEditorContent } from "@/lib/editor-store";

const UNAUTHORIZED = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

function getValidationErrors(error: unknown): string[] {
  if (typeof error !== "object" || error === null || !("issues" in error)) {
    return ["Invalid payload"];
  }

  const issues = (
    error as {
      issues?: Array<{ path: Array<string | number>; message: string }>;
    }
  ).issues;
  if (!issues || issues.length === 0) {
    return ["Invalid payload"];
  }

  return issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

export async function GET() {
  if (!(await isAuthenticated())) return UNAUTHORIZED();
  try {
    const content = await readEditorContent();
    return NextResponse.json({ content });
  } catch (error) {
    console.error("[GET /api/editor/content] Error:", error);
    return NextResponse.json(
      { error: "Failed to load content." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return UNAUTHORIZED();
  try {
    const payload = (await request.json()) as unknown;
    const result = SiteContentSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Content validation failed.",
          details: getValidationErrors(result.error),
        },
        { status: 400 },
      );
    }

    await writeEditorContent(result.data);

    // Bust Next's cache so the running deployment shows the new content
    // immediately. The full rebuild that bakes it into the bundle is handled
    // separately by the deploy-trigger workflow.
    revalidatePath("/", "layout");

    return NextResponse.json({ message: "Content saved successfully." });
  } catch (error) {
    console.error("[POST /api/editor/content] Error:", error);
    return NextResponse.json(
      { error: "Failed to save content." },
      { status: 500 },
    );
  }
}
