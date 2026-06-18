import type { SiteContent } from "@/data/schemas";

export type { SiteContent };

/**
 * Every section component receives these props. `updateContent` is a typed
 * setter for a top-level key of SiteContent — sections call it with a new value
 * for their slice and the page re-derives the dirty flag automatically.
 */
export type SectionProps = {
  content: SiteContent;
  updateContent: <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => void;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
  uploadImage: (file: File, onUploaded: (path: string) => void) => Promise<void>;
};
