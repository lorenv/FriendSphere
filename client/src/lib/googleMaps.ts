let googleMapsLoaded = false;
let googleMapsPromise: Promise<void> | null = null;

export function loadGoogleMapsAPI(): Promise<void> {
  if (googleMapsLoaded) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    // Fetch API key from backend
    fetch('/api/config/google-maps-key')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch API key: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const apiKey = data.apiKey;
        if (!apiKey) {
          console.warn('Google Maps API key not configured, location search will be limited');
          resolve(); // Don't reject, just resolve without loading the API
          return;
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          // Script already loading or loaded
          const checkLoaded = () => {
            if (window.google && window.google.maps) {
              googleMapsLoaded = true;
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
          return;
        }

        // Create and load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        
        // Add global callback
        (window as any).initGoogleMaps = () => {
          googleMapsLoaded = true;
          resolve();
          delete (window as any).initGoogleMaps;
        };
        
        script.onerror = (error) => {
          console.error('Failed to load Google Maps API:', error);
          resolve(); // Don't reject, just resolve without the API
        };
        
        document.head.appendChild(script);
      })
      .catch(error => {
        console.error('Error loading Google Maps API:', error);
        resolve(); // Don't reject, just resolve without the API
      });
  });

  return googleMapsPromise;
}

declare global {
  interface Window {
    google: any;
  }
}