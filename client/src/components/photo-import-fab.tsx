import { Button } from "@/components/ui/button";
import { Camera, Users } from "lucide-react";
import { useLocation } from "wouter";

export function PhotoImportFAB() {
  const [, setLocation] = useLocation();

  return (
    <Button
      onClick={() => setLocation("/photo-import")}
      className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary-blue hover:bg-primary-blue/90 shadow-lg z-40"
      size="icon"
    >
      <div className="flex items-center">
        <Camera size={20} className="mr-1" />
        <Users size={16} />
      </div>
    </Button>
  );
}