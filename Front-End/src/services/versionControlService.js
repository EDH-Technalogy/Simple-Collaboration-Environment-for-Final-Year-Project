import apiClient from "../api/client";
import { saveAs } from "file-saver";
import {
  getFileExtension,
  isKnownBinaryExtension,
  tryDecodeUtf8,
} from "../utils/binaryFileHandlers";
import { parseVicCompressedObject } from "../utils/vicObjectFormat";
import { VC } from "./RouteConfig";
import { extractApiError } from "./apiRoute";

/**
 * @param {Uint8Array | ArrayBuffer} buf
 * @returns {Uint8Array}
 */
function toUint8(buf) {
  if (buf instanceof Uint8Array) return buf;
  return new Uint8Array(buf);
}

function decodeBase64ToBytes(content) {
  const bin = atob(String(content ?? "").replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function fetchFileContentViaContents(owner, repo, filePath, ref = "main") {
  const { data } = await apiClient.get(
    VC.REPO_CONTENTS(owner, repo, filePath, { ref }),
  );
  const blobSha = String(data?.sha ?? data?.blobSha ?? data?.hash ?? "").trim();
  if (blobSha && isKnownBinaryExtension(getFileExtension(filePath))) {
    return fetchRepositoryBlobPayload(owner, repo, blobSha);
  }
  if (data?.encoding === "base64" && typeof data.content === "string") {
    return decodeBase64ToBytes(data.content);
  }
  if (typeof data?.content === "string") {
    return new TextEncoder().encode(data.content);
  }
  throw new Error("Failed to load file.");
}

/**
 * Decompressed **blob payload** bytes (`type == "blob"`) from `GET /api/v1/repos/.../objects/{sha}`.
 * @param {string} owner
 * @param {string} repo
 * @param {string} blobSha
 */
export async function fetchRepositoryBlobPayload(owner, repo, blobSha) {
  const url = VC.REPO_OBJECT(owner, repo, blobSha);
  try {
    const { data } = await apiClient.get(url, {
      responseType: "arraybuffer",
    });
    const u8 = toUint8(data);
    const parsed = parseVicCompressedObject(u8);
    if (String(parsed.type || "").toLowerCase() !== "blob") {
      throw new Error(`Expected blob object, received: ${parsed.type}`);
    }
    return toUint8(parsed.content);
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to load blob payload."));
  }
}

/**
 * Prefer `blobSha` (raw object) when available (binary-safe). Otherwise fall back to legacy
 * `REPO_FILE_AT_REF` if your gateway implements it.
 *
 * @param {string} owner
 * @param {string} repo
 * @param {string} filePath
 * @param {string} [branch]
 * @param {string | null} [blobSha]
 */
export async function fetchFileContent(
  owner,
  repo,
  filePath,
  branch = "main",
  blobSha = null,
) {
  const trimmed = blobSha != null ? String(blobSha).trim() : "";
  if (trimmed) return fetchRepositoryBlobPayload(owner, repo, trimmed);

  const url = VC.REPO_FILE_AT_REF(owner, repo, branch, filePath);
  try {
    const { data } = await apiClient.get(url, {
      responseType: "arraybuffer",
    });
    return toUint8(data);
  } catch (err) {
    try {
      return await fetchFileContentViaContents(owner, repo, filePath, branch);
    } catch (fallbackErr) {
      throw new Error(
        extractApiError(
          fallbackErr,
          extractApiError(err, "Failed to load file."),
        ),
      );
    }
  }
}

export async function downloadRepositoryArchive(
  owner,
  repo,
  { ref = "main", onProgress } = {},
) {
  try {
    const startedAt = Date.now();
    const { data } = await apiClient.get(
      VC.REPO_ARCHIVE(owner, repo, { ref }),
      {
        responseType: "blob",
        onDownloadProgress: (event) => {
          const loaded = Number(event.loaded ?? 0);
          const total = Number(event.total ?? 0);
          onProgress?.({
            loaded,
            total,
            percent: total > 0 ? Math.round((loaded / total) * 100) : null,
            elapsedMs: Date.now() - startedAt,
          });
        },
      },
    );
    const safeOwner = String(owner ?? "workspace").replace(/[^\w.-]+/g, "-");
    const safeRepo = String(repo ?? "repository").replace(/[^\w.-]+/g, "-");
    saveAs(data, `${safeOwner}-${safeRepo}.zip`);
    return data;
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to download repository."));
  }
}

/**
 * Normalize blame payload to a flat array:
 * `{ lineNumber, author, authorId, commit, commitMessage, timestamp, content }`
 * @param {*} raw
 * @returns {Array<Record<string, unknown>>}
 */
export function normalizeBlameLines(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw?.lines && Array.isArray(raw.lines)) return raw.lines;
  if (raw?.blame && Array.isArray(raw.blame)) return raw.blame;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  return [];
}

/**
 * @param {string} owner
 * @param {string} repo
 * @param {string} filePath
 * @param {string} [branch]
 */
export async function fetchFileBlame(owner, repo, filePath, ref = "main") {
  const url = VC.BLAME_FILE(owner, repo, filePath, {
    ref,
    branch: ref,
  });
  try {
    const { data } = await apiClient.get(url);
    return normalizeBlameLines(data);
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to load blame data."));
  }
}

export async function fetchDocumentBlame(owner, repo, filePath, ref = "main") {
  const url = VC.DOCUMENT_BLAME_FILE(owner, repo, filePath, {
    ref,
    branch: ref,
  });
  try {
    const { data } = await apiClient.get(url);
    return data && typeof data === "object" ? data : {};
  } catch (err) {
    if (err?.response?.status === 404) {
      return null;
    }
    throw new Error(
      extractApiError(err, "Failed to load document blame data."),
    );
  }
}

export function normalizeRepositoryTree(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const rows =
    raw.tree ??
    raw.nodes ??
    raw.entries ??
    raw.children ??
    raw.items ??
    raw.data ??
    raw.content ??
    [];
  return Array.isArray(rows) ? rows : [];
}

export async function fetchRepositoryTree(owner, repo, params = {}) {
  try {
    const { data } = await apiClient.get(VC.REPO_TREE(owner, repo, params));
    return normalizeRepositoryTree(data);
  } catch (err) {
    try {
      const { data } = await apiClient.get(VC.REPO_TREE_LEGACY(owner, repo, params));
      return normalizeRepositoryTree(data);
    } catch {
      throw new Error(extractApiError(err, "Failed to load repository tree."));
    }
  }
}

export async function fetchRepositoryFileNotes(
  owner,
  repo,
  filePath,
  { ref = "main" } = {},
) {
  try {
    const { data } = await apiClient.get(
      VC.REPO_FILE_NOTES(owner, repo, { path: filePath, ref, branch: ref }),
    );
    if (Array.isArray(data)) return data;
    return data?.notes ?? data?.data ?? [];
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to load file notes."));
  }
}

export async function createRepositoryFileNote(owner, repo, body) {
  try {
    const { data } = await apiClient.post(VC.REPO_FILE_NOTES(owner, repo), body);
    return data ?? {};
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to save file note."));
  }
}

export async function updateRepositoryFileNote(owner, repo, noteId, body) {
  try {
    const { data } = await apiClient.patch(
      VC.REPO_FILE_NOTE(owner, repo, noteId),
      body,
    );
    return data ?? {};
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to update file note."));
  }
}

export async function deleteRepositoryFileNote(owner, repo, noteId) {
  try {
    await apiClient.delete(VC.REPO_FILE_NOTE(owner, repo, noteId));
    return true;
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to delete file note."));
  }
}

export async function fetchPullRequestFiles(owner, repo, prNumber) {
  try {
    const { data } = await apiClient.get(VC.PULL_REQUEST_FILES(owner, repo, prNumber));
    if (Array.isArray(data)) return data;
    if (data?.files && Array.isArray(data.files)) return data.files;
    return [];
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to load pull request files."));
  }
}

export async function fetchPullRequestFileDiff(owner, repo, prNumber, fileIndex) {
  try {
    const { data } = await apiClient.get(
      VC.PULL_REQUEST_FILE_DIFF(owner, repo, prNumber, fileIndex),
    );
    return data ?? {};
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to load file diff."));
  }
}

export async function fetchMergeConflicts(owner, repo, prNumber) {
  try {
    const { data } = await apiClient.get(VC.MERGE_CONFLICTS(owner, repo, prNumber));
    return Array.isArray(data) ? data : data?.conflicts ?? [];
  } catch (err) {
    if (err?.response?.status === 404) {
      return [];
    }
    throw new Error(extractApiError(err, "Failed to load merge conflicts."));
  }
}

export async function mergePullRequest(owner, repo, prNumber) {
  try {
    const { data } = await apiClient.post(
      VC.MERGE_PULL_REQUEST(owner, repo, prNumber),
    );
    return data ?? {};
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to merge pull request."));
  }
}

/**
 * @param {string} owner
 * @param {string} repo
 * @param {string|number} prNumber
 * @param {{
 *   filePath: string,
 *   resolution: "SOURCE"|"TARGET"|"CUSTOM"|"SKIP"|string,
 *   customContent?: string
 * }} body
 */
export async function resolveMergeConflict(owner, repo, prNumber, body) {
  try {
    const { data } = await apiClient.post(
      VC.MERGE_RESOLVE(owner, repo, prNumber),
      body,
    );
    return data;
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to resolve conflict."));
  }
}

export async function fetchCommitDetails(owner, repo, commitSha) {
  try {
    const { data } = await apiClient.get(VC.COMMIT_DETAIL(owner, repo, commitSha));
    return data ?? {};
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to load commit."));
  }
}

export async function fetchCommitHistory(owner, repo, branch = "main", params = {}) {
  try {
    const { data } = await apiClient.get(
      VC.COMMITS_ON_BRANCH(owner, repo, branch, params),
    );
    if (Array.isArray(data)) return data;
    return data?.commits ?? data?.content ?? [];
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to load commits."));
  }
}

/**
 * Commits matching `apiEndpoint.md` `/repos/{owner}/{repo}/commits?path&ref&limit`;
 * falls back to `COMMITS_ON_BRANCH` when the gateway route is unavailable.
 * @param {string} owner
 * @param {string} repo
 * @param {{ path?: string, ref?: string, limit?: number }} options
 */
export async function fetchRepositoryCommits(
  owner,
  repo,
  { path, ref = "main", limit = 40 } = {},
) {
  const q = { ref, limit, ...(path ? { path } : {}) };
  try {
    const { data } = await apiClient.get(VC.REPO_COMMITS(owner, repo, q));
    if (Array.isArray(data)) return data;
    return data?.commits ?? data?.data ?? [];
  } catch (err) {
    try {
      return await fetchCommitHistory(owner, repo, ref, { limit, path });
    } catch {
      throw new Error(extractApiError(err, "Failed to load commits."));
    }
  }
}

/**
 * Compare two refs per `apiEndpoint.md` §5.6.
 * @returns {Promise<{ baseCommit?: string, headCommit?: string, files?: unknown[] }>}
 */
export async function fetchRepositoryCompare(owner, repo, baseRef, headRef) {
  try {
    const { data } = await apiClient.get(
      VC.REPO_COMPARE(owner, repo, baseRef, headRef),
    );
    return data && typeof data === "object" ? data : {};
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to load compare."));
  }
}

export async function fetchRepositoryCommitDiff(owner, repo, baseSha, headSha) {
  try {
    const { data } = await apiClient.get(
      VC.DIFF_COMMITS(owner, repo, baseSha, headSha),
      { responseType: "text" },
    );
    return data;
  } catch (err) {
    throw new Error(extractApiError(err, "Failed to load commit diff."));
  }
}

/**
 * Best-effort UTF-8 text for diffing (contents JSON or raw tree bytes).
 * @returns {Promise<string|null>} `null` if content is not decodable as text.
 */
export async function fetchRepositoryFileUtf8ForDiff(
  owner,
  repo,
  filePath,
  ref = "main",
) {
  try {
    const { data } = await apiClient.get(
      VC.REPO_CONTENTS(owner, repo, filePath, { ref }),
    );
    if (data?.encoding === "base64" && typeof data.content === "string") {
      try {
        return tryDecodeUtf8(decodeBase64ToBytes(data.content));
      } catch {
        return null;
      }
    }
    if (typeof data?.content === "string") return data.content;
  } catch {
    /* fall through */
  }
  try {
    const bytes = await fetchFileContent(owner, repo, filePath, ref);
    return tryDecodeUtf8(bytes);
  } catch {
    return null;
  }
}
