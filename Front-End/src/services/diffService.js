import { diff_match_patch } from "diff-match-patch";
import { createPatch } from "diff";

/**
 * Git-style unified patch for Diff2Html (`diff` package handles headers / hunks).
 */
export function generateUnifiedDiff(oldContent, newContent, filePath = "file.txt") {
  const a = oldContent ?? "";
  const b = newContent ?? "";
  return createPatch(filePath, a, b, "", "");
}

const dmpSingleton = new diff_match_patch();

/**
 * Line-level diff tuples for custom UIs.
 */
export function diffLineTuples(oldText, newText) {
  const diffs = dmpSingleton.diff_main(oldText ?? "", newText ?? "");
  dmpSingleton.diff_cleanupSemantic(diffs);
  return diffs;
}

/**
 * Finds merge conflict markers and returns `{ head, tail }` hunks between `<<<<<<<` and `>>>>>>>`.
 * @returns {Array<{ head: string; tail: string }>}
 */
export function detectConflictBlocks(content) {
  const text = String(content ?? "");
  const re =
    /^<<<<<<<[^\r\n]*\r?\n([\s\S]*?)^=======[^\r\n]*\r?\n([\s\S]*?)^>>>>>>>[^\r\n]*/gm;
  const hits = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    hits.push({
      head: String(m[1] ?? "").trimEnd(),
      tail: String(m[2] ?? "").trimEnd(),
    });
  }
  return hits;
}
