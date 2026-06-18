"use client";

import Image from "next/image";
import type { SectionProps } from "./types";
import styles from "../page.module.css";

/**
 * EXAMPLE SECTION — flat object of scalar fields + a single image upload.
 * Pattern: read the slice off `content`, write the whole slice back through a
 * small typed `updateHero` helper so we never mutate state in place.
 */
export default function HeroSection({ content, updateContent, loading, saving, dirty, onSave, uploadImage }: SectionProps) {
  const hero = content.hero;

  const updateHero = <K extends keyof typeof hero>(field: K, value: (typeof hero)[K]) => {
    updateContent("hero", { ...hero, [field]: value });
  };

  return (
    <section id="hero" className={styles.panel}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Hero</h2>
        <button type="button" className={`${styles.button} ${styles.primary}`} onClick={onSave} disabled={loading || saving || !dirty}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className={styles.grid2}>
        <label className={styles.field}>
          <span className={styles.label}>Badge</span>
          <input className={styles.input} value={hero.badge} onChange={(e) => updateHero("badge", e.target.value)} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input className={styles.input} value={hero.title} onChange={(e) => updateHero("title", e.target.value)} />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Subtitle</span>
        <textarea className={styles.textarea} value={hero.subtitle} onChange={(e) => updateHero("subtitle", e.target.value)} />
      </label>

      <div className={styles.imageRow}>
        <span className={styles.label}>Hero Image</span>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span className={styles.label}>Image path</span>
            <input className={styles.input} value={hero.image} onChange={(e) => updateHero("image", e.target.value)} placeholder="/images/uploads/hero.jpg" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Alt text</span>
            <input className={styles.input} value={hero.imageAlt} onChange={(e) => updateHero("imageAlt", e.target.value)} />
          </label>
        </div>
        <div className={styles.imageControls}>
          {hero.image ? (
            <Image src={hero.image} alt={hero.imageAlt || "hero"} width={72} height={72} className={styles.thumb} unoptimized />
          ) : (
            <div className={styles.thumbPlaceholder}>No image</div>
          )}
          <input
            className={styles.uploadInput}
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await uploadImage(file, (newPath) => updateHero("image", newPath));
            }}
          />
        </div>
      </div>
    </section>
  );
}
