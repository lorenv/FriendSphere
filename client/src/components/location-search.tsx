import { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LocationSearchProps {
  value?: string;
  neighborhood?: string;
  onChange: (location: string, neighborhood?: string) => void;
  placeholder?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
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
  const placesService = useRef<any>(null);

  useEffect(() => {
    setSearchQuery(neighborhood || value || "");
  }, [value, neighborhood]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleMaps;
      document.head.appendChild(script);
    } else if (window.google) {
      initializeGoogleMaps();
    }
  }, []);

  const initializeGoogleMaps = () => {
    if (window.google && window.google.maps) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesService.current = new window.google.maps.places.PlacesService(map);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    if (newValue.length > 2 && autocompleteService.current) {
      setIsLoading(true);
      autocompleteService.current.getPlacePredictions(
        {
          input: newValue,
          types: ['(regions)'],
          componentRestrictions: { country: 'us' }
        },
        (predictions: any[], status: any) => {
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5));
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      onChange(newValue);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    const description = suggestion.description;
    setSearchQuery(description);
    setShowSuggestions(false);
    
    // Extract neighborhood from the place description
    const parts = description.split(', ');
    const neighborhood = parts[0];
    
    onChange(description, neighborhood);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };
          
          geocoder.geocode({ location: latlng }, (results: any[], status: any) => {
            setIsLoading(false);
            if (status === 'OK' && results[0]) {
              const address = results[0].formatted_address;
              setSearchQuery(address);
              
              // Extract neighborhood from the address components
              const addressComponents = results[0].address_components;
              const neighborhood = addressComponents.find((component: any) => 
                component.types.includes('neighborhood') || 
                component.types.includes('sublocality')
              )?.long_name || addressComponents[0]?.long_name;
              
              onChange(address, neighborhood);
            }
          });
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
            ref={inputRef}
            value={searchQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.place_id || index}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm">{suggestion.description}</span>
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