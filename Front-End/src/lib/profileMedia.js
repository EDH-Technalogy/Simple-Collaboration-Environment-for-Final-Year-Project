/**
 * Normalize display photo URL across gateway / roster payloads.
 */

function trimUrl(v) {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

/**
 * Preferred URL candidates (first non-empty wins).
 */
export function pickProfilePictureRaw(entity) {
  if (!entity || typeof entity !== "object") return "";
  const cands = [
    entity.profilePicture,
    entity.profile_picture,
    entity.profile_picture_url,
    entity.profilePhotoUrl,
    entity.photoUrl,
    entity.photo_url,
    entity.avatarUrl,
    entity.avatar_url,
    entity.picture,
    entity.image_url,
    entity.photo,
  ];
  for (const c of cands) {
    const t = trimUrl(c);
    if (t) return t;
  }
  return "";
}

/**
 * Make relative paths absolute against gateway base when possible.
 */
export function absolutizeMediaUrl(raw) {
  const t = trimUrl(raw);
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("//")) return t;
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  if (!base) return t.startsWith("/") ? t : `/${t}`;
  return t.startsWith("/") ? `${base}${t}` : `${base}/${t}`;
}

/** Non-empty usable URL or null when missing/invalid-looking. */
export function resolveProfilePhotoUrl(entity) {
  const raw = pickProfilePictureRaw(entity);
  const abs = absolutizeMediaUrl(raw);
  return abs || null;
}

/**
 * Two-letter initials when possible (first + last name); otherwise first glyphs of fallback labels.
 */
export function buildPersonInitials(entity, fallbackEmail = "") {
  const fn = trimUrl(entity?.first_name ?? entity?.firstName ?? "");
  const ln = trimUrl(entity?.last_name ?? entity?.lastName ?? "");
  if (fn && ln) return `${fn[0] ?? ""}${ln[0] ?? ""}`.toUpperCase().slice(0, 4);
  if (fn.length >= 2) return fn.slice(0, 2).toUpperCase();
  const full = trimUrl(entity?.fullName ?? entity?.full_name ?? "");
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase().slice(0, 4);
  }
  if (parts.length === 1 && parts[0].length) {
    const w = parts[0];
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : `${w[0]}`.toUpperCase();
  }
  const un = trimUrl(entity?.username ?? entity?.user_name ?? "");
  if (un.length >= 2) return un.slice(0, 2).toUpperCase();
  const em = trimUrl(entity?.email ?? fallbackEmail ?? "");
  if (em.length >= 2) return em.slice(0, 2).toUpperCase();
  return "?";
}
