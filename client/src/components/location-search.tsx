import { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationSuggestion {
  id: string;
  name: string;
  type: "neighborhood" | "city";
  fullLocation: string;
}

interface LocationSearchProps {
  value?: string;
  onChange: (location: string, neighborhood?: string) => void;
  placeholder?: string;
}

// Mock neighborhood data - in a real app, this would come from a mapping API
const mockNeighborhoods: Record<string, string[]> = {
  "Los Angeles, CA": [
    "Beverly Hills", "Santa Monica", "Venice", "Hollywood", "West Hollywood",
    "Brentwood", "Westwood", "Century City", "Marina del Rey", "Culver City",
    "Koreatown", "Downtown LA", "Silver Lake", "Echo Park", "Los Feliz"
  ],
  "San Francisco, CA": [
    "Mission District", "Castro", "Nob Hill", "Pacific Heights", "Russian Hill",
    "Marina District", "SOMA", "Haight-Ashbury", "Richmond", "Sunset",
    "Chinatown", "Financial District", "Presidio", "Potrero Hill", "Hayes Valley"
  ],
  "New York, NY": [
    "SoHo", "Tribeca", "Greenwich Village", "East Village", "Chelsea",
    "Upper East Side", "Upper West Side", "Midtown", "Financial District",
    "Brooklyn Heights", "Williamsburg", "Park Slope", "DUMBO", "Long Island City"
  ],
  "Seattle, WA": [
    "Capitol Hill", "Ballard", "Fremont", "Queen Anne", "Belltown",
    "University District", "Wallingford", "Phinney Ridge", "Green Lake",
    "Madison Park", "South Lake Union", "Pioneer Square", "Georgetown"
  ]
};

export function LocationSearch({ 
  value = "", 
  onChange,
  placeholder = "Search neighborhoods in Los Angeles..."
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    // Generate suggestions based on the query
    const newSuggestions: LocationSuggestion[] = [];

    // Search through all neighborhoods across all cities
    Object.entries(mockNeighborhoods).forEach(([city, neighborhoods]) => {
      neighborhoods.forEach(neighborhood => {
        if (neighborhood.toLowerCase().includes(searchQuery.toLowerCase())) {
          newSuggestions.push({
            id: `${neighborhood}-${city}`,
            name: neighborhood,
            type: "neighborhood",
            fullLocation: `${neighborhood}, ${city}`
          });
        }
      });
      
      // Also include city matches
      if (city.toLowerCase().includes(searchQuery.toLowerCase())) {
        newSuggestions.push({
          id: city,
          name: city,
          type: "city",
          fullLocation: city
        });
      }
    });

    setSuggestions(newSuggestions.slice(0, 8));
  }, [searchQuery]);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    const selectedLocation = suggestion.fullLocation;
    setSearchQuery(selectedLocation);
    
    if (suggestion.type === "neighborhood") {
      // Extract neighborhood and city from the suggestion
      const parts = selectedLocation.split(", ");
      const neighborhood = parts[0];
      const city = parts.slice(1).join(", ");
      onChange(city, neighborhood);
    } else {
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
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleLocationSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
            >
              <div className="flex-shrink-0">
                {suggestion.type === "neighborhood" ? (
                  <Search size={14} className="text-gray-400" />
                ) : (
                  <MapPin size={14} className="text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">{suggestion.name}</div>
                {suggestion.type === "neighborhood" && (
                  <div className="text-sm text-gray-500">
                    {suggestion.fullLocation.split(", ").slice(1).join(", ")}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}