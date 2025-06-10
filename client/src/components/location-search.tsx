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
  neighborhood?: string;
  onLocationChange: (location: string) => void;
  onNeighborhoodChange: (neighborhood: string) => void;
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
  neighborhood = "",
  onLocationChange, 
  onNeighborhoodChange,
  placeholder = "Search neighborhoods in Los Angeles..."
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [neighborhoodQuery, setNeighborhoodQuery] = useState(neighborhood);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedField, setFocusedField] = useState<"location" | "neighborhood" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const neighborhoodRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchQuery && !neighborhoodQuery) {
      setSuggestions([]);
      return;
    }

    const query = focusedField === "neighborhood" ? neighborhoodQuery : searchQuery;
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Generate suggestions based on the query
    const newSuggestions: LocationSuggestion[] = [];

    if (focusedField === "location") {
      // Show city suggestions
      const cities = Object.keys(mockNeighborhoods);
      cities.forEach(city => {
        if (city.toLowerCase().includes(query.toLowerCase())) {
          newSuggestions.push({
            id: city,
            name: city,
            type: "city",
            fullLocation: city
          });
        }
      });
    } else if (focusedField === "neighborhood" && searchQuery) {
      // Show neighborhood suggestions for the selected city
      const neighborhoods = mockNeighborhoods[searchQuery] || [];
      neighborhoods.forEach(hood => {
        if (hood.toLowerCase().includes(query.toLowerCase())) {
          newSuggestions.push({
            id: `${hood}-${searchQuery}`,
            name: hood,
            type: "neighborhood",
            fullLocation: `${hood}, ${searchQuery}`
          });
        }
      });
    }

    setSuggestions(newSuggestions.slice(0, 8));
  }, [searchQuery, neighborhoodQuery, focusedField]);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    if (suggestion.type === "city") {
      setSearchQuery(suggestion.name);
      onLocationChange(suggestion.name);
      setNeighborhoodQuery("");
      onNeighborhoodChange("");
    } else {
      setNeighborhoodQuery(suggestion.name);
      onNeighborhoodChange(suggestion.name);
    }
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onLocationChange(newValue);
    setShowSuggestions(true);
    
    // Clear neighborhood if location changes
    if (newValue !== searchQuery) {
      setNeighborhoodQuery("");
      onNeighborhoodChange("");
    }
  };

  const handleNeighborhoodInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setNeighborhoodQuery(newValue);
    onNeighborhoodChange(newValue);
    setShowSuggestions(true);
  };

  const handleLocationFocus = () => {
    setFocusedField("location");
    setShowSuggestions(true);
  };

  const handleNeighborhoodFocus = () => {
    setFocusedField("neighborhood");
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setFocusedField(null);
    }, 200);
  };

  return (
    <div className="space-y-4">
      {/* Location Input */}
      <div className="relative">
        <Label htmlFor="location">Location *</Label>
        <div className="relative mt-1">
          <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            ref={inputRef}
            id="location"
            value={searchQuery}
            onChange={handleLocationInputChange}
            onFocus={handleLocationFocus}
            onBlur={handleBlur}
            placeholder="e.g., Los Angeles, CA"
            className="pl-10"
          />
        </div>
      </div>

      {/* Neighborhood Input */}
      {searchQuery && (
        <div className="relative">
          <Label htmlFor="neighborhood">Neighborhood</Label>
          <div className="relative mt-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              ref={neighborhoodRef}
              id="neighborhood"
              value={neighborhoodQuery}
              onChange={handleNeighborhoodInputChange}
              onFocus={handleNeighborhoodFocus}
              onBlur={handleBlur}
              placeholder={`Search neighborhoods in ${searchQuery.split(',')[0]}...`}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                  <div className="text-sm text-gray-500">{searchQuery}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}