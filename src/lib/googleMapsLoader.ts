/**
 * Google Maps Loader Utility for InfraNexus AI
 * Loads Google Maps JavaScript API with mandatory internalUsageAttributionIds
 */

let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  if ((window as any).google && (window as any).google.maps) {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&v=weekly&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = (err) => {
      loadPromise = null;
      reject(new Error(`Failed to load Google Maps script: ${err}`));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export function getGoogleMapsApiKey(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }
  return 'AIzaSyDYHBooFTjoxokEP6GwEZNOfSQbXSTVSQ8';
}
