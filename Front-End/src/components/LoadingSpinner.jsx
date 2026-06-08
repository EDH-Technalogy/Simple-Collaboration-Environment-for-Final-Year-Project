import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ fullPage = true }) {
  return (
    <div className={`flex justify-center items-center ${fullPage ? "min-h-[60vh]" : "py-12"}`}>
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}