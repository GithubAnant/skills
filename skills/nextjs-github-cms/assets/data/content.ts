import contentJson from "./content.json";
import { SiteContentSchema, type SiteContent } from "./schemas";

/**
 * Static content for build-time / fallback use. Parsed (not safeParsed) on
 * purpose: if the committed content.json ever drifts out of sync with the
 * schema, the build fails loudly instead of shipping broken content.
 */
export const siteContent: SiteContent = SiteContentSchema.parse(contentJson);

/**
 * Dynamic content fetch — reads the repo-local content.json bundled with the
 * current deployment via the cached content-store. Public pages should call
 * this.
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const { readContent } = await import("@/lib/content-store");
    return await readContent();
  } catch {
    return siteContent;
  }
}
