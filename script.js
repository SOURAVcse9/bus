// // Shared utility functions (for both student & driver pages)

// export function haversineMeters(lat1, lon1, lat2, lon2) {
//   const R = 6371000;
//   const toRad = (d) => (d * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
//   return 2 * R * Math.asin(Math.sqrt(a));
// }

// export function formatDistance(meters) {
//   if (meters == null) return "—";
//   return meters >= 1000 ? (meters / 1000).toFixed(2) + " km" : `${Math.round(meters)} m`;
// }

// export function estimateETASeconds(distanceMeters, speedKmh) {
//   const v = speedKmh && speedKmh > 3 ? speedKmh : 18; // fallback avg city bus
//   const mps = v / 3.6;
//   return Math.max(0, Math.round(distanceMeters / mps));
// }

// export function formatTimeAgo(ts) {
//   if (!ts) return "—";
//   const s = Math.floor((Date.now() - ts) / 1000);
//   if (s < 5) return "just now";
//   if (s < 60) return `${s}s ago`;
//   const m = Math.floor(s / 60);
//   if (m < 60) return `${m}m ago`;
//   const h = Math.floor(m / 60);
//   return `${h}h ago`;
// }
