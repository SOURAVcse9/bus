// ====================== MAP SETUP ======================
const map = L.map("map").setView([0, 0], 14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// ====================== DOM ELEMENTS ======================
const busIdInput   = document.getElementById("busId");
const trackBtn     = document.getElementById("trackBtn");

// student.html এর span গুলো
const speedSpan    = document.getElementById("speed");
const latSpan      = document.getElementById("lat");
const lngSpan      = document.getElementById("lng");
// const locationSpan = document.getElementById("location");
const statusSpan   = document.getElementById("status");
const updatedSpan  = document.getElementById("updated");

// Containers
const busInfo      = document.getElementById("busInfo");
const offMsg       = document.getElementById("offMsg"); // 🚍 Route off msg

// ====================== GLOBAL VARIABLES ======================
let busMarker     = null;
let busPath       = null;
let lastUpdateTs  = null;

// Student's own marker
let myMarker      = null;
let myAccuracy    = null;
let myPos         = null;

// ====================== STUDENT LOCATION ======================
if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      myPos = { lat: latitude, lng: longitude };

      // Own marker
      if (myMarker) myMarker.setLatLng([latitude, longitude]);
      else myMarker = L.marker([latitude, longitude], {icon: L.icon({
        iconUrl: "person.png",
        iconSize: [30, 30],
      })}).addTo(map).bindPopup("You");

      // Accuracy circle
      if (myAccuracy) myAccuracy.setLatLng([latitude, longitude]).setRadius(accuracy);
      else myAccuracy = L.circle([latitude, longitude], { radius: accuracy }).addTo(map);

      // Auto center map if bus not tracked yet
      if (!busMarker) map.setView([latitude, longitude], 15);

    },
    (err) => console.error(err),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 7000 }
  );
}

// ====================== TRACK BUS ======================
trackBtn.addEventListener("click", () => {
  const busId = busIdInput.value.trim();
  if (!busId) return alert("Enter Bus ID");

  // Hide/show sections initially
  busInfo.style.display = "none";
  offMsg.style.display  = "none";

  // Remove old markers/path
  if (busMarker) { map.removeLayer(busMarker); busMarker = null; }
  if (busPath)   { map.removeLayer(busPath); busPath = null; }

  // ---------------------- BUS STATUS ----------------------
  const statusRef = db.ref(`buses/${busId}/status`);
  statusRef.on("value", (snap) => {
    const val = snap.val();

    if (val === "ended") {
      // hide info, show "off" msg
      busInfo.style.display = "none";
      offMsg.style.display  = "block";

      // remove bus marker/path from map
      if (busMarker) { map.removeLayer(busMarker); busMarker = null; }
      if (busPath)   { map.removeLayer(busPath); busPath = null; }

      statusSpan.textContent = "off";
    }
    else if (val === "live") {
      offMsg.style.display  = "none";
      busInfo.style.display = "block";
      statusSpan.textContent = "running";
    }
    else {
      busInfo.style.display = "none";
      offMsg.style.display  = "block";
      statusSpan.textContent = "—";
    }
  });

  // ---------------------- LAST LOCATION ----------------------
  const lastRef = db.ref(`buses/${busId}/last`);
  lastRef.on("value", (snap) => {
    const val = snap.val();
    if (!val) return;

    const { lat, lng, speedKmh, time } = val;
    lastUpdateTs = time;

    // Bus marker
    if (busMarker) busMarker.setLatLng([lat, lng]);
    else busMarker = L.marker([lat, lng], {icon: L.icon({
      iconUrl: "bus.png",
      iconSize: [35, 35],
    })}).addTo(map).bindPopup(`Bus: ${busId}`);

    // Map auto pan: fit both student + bus
    if (myMarker) {
      const group = L.featureGroup([myMarker, busMarker]);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    } else {
      map.setView([lat, lng], 15);
    }

    // UI update
    speedSpan.textContent    = Number(speedKmh || 0).toFixed(1) + " km/h";
    latSpan.textContent      = lat.toFixed(6);
    lngSpan.textContent      = lng.toFixed(6);
    updatedSpan.textContent  = formatTimeAgo(time);
    // locationSpan.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  });

  // ---------------------- BUS PATH ----------------------
  const pathRef = db.ref(`buses/${busId}/path`).limitToLast(200);
  pathRef.on("child_added", (snap) => {
    const p = snap.val();
    if (!p) return;
    if (!busPath) busPath = L.polyline([[p.lat, p.lng]], { color: "blue", weight: 4 }).addTo(map);
    else busPath.addLatLng([p.lat, p.lng]);
  });
});

// ====================== HELPERS ======================
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

// Auto refresh Updated field
setInterval(() => {
  if (lastUpdateTs) updatedSpan.textContent = formatTimeAgo(lastUpdateTs);
}, 1000);
