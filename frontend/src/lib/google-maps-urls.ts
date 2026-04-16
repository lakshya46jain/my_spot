export function getGoogleMapsSearchUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function getGoogleMapsAddressSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function getGoogleMapsEmbedUrl(
  apiKey: string,
  latitude: number,
  longitude: number,
) {
  const query = encodeURIComponent(`${latitude},${longitude}`);
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${query}&zoom=15`;
}
