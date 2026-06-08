import JSZip from "jszip";

function toUint8(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return new Uint8Array(input);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function childElements(node) {
  return Array.from(node?.childNodes ?? []).filter(
    (child) => child?.nodeType === 1,
  );
}

function localName(node) {
  return String(node?.localName ?? node?.nodeName ?? "").replace(/^.*:/, "");
}

function textNodesByTag(root, tagName) {
  return Array.from(root?.getElementsByTagName("*") ?? []).filter(
    (node) => localName(node) === tagName,
  );
}

function runToHtml(run) {
  const text = textNodesByTag(run, "t")
    .map((node) => node.textContent ?? "")
    .join("");
  const hasBreak = childElements(run).some((child) => localName(child) === "br");
  const content = escapeHtml(text || (hasBreak ? "" : ""));
  const styleNode = childElements(run).find((child) => localName(child) === "rPr");
  const styleNames = new Set(
    childElements(styleNode)
      .map((child) => localName(child))
      .filter(Boolean),
  );

  let html = content || (hasBreak ? "" : "");
  if (styleNames.has("b")) html = `<strong>${html}</strong>`;
  if (styleNames.has("i")) html = `<em>${html}</em>`;
  if (styleNames.has("u")) html = `<span class="vc-docx-underline">${html}</span>`;
  if (styleNames.has("strike")) html = `<span class="vc-docx-strike">${html}</span>`;
  if (hasBreak) html += "<br />";
  return html;
}

function paragraphToHtml(paragraph) {
  const pieces = [];
  for (const child of childElements(paragraph)) {
    const kind = localName(child);
    if (kind === "r") {
      pieces.push(runToHtml(child));
    } else if (kind === "hyperlink") {
      const linkText = childElements(child)
        .filter((node) => localName(node) === "r")
        .map((node) => runToHtml(node))
        .join("");
      pieces.push(linkText);
    }
  }
  const html = pieces.join("");
  return html.trim() ? `<p>${html}</p>` : `<p class="vc-docx-empty">&nbsp;</p>`;
}

function tableToHtml(table) {
  const rows = childElements(table).filter((node) => localName(node) === "tr");
  const rowHtml = rows
    .map((row) => {
      const cells = childElements(row).filter((node) => localName(node) === "tc");
      const cellHtml = cells
        .map((cell) => {
          const paras = childElements(cell)
            .filter((node) => localName(node) === "p")
            .map((node) => paragraphToHtml(node))
            .join("");
          return `<td>${paras || "<p class=\"vc-docx-empty\">&nbsp;</p>"}</td>`;
        })
        .join("");
      return `<tr>${cellHtml}</tr>`;
    })
    .join("");
  return `<table><tbody>${rowHtml}</tbody></table>`;
}

async function loadDocumentXml(input) {
  const zip = await JSZip.loadAsync(toUint8(input));
  const file = zip.file("word/document.xml");
  if (!file) return null;
  const xml = await file.async("string");
  return new DOMParser().parseFromString(xml, "application/xml");
}

/**
 * Rough plain-text preview for `.docx`.
 */
export async function extractDocxPlainText(input) {
  const doc = await loadDocumentXml(input);
  if (!doc) return "";
  const texts = textNodesByTag(doc, "t");
  const parts = [];
  for (const node of texts) {
    const text = node.textContent;
    if (text) parts.push(text);
  }
  return parts.join(" ");
}

/**
 * Lightweight structural HTML preview for `.docx`.
 */
export async function extractDocxHtml(input) {
  const doc = await loadDocumentXml(input);
  if (!doc) return "";

  const body = textNodesByTag(doc, "body")[0];
  if (!body) return "";

  const blocks = [];
  for (const child of childElements(body)) {
    const kind = localName(child);
    if (kind === "p") {
      blocks.push(paragraphToHtml(child));
    } else if (kind === "tbl") {
      blocks.push(tableToHtml(child));
    }
  }

  return blocks.join("");
}
