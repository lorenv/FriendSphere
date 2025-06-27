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
      .then(res => res.json())
      .then(data => {
        const apiKey = data.apiKey;
        if (!apiKey) {
          throw new Error('Google Maps API key not configured');
        }

        // Create and load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          googleMapsLoaded = true;
          resolve();
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Google Maps API'));
        };
        
        document.head.appendChild(script);
      })
      .catch(reject);
  });

  return googleMapsPromise;
}

declare global {
  interface Window {
    google: any;
  }
}