import ProtectedRoute from "./ProtectedRoute";

/**
 * Narrow role gate — nests `ProtectedRoute`.
 */
export default function RoleProtectedRoute({
  children,
  roles,
  mode = "any",
}) {
  return (
    <ProtectedRoute allowedRoles={roles} roleMode={mode}>
      {children}
    </ProtectedRoute>
  );
}
