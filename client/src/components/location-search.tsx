import { useState, useEffect, useCallback } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LocationSearchProps {
  value?: string;
  neighborhood?: string;
  onChange: (location: string, neighborhood?: string) => void;
  placeholder?: string;
}

interface PlaceSuggestion {
  id: string;
  name: string;
  type: string;
  fullLocation: string;
  placeId: string;
}

export function LocationSearch({ 
  value = "", 
  neighborhood = "",
  onChange,
  placeholder = "Search neighborhoods..."
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSearchQuery(neighborhood || value || "");
  }, [value, neighborhood]);

  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
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
        throw new Error('Places search failed');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(data.suggestions?.length > 0);
    } catch (error) {
      console.error('Error searching places:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    if (newValue.length >= 2) {
      searchPlaces(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      onChange(newValue);
    }
  };

  const handleSuggestionSelect = (suggestion: PlaceSuggestion) => {
    setSearchQuery(suggestion.fullLocation);
    setShowSuggestions(false);
    onChange(suggestion.fullLocation, suggestion.name);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch('/api/places/reverse-geocode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!response.ok) {
            throw new Error('Reverse geocoding failed');
          }

          const data = await response.json();
          if (data.address) {
            setSearchQuery(data.address);
            onChange(data.address, data.neighborhood);
          }
        } catch (error) {
          console.error('Error getting location:', error);
          alert('Unable to get your current location.');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        console.error('Error getting location:', error);
        alert('Unable to get your current location.');
      }
    );
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-medium flex items-center">
        <MapPin className="w-4 h-4 mr-1" />
        Location
      </label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={searchQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{suggestion.name}</div>
                      <div className="text-xs text-gray-500">{suggestion.fullLocation}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="px-3"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>
      {isLoading && (
        <div className="text-xs text-gray-500">Searching...</div>
      )}
    </div>
  );
}