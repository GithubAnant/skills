import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { SiteContentSchema, type SiteContent } from "@/data/schemas";
import { readContent } from "@/lib/content-store";

// Path, relative to the repo root, of the JSON file that holds all editable
// content. The editor commits to THIS path on GitHub.
const CONTENT_PATH = "src/data/content.json";
const UPLOADS_DIR = path.join(process.cwd(), "public", "images", "uploads");

type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

type GitHubFileResponse = {
  sha: string;
  content?: string;
};

/**
 * Reads GitHub config from env. If any of token/owner/repo is missing we return
 * null, which makes every function below fall back to local-filesystem writes.
 * That fallback is what lets the editor work in `next dev` with no secrets.
 */
function getGitHubConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";

  if (!token || !owner || !repo) {
    return null;
  }

  return { token, owner, repo, branch };
}

function encodeRepoPath(filePath: string): string {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

async function githubRequest<T>(config: GitHubConfig, repoPath: string, init?: RequestInit): Promise<T> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeRepoPath(repoPath)}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[github-cms] ${repoPath}: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<T>;
}

async function getRepoFile(config: GitHubConfig, repoPath: string): Promise<GitHubFileResponse | null> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeRepoPath(repoPath)}?ref=${encodeURIComponent(config.branch)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[github-cms] ${repoPath}: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<GitHubFileResponse>;
}

/**
 * The GitHub Contents API requires the current blob `sha` to overwrite a file.
 * So we GET the existing file first, then PUT with that sha. If the file does
 * not exist yet, sha is undefined and GitHub creates it.
 */
async function putRepoFile(config: GitHubConfig, repoPath: string, message: string, contentBase64: string): Promise<void> {
  const existing = await getRepoFile(config, repoPath);
  await githubRequest(config, repoPath, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch: config.branch,
      sha: existing?.sha,
    }),
  });
}

export async function readEditorContent(): Promise<SiteContent> {
  const github = getGitHubConfig();
  if (!github) {
    return readContent();
  }

  const existing = await getRepoFile(github, CONTENT_PATH);
  if (!existing?.content) {
    return readContent();
  }

  const jsonText = Buffer.from(existing.content.replace(/\n/g, ""), "base64").toString("utf8");
  const parsed = JSON.parse(jsonText);
  return SiteContentSchema.parse(parsed);
}

export async function writeEditorContent(data: SiteContent): Promise<void> {
  const github = getGitHubConfig();
  const json = JSON.stringify(data, null, 2);

  if (github) {
    await putRepoFile(
      github,
      CONTENT_PATH,
      "chore(cms): update site content",
      Buffer.from(`${json}\n`, "utf8").toString("base64"),
    );
    return;
  }

  await writeFile(path.join(process.cwd(), CONTENT_PATH), `${json}\n`, "utf8");
}

export async function uploadEditorImage(fileName: string, buffer: Buffer): Promise<string> {
  const github = getGitHubConfig();
  const repoPath = `public/images/uploads/${fileName}`;

  if (github) {
    await putRepoFile(
      github,
      repoPath,
      `chore(cms): upload ${fileName}`,
      buffer.toString("base64"),
    );
    return `/images/uploads/${fileName}`;
  }

  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, fileName), buffer);
  return `/images/uploads/${fileName}`;
}
