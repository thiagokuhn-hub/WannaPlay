// Função para calcular a distância entre dois pontos usando a fórmula de Haversine
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distância em km
  return d;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Função para encontrar o local mais próximo
export function findNearestLocation(
  userLat: number,
  userLon: number,
  locations: Array<{ latitude: number; longitude: number } & Record<string, any>>
) {
  if (locations.length === 0) return null;

  return locations.reduce((nearest, location) => {
    const distance = calculateDistance(
      userLat,
      userLon,
      location.latitude,
      location.longitude
    );

    if (!nearest || distance < nearest.distance) {
      return { ...location, distance };
    }
    return nearest;
  }, null as (typeof locations[0] & { distance: number }) | null);
}

// Função para formatar a distância
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} metros`;
  }
  return `${distance.toFixed(1)} km`;
}