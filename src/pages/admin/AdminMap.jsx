import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMapLocations } from "../../api/map";

// Custom colored pin markers (avoids the broken default-icon asset paths
// that react-leaflet hits under Vite). Distributor = navy blue, matching
// the brand primary; Customer = fresh green, matching the brand accent.
function pinIcon(color) {
  return L.divIcon({
    className: "",
    html: `
      <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="${color}"/>
        <circle cx="13" cy="13" r="5.5" fill="white"/>
      </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

const DISTRIBUTOR_ICON = pinIcon("#0A2D6F"); // Primary Blue
const CUSTOMER_ICON = pinIcon("#2E9E44"); // Fresh Green

// Center on Nigeria by default; Kaduna (HQ) as a sensible fallback focus.
const DEFAULT_CENTER = [9.0820, 8.6753];
const DEFAULT_ZOOM = 6;

export default function AdminMap() {
  const [locations, setLocations] = useState({ distributors: [], customers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [show, setShow] = useState({ distributors: true, customers: true });

  useEffect(() => {
    getMapLocations()
      .then(setLocations)
      .catch(() => setError("Couldn't load map data."))
      .finally(() => setLoading(false));
  }, []);

  const total = locations.distributors.length + locations.customers.length;

  const center = useMemo(() => {
    const all = [...locations.distributors, ...locations.customers];
    if (all.length === 0) return DEFAULT_CENTER;
    const avgLat = all.reduce((s, p) => s + p.latitude, 0) / all.length;
    const avgLng = all.reduce((s, p) => s + p.longitude, 0) / all.length;
    return [avgLat, avgLng];
  }, [locations]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display font-bold text-xl text-navy-900">Map View</h2>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={show.distributors}
              onChange={(e) => setShow((s) => ({ ...s, distributors: e.target.checked }))}
            />
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "#0A2D6F" }} />
            Distributors ({locations.distributors.length})
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={show.customers}
              onChange={(e) => setShow((s) => ({ ...s, customers: e.target.checked }))}
            />
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "#2E9E44" }} />
            Customers ({locations.customers.length})
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-navy-900/60">Loading…</p>
      ) : error ? (
        <p className="text-status-danger">{error}</p>
      ) : total === 0 ? (
        <p className="text-navy-900/60">
          No GPS-located distributors or customers yet. Locations are captured automatically
          the first time someone signs up with location permission enabled.
        </p>
      ) : (
        <div className="rounded-card overflow-hidden shadow-card border border-navy-900/10" style={{ height: "70vh" }}>
          <MapContainer center={center} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {show.distributors &&
              locations.distributors.map((d) => (
                <Marker key={`d-${d.userId}`} position={[d.latitude, d.longitude]} icon={DISTRIBUTOR_ICON}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-navy-900">{d.name}</p>
                      <p className="text-navy-900/60">{d.contactName}</p>
                      <p className="text-navy-900/60 mt-1">
                        {d.localGovernment ? `${d.localGovernment}, ` : ""}
                        {d.state}
                      </p>
                      <p className="text-[11px] uppercase font-bold tracking-wide mt-1 text-navy-900/40">
                        Distributor · {d.approvalStatus}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {show.customers &&
              locations.customers.map((c) => (
                <Marker key={`c-${c.userId}`} position={[c.latitude, c.longitude]} icon={CUSTOMER_ICON}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-navy-900">{c.name}</p>
                      <p className="text-navy-900/60">{c.contactName}</p>
                      <p className="text-navy-900/60 mt-1">
                        {c.localGovernment ? `${c.localGovernment}, ` : ""}
                        {c.state}
                      </p>
                      {c.deliveryAddress && (
                        <p className="text-navy-900/60">{c.deliveryAddress}</p>
                      )}
                      <p className="text-[11px] uppercase font-bold tracking-wide mt-1 text-navy-900/40">
                        Customer · {c.customerType || "—"}
                        {!c.assignedDistributorId && " · Unassigned"}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
