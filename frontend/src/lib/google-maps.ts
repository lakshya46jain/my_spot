type GoogleMapsNamespace = {
  maps: {
    importLibrary: (libraryName: string) => Promise<unknown>;
  };
};

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
    __initGoogleMapsMySpot__?: () => void;
  }

  interface ImportMetaEnv {
    readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";

let mapsLoaderPromise: Promise<GoogleMapsNamespace> | null = null;

function getApiKey() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "VITE_GOOGLE_MAPS_API_KEY is not set. Add it to frontend/.env.local to enable Google location search.",
    );
  }

  return apiKey;
}

export async function loadGoogleMaps() {
  if (typeof window === "undefined") {
    throw new Error("Google Maps can only be loaded in the browser.");
  }

  if (window.google?.maps?.importLibrary) {
    return window.google;
  }

  if (mapsLoaderPromise) {
    return mapsLoaderPromise;
  }

  const apiKey = getApiKey();

  mapsLoaderPromise = new Promise<GoogleMapsNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google?.maps?.importLibrary) {
          resolve(window.google);
          return;
        }

        reject(new Error("Google Maps loaded without importLibrary support."));
      });

      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Google Maps."));
      });

      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      mapsLoaderPromise = null;
      reject(new Error("Failed to load Google Maps."));
    };

    window.__initGoogleMapsMySpot__ = () => {
      if (!window.google?.maps?.importLibrary) {
        mapsLoaderPromise = null;
        reject(new Error("Google Maps loaded without importLibrary support."));
        return;
      }

      resolve(window.google);
    };

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      "&loading=async&libraries=places,geocoding&v=weekly&callback=__initGoogleMapsMySpot__";

    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
}

export async function importGoogleMapsLibrary<T = unknown>(libraryName: string) {
  const google = await loadGoogleMaps();
  return google.maps.importLibrary(libraryName) as Promise<T>;
}
