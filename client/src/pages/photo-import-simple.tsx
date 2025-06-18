import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PhotoImportSimple() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/friends")}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Group Import</h1>
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-600">Group Import page is working!</p>
          <p className="text-sm text-gray-500 mt-2">The full photo import functionality will load here.</p>
        </div>
      </div>
    </div>
  );
}