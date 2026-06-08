import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg-app dark:bg-dark-app flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-bg-shell dark:bg-dark-shell rounded-2xl p-8 text-center border border-default dark:border-dark-default">
        <h1 className="text-2xl font-bold text-primary dark:text-dark-primary mb-4">
          404
        </h1>
        <p className="text-muted mb-6">
          Page not found. Redirecting home…
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
