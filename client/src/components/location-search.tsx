import { useState, useEffect, useRef, useCallback } from "react";
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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchQuery(neighborhood || value || "");
  }, [value, neighborhood]);

  // Load Google Maps API dynamically
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Check if already loaded
        if (window.google && window.google.maps) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
          return;
        }

        // Fetch API key from backend
        const response = await fetch('/api/config/google-maps-key');
        if (!response.ok) return;
        
        const data = await response.json();
        const apiKey = data.apiKey;
        if (!apiKey) return;

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) return;

        // Create and load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = () => {
          if (window.google && window.google.maps) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
          }
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    loadGoogleMaps();
  }, []);

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        input: query,
        types: ['neighborhood', 'sublocality', 'locality'],
        componentRestrictions: { country: 'us' }
      };

      autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
        if (status === window.google?.maps?.places?.PlacesServiceStatus?.OK && predictions) {
          setSuggestions(predictions.slice(0, 5));
        } else {
          setSuggestions([]);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error searching places:', error);
      setSuggestions([]);
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setShowSuggestions(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: any) => {
    const fullAddress = suggestion.description;
    const neighborhood = suggestion.terms[0]?.value || fullAddress;
    
    console.log("LocationSearch: suggestion clicked", {
      fullAddress,
      neighborhood,
      suggestion
    });
    
    setSearchQuery(fullAddress);
    setShowSuggestions(false);
    onChange(fullAddress, neighborhood);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      console.log("LocationSearch: manual entry via Enter key", searchQuery);
      onChange(searchQuery);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-medium flex items-center">
        <MapPin className="w-4 h-4 mr-1" />
        Location
      </label>
      <div className="relative">
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id || index}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-100 last:border-b-0"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.terms[0]?.value}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.structured_formatting?.secondary_text || suggestion.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}