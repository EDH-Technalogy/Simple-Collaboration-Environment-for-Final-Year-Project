import Avatar from "./Avatar";
import { buildPersonInitials, resolveProfilePhotoUrl } from "../lib/profileMedia";

/**
 * Roster / table avatar: profile URL when present, otherwise initials (first + last).
 */
export default function PersonAvatar({ person, className, sizeClass }) {
  const src = resolveProfilePhotoUrl(person);
  const initials = buildPersonInitials(person);
  return (
    <Avatar
      src={src}
      initials={initials}
      className={className}
      sizeClass={sizeClass}
      alt=""
    />
  );
}
