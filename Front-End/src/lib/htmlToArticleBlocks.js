/**
 * Serialize a Medium-style contentEditable root into blog-service `ArticleBlockRequest[]`.
 * @param {HTMLElement | null} root
 */
export function htmlToArticleBlocks(root) {
  if (!root) return [];

  const orderRef = { n: 0 };
  const out = [];

  for (const node of Array.from(root.childNodes)) {
    out.push(...serializeNode(node, orderRef));
  }

  const merged = collapseAdjacentTextBlocks(out);
  return merged.filter((b) => {
    const t = String(b?.type ?? "").toUpperCase();
    const d = b?.data ?? {};
    if (t === "TEXT" && !(String(d.text ?? "").trim())) return false;
    if (t === "HEADING" && !(String(d.text ?? "").trim())) return false;
    if (t === "QUOTE" && !(String(d.text ?? "").trim())) return false;
    if (t === "CODE" && !(String(d.code ?? "").trim())) return false;
    return true;
  });
}

function collapseAdjacentTextBlocks(blocks) {
  const res = [];
  for (const b of blocks) {
    const prev = res[res.length - 1];
    if (
      prev &&
      String(prev.type).toUpperCase() === "TEXT" &&
      String(b.type).toUpperCase() === "TEXT"
    ) {
      const pa = prev.data ?? {};
      const pb = b.data ?? {};
      prev.data = {
        ...pa,
        text: `${String(pa.text ?? "").trimEnd()}\n\n${String(pb.text ?? "").trimStart()}`.trim(),
      };
      continue;
    }
    res.push(b);
  }
  return res;
}

/** @param {ChildNode} node @param {{ n: number }} orderRef */
function serializeNode(node, orderRef) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (!text.trim()) return [];
    return [mkBlock(orderRef, "TEXT", { text })];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const el = /** @type {Element} */ (node);
  const tag = el.tagName.toLowerCase();

  if (tag === "br") {
    return [mkBlock(orderRef, "TEXT", { text: "\n" })];
  }

  if (tag === "p") {
    if (el.querySelector("img,figure,video,iframe")) {
      return flattenChildren(el, orderRef);
    }
    const text = flattenText(el);
    if (!text.trim()) return [];
    return [mkBlock(orderRef, "TEXT", { text })];
  }

  if (/^h[1-6]$/.test(tag)) {
    const level = Math.min(Math.max(Number.parseInt(tag[1], 10) || 2, 1), 6);
    const text = flattenText(el);
    if (!text.trim()) return [];
    return [mkBlock(orderRef, "HEADING", { text, level })];
  }

  if (tag === "hr") {
    return [mkBlock(orderRef, "DIVIDER", {})];
  }

  if (tag === "blockquote") {
    const text = flattenText(el);
    if (!text.trim()) return [];
    return [mkBlock(orderRef, "QUOTE", { text })];
  }

  if (tag === "pre") {
    const code = el.textContent ?? "";
    if (!code.trim()) return [];
    const langAttr = el.getAttribute("data-language") || "";
    return [mkBlock(orderRef, "CODE", { code, language: langAttr })];
  }

  if (tag === "figure") {
    const img = el.querySelector("img");
    if (img?.src) {
      return [
        mkBlock(orderRef, "IMAGE", {
          ...(img.dataset.fileId ? { fileId: img.dataset.fileId } : {}),
          url: img.src,
          alt: img.alt ?? "",
        }),
      ];
    }
    return flattenChildren(el, orderRef);
  }

  if (tag === "img") {
    return [
      mkBlock(orderRef, "IMAGE", {
        ...(el.dataset.fileId ? { fileId: el.dataset.fileId } : {}),
        url: el.src,
        alt: el.alt ?? "",
      }),
    ];
  }

  if (tag === "video") {
    const src = el.src || el.querySelector("source")?.src || "";
    if (!String(src).trim()) return [];
    return [mkBlock(orderRef, "VIDEO", { url: src })];
  }

  if (tag === "iframe") {
    const url = el.getAttribute("src") || "";
    if (!url.trim()) return [];
    return [mkBlock(orderRef, "EMBED", { provider: "iframe", url })];
  }

  if (tag === "div" && el.querySelector(":scope > iframe")) {
    const iframe = el.querySelector("iframe");
    const url = iframe?.getAttribute("src") || "";
    if (!url.trim()) return [];
    return [mkBlock(orderRef, "EMBED", { provider: "iframe", url })];
  }

  return flattenChildren(el, orderRef);
}

/** @param {Element} el @param {{ n: number }} orderRef */
function flattenChildren(el, orderRef) {
  const nested = [];
  for (const c of Array.from(el.childNodes)) {
    nested.push(...serializeNode(c, orderRef));
  }
  return nested;
}

function flattenText(el) {
  return (el.textContent ?? "").replace(/\u00a0/g, " ").trim();
}

/** @param {{ n: number }} orderRef */
function mkBlock(orderRef, type, data) {
  const block = {
    type: String(type).toUpperCase(),
    order: orderRef.n,
    data: data ?? {},
  };
  orderRef.n += 1;
  return block;
}
