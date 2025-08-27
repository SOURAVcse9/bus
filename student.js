const map = L.map("map").setView([0, 0], 14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

const busIdInput = document.getElementById("busId");
const trackBtn   = document.getElementById("trackBtn");

const speedVal = document.getElementById("speedVal");
const distVal  = document.getElementById("distVal");
const etaVal   = document.getElementById("etaVal");
const statVal  = document.getElementById("statVal");
const timeVal  = document.getElementById("timeVal");

let myMarker = null;
let myAccuracy = null;
let busMarker = null;
let busPath = null;

let myPos = null;
let lastUpdateTs = null;

// ====================== STUDENT LOCATION ======================
if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      myPos = { lat: latitude, lng: longitude, time: Date.now() };

      if (myMarker) myMarker.setLatLng([latitude, longitude]);
      else myMarker = L.marker([latitude, longitude]).addTo(map).bindPopup("You");

      if (myAccuracy) myAccuracy.setLatLng([latitude, longitude]).setRadius(accuracy);
      else myAccuracy = L.circle([latitude, longitude], { radius: accuracy }).addTo(map);

      if (!map._meCentered) {
        map.setView([latitude, longitude], 15);
        map._meCentered = true;
      }
    },
    (err) => console.error(err),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 7000 }
  );
}

// ====================== TRACK BUS ======================
trackBtn.addEventListener("click", () => {
  const busId = busIdInput.value.trim();
  if (!busId) return alert("Enter Bus ID");

  // remove old listeners
  if (busMarker) { map.removeLayer(busMarker); busMarker = null; }
  if (busPath) { map.removeLayer(busPath); busPath = null; }

  // bus status
  const statusRef = db.ref(`buses/${busId}/status`);
  statusRef.on("value", (snap) => {
    const val = snap.val();
    if (!val) { statVal.textContent = "—"; return; }
    statVal.textContent = val === "live" ? "running" : val;
  });

  // last location
  const lastRef = db.ref(`buses/${busId}/last`);
  lastRef.on("value", (snap) => {
    const val = snap.val();
    if (!val) return;
    const { lat, lng, speedKmh, time } = val;
    lastUpdateTs = time;

    if (busMarker) busMarker.setLatLng([lat, lng]);
    else busMarker = L.marker([lat, lng]).addTo(map).bindPopup(`Bus: ${busId}`);

    if (myMarker && busMarker) {
      const group = L.featureGroup([myMarker, busMarker]);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    speedVal.textContent = Number(speedKmh || 0).toFixed(1);
    timeVal.textContent = formatTimeAgo(time);

    if (myPos) {
      const d = haversineMeters(myPos.lat, myPos.lng, lat, lng);
      distVal.textContent = formatDistance(d);

      const etaSec = estimateETASeconds(d, speedKmh);
      const mm = Math.floor(etaSec / 60);
      const ss = etaSec % 60;
      etaVal.textContent = `${mm}m ${ss}s`;
    } else {
      distVal.textContent = "—";
      etaVal.textContent = "—";
    }
  });

  // path
  const pathRef = db.ref(`buses/${busId}/path`).limitToLast(200);
  pathRef.on("child_added", (snap) => {
    const p = snap.val();
    if (!p) return;
    if (!busPath) busPath = L.polyline([[p.lat, p.lng]], { weight: 4, color: "blue" }).addTo(map);
    else busPath.addLatLng([p.lat, p.lng]);
  });
});

// ====================== HELPERS ======================
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function estimateETASeconds(distanceMeters, speedKmh) {
  if (!distanceMeters || distanceMeters <= 0) return 0;   // distance নাই = 0s ETA
  const v = (speedKmh && speedKmh > 3) ? speedKmh : 18;  // min speed fallback
  const mps = v / 3.6;
  return Math.round(distanceMeters / mps);
}

function formatDistance(meters) {
  if (meters == null) return "—";
  if (meters >= 1000) return (meters / 1000).toFixed(2) + " km";
  return Math.round(meters) + " m";
}

function formatTimeAgo(ts) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

setInterval(() => {
  if (lastUpdateTs) timeVal.textContent = formatTimeAgo(lastUpdateTs);
}, 1000);
