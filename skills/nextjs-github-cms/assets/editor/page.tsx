"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteContent } from "@/data/schemas";
import styles from "./page.module.css";

// ── Register section components here ──
// Add one import + one entry in SECTION_LINKS + one render below per section.
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import AdvancedJsonSection from "./components/AdvancedJsonSection";

type EditorApiResponse = {
  content?: unknown;
  message?: string;
  error?: string;
  details?: string[];
};

// Sidebar jump-links. `id` must match the `id` on each <section> below.
const SECTION_LINKS = [
  { id: "hero", label: "Hero" },
  { id: "features", label: "Features" },
  { id: "advanced", label: "Advanced JSON" },
] as const;

export default function EditorPage() {
  const router = useRouter();

  // ── Auth state ──
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ── Content state ──
  const [content, setContent] = useState<SiteContent | null>(null);
  const [initialSerialized, setInitialSerialized] = useState("");
  const [advancedRaw, setAdvancedRaw] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const serialized = useMemo(() => (content ? JSON.stringify(content) : ""), [content]);
  const dirty = useMemo(() => serialized !== initialSerialized, [serialized, initialSerialized]);

  // Check existing session on mount.
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ authenticated: boolean }>)
      .then((data) => setAuthed(data.authenticated))
      .catch(() => setAuthed(false))
      .finally(() => setAuthChecking(false));
  }, []);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setAuthError(data.error ?? "Invalid password");
        return;
      }
      setAuthed(true);
      setPassword("");
    } catch {
      setAuthError("Login failed. Try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
    setContent(null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/editor/content", { cache: "no-store" });
      if (response.status === 401) {
        setAuthed(false);
        return;
      }
      const data = (await response.json()) as EditorApiResponse;
      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "Unable to load content");
      }

      const loaded = data.content as SiteContent;
      const pretty = JSON.stringify(loaded, null, 2);
      setContent(loaded);
      setAdvancedRaw(pretty);
      setInitialSerialized(JSON.stringify(loaded));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load content";
      setStatus({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) void load();
  }, [load, authed]);

  // Keep the Advanced JSON view in sync with form edits while it's hidden.
  useEffect(() => {
    if (content && !showAdvanced) {
      setAdvancedRaw(JSON.stringify(content, null, 2));
    }
  }, [content, showAdvanced]);

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateContent = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const uploadImage = async (file: File, onUploaded: (path: string) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      setStatus(null);
      const response = await fetch("/api/editor/upload", { method: "POST", body: formData });
      const data = (await response.json()) as { path?: string; error?: string };
      if (!response.ok || !data.path) {
        throw new Error(data.error ?? "Upload failed");
      }
      onUploaded(data.path);
      setStatus({ type: "ok", text: "Image uploaded. Save changes to persist content." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setStatus({ type: "error", text: message });
    }
  };

  const onApplyAdvancedJson = () => {
    try {
      const parsed = JSON.parse(advancedRaw) as SiteContent;
      setContent(parsed);
      setStatus({ type: "ok", text: "Advanced JSON applied to form." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON";
      setStatus({ type: "error", text: message });
    }
  };

  const onSave = async () => {
    if (!content) return;
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/editor/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = (await response.json()) as EditorApiResponse;
      if (!response.ok) {
        const details = data.details?.join(" | ");
        throw new Error(details ?? data.error ?? "Save failed");
      }
      setInitialSerialized(JSON.stringify(content));
      setAdvancedRaw(JSON.stringify(content, null, 2));
      setStatus({ type: "ok", text: data.message ?? "Content saved." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      setStatus({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  // Props shared by every section component.
  const sectionProps = {
    content: content!,
    updateContent,
    loading,
    saving,
    dirty,
    onSave: () => void onSave(),
    uploadImage,
  };

  if (authChecking) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.subtitle}>Checking access…</p>
        </div>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className={styles.page} style={{ display: "grid", placeItems: "center", minHeight: "100svh" }}>
        <div className={styles.loginCard}>
          <p className={styles.loginEyebrow}>Admin Access</p>
          <h1 className={styles.loginTitle}>Site Content Editor</h1>
          <p className={styles.subtitle} style={{ marginBottom: "1.75rem" }}>Enter the admin password to continue.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleLogin();
            }}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              style={{ textAlign: "center" }}
            />
            <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={authLoading || !password}>
              {authLoading ? "Verifying…" : "Unlock"}
            </button>
            {authError && <p className={`${styles.status} ${styles.error}`}>{authError}</p>}
          </form>
        </div>
      </main>
    );
  }

  if (!content) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.subtitle}>{loading ? "Loading editor..." : "Failed to load content."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 className={styles.title}>Site Content Editor</h1>
            <button type="button" className={styles.button} onClick={() => void handleLogout()}>
              Logout
            </button>
          </div>
          <p className={styles.subtitle}>Use the left menu to jump to any section. Edit and click Save to apply changes.</p>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <p className={styles.sidebarTitle}>Sections</p>
            <ul className={styles.sideLinks}>
              {SECTION_LINKS.map((section) => (
                <li key={section.id}>
                  <button type="button" className={styles.sideButton} onClick={() => jumpTo(section.id)}>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className={styles.content}>
            <section className={styles.toolbar}>
              <div className={styles.actions}>
                <button type="button" className={styles.button} onClick={() => void load()} disabled={loading || saving}>
                  Reload
                </button>
                <button type="button" className={styles.button} onClick={() => setShowAdvanced((prev) => !prev)} disabled={loading || saving}>
                  {showAdvanced ? "Hide Advanced JSON" : "Show Advanced JSON"}
                </button>
                <button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => void onSave()} disabled={loading || saving || !dirty}>
                  {saving ? "Saving..." : dirty ? "Save Changes" : "Saved"}
                </button>
              </div>
              {status && <p className={`${styles.status} ${status.type === "ok" ? styles.ok : styles.error}`}>{status.text}</p>}
            </section>

            {/* ── Render each section here ── */}
            <HeroSection {...sectionProps} />
            <FeaturesSection {...sectionProps} />

            <AdvancedJsonSection
              advancedRaw={advancedRaw}
              setAdvancedRaw={setAdvancedRaw}
              showAdvanced={showAdvanced}
              loading={loading}
              saving={saving}
              dirty={dirty}
              onSave={() => void onSave()}
              onApplyAdvancedJson={onApplyAdvancedJson}
            />

            <p className={styles.hint}>
              Route is intentionally unlisted from navigation. Save writes to GitHub when configured, with local file fallback in development.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
