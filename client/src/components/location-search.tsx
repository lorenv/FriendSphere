import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LocationSearchProps {
  value?: string;
  neighborhood?: string;
  onChange: (location: string, neighborhood?: string) => void;
  placeholder?: string;
}

export function LocationSearch({ 
  value = "", 
  neighborhood = "",
  onChange,
  placeholder = "Search neighborhoods..."
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value);

  useEffect(() => {
    setSearchQuery(neighborhood || value || "");
  }, [value, neighborhood]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center">
        <MapPin className="w-4 h-4 mr-1" />
        Location
      </label>
      <Input
        value={searchQuery}
        onChange={handleInputChange}
        placeholder={placeholder}
      />
    </div>
  );
}