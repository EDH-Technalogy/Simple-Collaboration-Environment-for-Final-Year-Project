import { useContext } from "react";
import { AuthReactContext } from "./AuthProvider";

export function useAuth() {
  const ctx = useContext(AuthReactContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return ctx;
}
