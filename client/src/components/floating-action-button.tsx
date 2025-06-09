import { Plus } from "lucide-react";
import { Link } from "wouter";

export function FloatingActionButton() {
  return (
    <Link href="/add-friend">
      <button className="fixed bottom-20 right-6 w-14 h-14 bg-coral text-white rounded-full floating-btn flex items-center justify-center text-xl shadow-lg z-40 hover:scale-105 transition-transform">
        <Plus size={24} />
      </button>
    </Link>
  );
}
