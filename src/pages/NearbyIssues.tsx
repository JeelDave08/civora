import { useEffect, useState, useMemo, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin, AlertTriangle, Clock, Loader2, Navigation, Filter, Eye, MousePointerClick } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

// Fix Leaflet default marker icons (bundler issue)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Default fallback location (Rajkot, Gujarat, India)
const DEFAULT_LOCATION = { lat: 22.3039, lng: 70.8022 }

// Custom marker icons
const userIcon = new L.DivIcon({
  html: `<div style="
    width: 20px; height: 20px; 
    background: #3b82f6; 
    border: 3px solid white; 
    border-radius: 50%; 
    box-shadow: 0 0 0 3px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const statusColors: Record<string, { color: string; bg: string; marker: string }> = {
  New: { color: "text-red-500", bg: "bg-red-500/10", marker: "#ef4444" },
  Assigned: { color: "text-orange-500", bg: "bg-orange-500/10", marker: "#f97316" },
  Working: { color: "text-amber-500", bg: "bg-amber-500/10", marker: "#f59e0b" },
  Resolved: { color: "text-emerald-500", bg: "bg-emerald-500/10", marker: "#10b981" },
  Closed: { color: "text-gray-500", bg: "bg-gray-500/10", marker: "#6b7280" },
}

function createIssueIcon(status: string) {
  const markerColor = statusColors[status]?.marker || "#ef4444"
  return new L.DivIcon({
    html: `<div style="
      width: 32px; height: 32px; 
      background: ${markerColor}; 
      border: 3px solid white; 
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    ">
      <svg style="transform: rotate(45deg); width: 14px; height: 14px; color: white;" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

// Component to recenter map when user location changes
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 14)
  }, [lat, lng, map])
  return null
}

// Component to handle click-to-set-location
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface Complaint {
  _id: string
  title: string
  description?: string
  category: string
  status: string
  priority: string
  location: { lat?: number; lng?: number; address?: string }
  createdAt: string
  citizenId?: { fullName?: string }
}

