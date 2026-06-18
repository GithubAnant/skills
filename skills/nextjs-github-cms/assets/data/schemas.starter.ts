import { z } from "zod";

/**
 * STARTER SCHEMA — replace the shapes below with the real content model for
 * THIS project. The editor, validation, and storage all key off SiteContent,
 * so this file is the single source of truth for "what fields exist".
 *
 * Conventions that make the editor UI nicer:
 *  - Give every array item a stable `id: z.string()` so React keys are stable
 *    and the section components can add/remove/reorder reliably.
 *  - Use `.optional()` for fields that may not be present on older content.
 *  - Use `z.enum([...])` for fixed choices — section components render these as
 *    <select> dropdowns instead of free text.
 */

export const LinkItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  newTab: z.boolean().optional(),
});
export type LinkItem = z.infer<typeof LinkItemSchema>;

export const SiteConfigSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  domain: z.string().url(),
});
export type SiteConfig = z.infer<typeof SiteConfigSchema>;

export const HeroSchema = z.object({
  badge: z.string(),
  title: z.string(),
  subtitle: z.string(),
  image: z.string(),
  imageAlt: z.string(),
});
export type Hero = z.infer<typeof HeroSchema>;

export const FeatureSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string().optional(),
});
export type Feature = z.infer<typeof FeatureSchema>;

/* ── The root content object the whole app reads from ── */
export const SiteContentSchema = z.object({
  siteConfig: SiteConfigSchema,
  hero: HeroSchema,
  navLinks: z.array(LinkItemSchema),
  features: z.array(FeatureSchema),
});
export type SiteContent = z.infer<typeof SiteContentSchema>;
