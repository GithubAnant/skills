import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { siteContent as fallbackContent } from "@/data/content";
import { SiteContentSchema, type SiteContent } from "@/data/schemas";

const LOCAL_PATH = path.join(process.cwd(), "src", "data", "content.json");
const CONTENT_CACHE_TTL_MS = 15000;

let cachedContent: SiteContent | null = null;
let cachedContentAt = 0;

function getFreshCachedContent(): SiteContent | null {
  if (!cachedContent) return null;
  if (Date.now() - cachedContentAt > CONTENT_CACHE_TTL_MS) return null;
  return cachedContent;
}

/**
 * Reads the bundled content.json that shipped with THIS deployment. Note this
 * is the build-time snapshot, not live GitHub — that is intentional. Public
 * pages read fast from disk; new edits go live only after a fresh deploy (which
 * is exactly what the deploy-trigger workflow automates). A short in-memory
 * cache avoids re-reading + re-validating on every request.
 */
export async function readContent(): Promise<SiteContent> {
  const cached = getFreshCachedContent();
  if (cached) return cached;

  try {
    const raw = await readFile(LOCAL_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const result = SiteContentSchema.safeParse(parsed);
    if (!result.success) {
      console.warn("[content-store] Local content invalid, using fallback");
      return fallbackContent;
    }

    cachedContent = result.data;
    cachedContentAt = Date.now();
    return result.data;
  } catch {
    return fallbackContent;
  }
}

export async function writeContent(data: SiteContent): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await writeFile(LOCAL_PATH, `${json}\n`, "utf8");
  cachedContent = data;
  cachedContentAt = Date.now();
}