// Haversine distance in km
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function NearbyIssues() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(DEFAULT_LOCATION)
  const [isGeolocated, setIsGeolocated] = useState(false)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>("All")
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null)
  const [showClickHint, setShowClickHint] = useState(false)

  const RADIUS_KM = 5

  // Try to get user's current location, fall back to default
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false)
      setShowClickHint(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsGeolocated(true)
        setLocationLoading(false)
      },
      () => {
        // Silently fall back to default location
        setLocationLoading(false)
        setShowClickHint(true)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  // Handle manual location via map click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng })
    setIsGeolocated(true)
    setShowClickHint(false)
  }, [])

  // Retry geolocation
  const retryGeolocation = useCallback(() => {
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsGeolocated(true)
        setLocationLoading(false)
        setShowClickHint(false)
      },
      () => {
        setLocationLoading(false)
        setShowClickHint(true)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }, [])

  // Fetch complaints from backend
  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch("http://localhost:5000/api/citizen/nearby-complaints", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setComplaints(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching complaints:", err)
        setLoading(false)
      })
  }, [token])

  // Filter complaints within 5km radius
  const nearbyComplaints = useMemo(() => {
    return complaints
      .filter((c) => c.location?.lat && c.location?.lng)
      .map((c) => ({
        ...c,
        distance: getDistanceKm(userLocation.lat, userLocation.lng, c.location.lat!, c.location.lng!),
      }))
      .filter((c) => c.distance <= RADIUS_KM)
      .sort((a, b) => a.distance - b.distance)
  }, [complaints, userLocation])

  const filteredComplaints = useMemo(() => {
    if (selectedFilter === "All") return nearbyComplaints
    return nearbyComplaints.filter((c) => c.status === selectedFilter)
  }, [nearbyComplaints, selectedFilter])

  const stats = useMemo(() => ({
    total: nearbyComplaints.length,
    active: nearbyComplaints.filter((c) => ["New", "Assigned", "Working"].includes(c.status)).length,
    resolved: nearbyComplaints.filter((c) => ["Resolved", "Closed"].includes(c.status)).length,
  }), [nearbyComplaints])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-heading">Nearby Issues</h1>
        <p className="text-muted-foreground mt-1">Discover and track civic issues reported in your local area.</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-heading">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Nearby</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-heading">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active Issues</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-heading">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <Card className="lg:col-span-2 flex flex-col h-[600px] overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={20} className="text-primary" /> Map View
                </CardTitle>
                <CardDescription>
                  {isGeolocated
                    ? `Showing ${nearbyComplaints.length} issues within ${RADIUS_KM}km radius`
                    : "Click on the map to set your location, or allow GPS access"}
                </CardDescription>
              </div>
              {!locationLoading && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={retryGeolocation}
                  className="gap-1.5 text-xs h-8"
                >
                  <Navigation size={12} />
                  {isGeolocated ? "Re-detect" : "Detect GPS"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 mx-6 mb-6 rounded-xl overflow-hidden border border-border relative">
            {locationLoading ? (
              <div className="flex flex-col items-center justify-center h-full bg-muted/30 gap-3">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Detecting your location...</p>
              </div>
            ) : (
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={14}
                className="h-full w-full"
                style={{ height: "100%", width: "100%", zIndex: 1 }}
                zoomControl={true}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
                <ClickHandler onMapClick={handleMapClick} />

                {/* 5km Radius Circle */}
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={RADIUS_KM * 1000}
                  pathOptions={{
                    color: "#3b82f6",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.06,
                    weight: 2,
                    dashArray: "8 4",
                  }}
                />

                {/* User Location Marker */}
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup>
                    <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
                      <strong style={{ fontSize: "14px" }}>📍 {isGeolocated ? "Your Location" : "Selected Location"}</strong>
                      <br />
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </span>
                      {!isGeolocated && (
                        <>
                          <br />
                          <span style={{ fontSize: "11px", color: "#999" }}>Click anywhere on the map to change</span>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Complaint Markers */}
                {filteredComplaints.map((complaint) => (
                  <Marker
                    key={complaint._id}
                    position={[complaint.location.lat!, complaint.location.lng!]}
                    icon={createIssueIcon(complaint.status)}
                    eventHandlers={{
                      click: () => setSelectedComplaint(complaint._id),
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: "200px", fontFamily: "sans-serif" }}>
                        <strong style={{ fontSize: "14px", display: "block", marginBottom: "4px" }}>
                          {complaint.title}
                        </strong>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: statusColors[complaint.status]?.marker + "22",
                              color: statusColors[complaint.status]?.marker,
                              fontWeight: 600,
                            }}
                          >
                            {complaint.status}
                          </span>
                          <span style={{ fontSize: "11px", color: "#888" }}>
                            {complaint.distance?.toFixed(1)} km away
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#555", margin: "4px 0" }}>
                          {complaint.category} • {complaint.priority} Priority
                        </p>
                        {complaint.location?.address && (
                          <p style={{ fontSize: "11px", color: "#888", margin: "4px 0" }}>
                            📍 {complaint.location.address.substring(0, 80)}{complaint.location.address.length > 80 ? "..." : ""}
                          </p>
                        )}
                        <p style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
                          🕐 {timeAgo(complaint.createdAt)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}

            {/* Click hint banner */}
            {showClickHint && !locationLoading && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/90 backdrop-blur-sm text-white rounded-lg px-4 py-2 shadow-lg text-xs z-[1000] flex items-center gap-2 animate-pulse">
                <MousePointerClick size={14} />
                <span>GPS unavailable — <strong>click on the map</strong> to set your location</span>
              </div>
            )}

            {/* Legend overlay */}
            <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border text-xs z-[1000]">
              <p className="font-semibold mb-1.5 text-heading">Legend</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
                  <span>Your Location</span>
                </div>
                {Object.entries(statusColors).map(([status, { marker }]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ background: marker }} />
                    <span>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Issues List */}
        <div className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter size={14} className="text-muted-foreground shrink-0" />
            {["All", "New", "Working", "Resolved"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  selectedFilter === filter
                    ? "bg-primary text-white shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[540px] pr-1" style={{ scrollbarWidth: "thin" }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 size={24} className="animate-spin mb-3" />
                <p className="text-sm">Loading issues...</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                <MapPin size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No issues found nearby</p>
                <p className="text-xs mt-1">
                  {complaints.length > 0
                    ? "No complaints with location data within 5km. Try raising a complaint with location detection enabled!"
                    : "Be the first to report an issue in your area!"}
                </p>
              </div>
            ) : (
              filteredComplaints.map((issue) => {
                const sc = statusColors[issue.status] || statusColors.New
                return (
                  <Card
                    key={issue._id}
                    className={`hover:border-primary/50 transition-all cursor-pointer ${
                      selectedComplaint === issue._id ? "border-primary shadow-md ring-1 ring-primary/20" : ""
                    }`}
                    onClick={() => setSelectedComplaint(issue._id)}
                  >
                    <CardContent className="p-4 flex gap-3">
                      <div
                        className={`h-10 w-10 rounded-full ${sc.bg} ${sc.color} flex items-center justify-center shrink-0`}
                      >
                        <AlertTriangle size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-heading text-sm truncate">{issue.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {issue.category} • {issue.distance?.toFixed(1)} km away
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}
                            >
                              {issue.status}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={10} /> {timeAgo(issue.createdAt)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/citizen/complaint/${issue._id}`)
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
