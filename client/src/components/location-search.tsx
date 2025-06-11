import { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationSuggestion {
  id: string;
  name: string;
  type: "neighborhood" | "locality" | "administrative_area_level_3" | "sublocality";
  fullLocation: string;
  placeId: string;
}

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
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update searchQuery when value or neighborhood prop changes
  useEffect(() => {
    // If there's a neighborhood, show it in the input field
    // Otherwise show the location value
    setSearchQuery(neighborhood || value || "");
  }, [value, neighborhood]);

  const searchPlaces = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/places/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to search places');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error searching places:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce the search to avoid too many API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    const selectedLocation = suggestion.fullLocation;
    
    if (suggestion.type === "neighborhood" || suggestion.type === "sublocality") {
      // For neighborhoods, show the neighborhood name in the input field
      const parts = selectedLocation.split(", ");
      const neighborhood = parts[0];
      const city = parts.slice(1).join(", ");
      setSearchQuery(neighborhood); // Show neighborhood in input
      onChange(city, neighborhood); // Pass city as location, neighborhood separately
    } else {
      // For cities/other locations, show the full location
      setSearchQuery(selectedLocation);
      onChange(selectedLocation);
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative">
      <Label htmlFor="location">Location *</Label>
      <div className="relative mt-1">
        <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          id="location"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
          {isLoading && (
            <div className="px-4 py-3 text-gray-500 text-sm">
              Searching...
            </div>
          )}
          {!isLoading && suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleLocationSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
            >
              <div className="flex-shrink-0">
                <MapPin size={14} className="text-gray-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{suggestion.name}</div>
                <div className="text-sm text-gray-500">
                  {suggestion.fullLocation}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}