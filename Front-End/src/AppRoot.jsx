import App from "./App.jsx";
import { MaybeGoogleOAuthProvider } from "./components/GoogleAuthProvider.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

export default function AppRoot() {
  return (
    <AuthProvider>
      <MaybeGoogleOAuthProvider>
        <App />
      </MaybeGoogleOAuthProvider>
    </AuthProvider>
  );
}
