import pako from "pako";

/**
 * Inflates zlib-wrapped Vic storage (`InflaterInputStream` on the Java side).
 * Then parses `{type} {payloadSize}\u0000<payload>` (see `VicObjectFormat.java`).
 *
 * @param {ArrayBuffer | Uint8Array} compressedBytes
 * @returns {{ type: string, content: Uint8Array }}
 */
export function parseVicCompressedObject(compressedBytes) {
  const u8 =
    compressedBytes instanceof Uint8Array
      ? compressedBytes
      : new Uint8Array(compressedBytes ?? []);
  const inflated = pako.inflate(u8);
  return parseVicInflatedObject(inflated);
}

/** @returns {{ type: string, content: Uint8Array }} */
function parseVicInflatedObject(raw) {
  let z = -1;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === 0) {
      z = i;
      break;
    }
  }
  if (z < 0) {
    throw new Error("Invalid Vic object (missing header separator).");
  }
  const headerStr = new TextDecoder("utf-8", { fatal: false }).decode(
    raw.subarray(0, z),
  );
  const sp = headerStr.indexOf(" ");
  if (sp < 0) {
    throw new Error("Invalid Vic object header.");
  }
  const type = headerStr.slice(0, sp);
  const declaredSize = Number(headerStr.slice(sp + 1));
  if (!Number.isSafeInteger(declaredSize) || declaredSize < 0) {
    throw new Error("Invalid Vic object size.");
  }
  const contentStart = z + 1;
  const contentEnd = contentStart + declaredSize;
  if (contentEnd > raw.length) {
    throw new Error(
      `Truncated Vic object payload: expected ${declaredSize} bytes, received ${Math.max(0, raw.length - contentStart)}.`,
    );
  }
  const content = raw.subarray(contentStart, contentEnd);
  return { type, content };
}
