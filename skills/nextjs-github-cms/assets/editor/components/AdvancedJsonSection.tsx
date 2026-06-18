"use client";

import styles from "../page.module.css";

type Props = {
  advancedRaw: string;
  setAdvancedRaw: (value: string) => void;
  showAdvanced: boolean;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
  onApplyAdvancedJson: () => void;
};

/**
 * Escape hatch: edit the entire content object as raw JSON. Useful for fields
 * no section component covers yet, and for bulk paste. "Apply to Form" parses
 * the text back into state (it does NOT save); the page then validates on save.
 */
export default function AdvancedJsonSection({
  advancedRaw,
  setAdvancedRaw,
  showAdvanced,
  loading,
  saving,
  dirty,
  onSave,
  onApplyAdvancedJson,
}: Props) {
  if (!showAdvanced) return null;

  return (
    <section id="advanced" className={styles.panel}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Advanced JSON</h2>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={onApplyAdvancedJson} disabled={loading || saving}>
            Apply to Form
          </button>
          <button type="button" className={`${styles.button} ${styles.primary}`} onClick={onSave} disabled={loading || saving || !dirty}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <p className={styles.fieldHelp}>
        Editing raw content. Click &quot;Apply to Form&quot; to load these changes into the structured editor, then Save.
      </p>
      <textarea className={styles.jsonTextarea} value={advancedRaw} onChange={(e) => setAdvancedRaw(e.target.value)} spellCheck={false} />
    </section>
  );
}
