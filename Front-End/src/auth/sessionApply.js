import { buildAuthSession } from "../lib/authSession";
import { persistTokens } from "./storageBridge";

/** Persist the latest gateway tokens, then return the safe profile for React state. */
export function ingestGatewayLoginPayload(payload) {
  const session = buildAuthSession(payload);
  persistTokens(
    typeof session.access_token === "string" ? session.access_token : null,
    typeof session.refresh_token === "string" ? session.refresh_token : null,
  );
  return session.user;
}
