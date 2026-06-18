"use client";

import type { SectionProps } from "./types";
import styles from "../page.module.css";

/**
 * EXAMPLE SECTION — an array of items with add / edit / remove.
 * Pattern to copy for any list (team members, FAQs, sponsors, timeline...):
 *  - `update(index, field, value)` maps over the list immutably
 *  - `add()` appends an item with a unique, stable `id`
 *  - `remove(index)` filters the item out
 * Stable ids matter: they are the React key and they keep edits attached to the
 * right row when items are reordered or removed.
 */
export default function FeaturesSection({ content, updateContent, loading, saving, dirty, onSave }: SectionProps) {
  const features = content.features;

  const getNextId = (prefix: string, existing: string[]) => {
    let n = 1;
    while (existing.includes(`${prefix}-${n}`)) n += 1;
    return `${prefix}-${n}`;
  };

  const update = (index: number, field: keyof (typeof features)[number], value: string) => {
    updateContent(
      "features",
      features.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const add = () => {
    updateContent("features", [
      ...features,
      { id: getNextId("feature", features.map((f) => f.id)), title: "", description: "", icon: "" },
    ]);
  };

  const remove = (index: number) => {
    updateContent("features", features.filter((_, i) => i !== index));
  };

  return (
    <section id="features" className={styles.panel}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Features</h2>
        <button type="button" className={`${styles.button} ${styles.primary}`} onClick={onSave} disabled={loading || saving || !dirty}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={add}>+ Add Feature</button>
      </div>

      <div className={styles.cards2}>
        {features.map((feature, index) => (
          <div key={feature.id} className={styles.rowCard}>
            <label className={styles.field}>
              <span className={styles.label}>Title</span>
              <input className={styles.input} value={feature.title} onChange={(e) => update(index, "title", e.target.value)} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Description</span>
              <textarea className={styles.textarea} value={feature.description} onChange={(e) => update(index, "description", e.target.value)} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Icon</span>
              <input className={styles.input} value={feature.icon ?? ""} onChange={(e) => update(index, "icon", e.target.value)} placeholder="sparkles" />
            </label>
            <div className={styles.actions} style={{ justifyContent: "flex-end" }}>
              <button type="button" className={styles.button} style={{ color: "#f87171" }} onClick={() => remove(index)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
