import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin, AlertTriangle, Filter, Loader2, RefreshCw, CheckCircle2, Clock, Activity, Search, Navigation } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuth } from "../context/AuthContext"

// Fix Leaflet marker icons
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

const DEFAULT_CENTER = { lat: 23.0225, lng: 72.5714 } // Default city center

const statusColors: Record<string, { color: string; bg: string; marker: string }> = {
  New: { color: "text-red-500", bg: "bg-red-500/10", marker: "#ef4444" },
  Assigned: { color: "text-orange-500", bg: "bg-orange-500/10", marker: "#f97316" },
  Working: { color: "text-amber-500", bg: "bg-amber-500/10", marker: "#f59e0b" },
  Resolved: { color: "text-emerald-500", bg: "bg-emerald-500/10", marker: "#10b981" },
  Closed: { color: "text-gray-500", bg: "bg-gray-500/10", marker: "#6b7280" },
}

function createCustomIcon(status: string) {
  const color = statusColors[status]?.marker || "#ef4444"
  return new L.DivIcon({
    html: `<div style="
      width: 32px; height: 32px; 
      background: ${color}; 
      border: 3px solid white; 
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
    </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

// Controller to auto-fit map view to markers or searched area
function MapViewController({ center, bounds }: { center?: { lat: number; lng: number }; bounds?: L.LatLngBoundsExpression }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    } else if (center) {
      map.setView([center.lat, center.lng], 14)
    }
  }, [center, bounds, map])
  return null
}

export function MapPage() {
  const { token } = useAuth()
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      const res = await fetch("http://localhost:5000/api/admin/complaints?limit=100", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setComplaints(data.complaints || [])
      }
    } catch (err) {
      console.error("Error fetching complaints for admin map:", err)
    } finally {
      setLoading(false)
    }
  }

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = selectedStatus === "All" || c.status === selectedStatus
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory
    const hasLocation = c.location?.lat && c.location?.lng
    return matchesStatus && matchesCategory && hasLocation
  })

  // Calculate bounds if we have mapped issues
  const mapBounds: L.LatLngBoundsExpression | undefined = filteredComplaints.length > 0
    ? filteredComplaints.map(c => [c.location.lat, c.location.lng] as [number, number])
    : undefined

  // Search locality
  const handleSearchLocality = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const apiKey = import.meta.env.VITE_GEOCODE_API_KEY || "pk.0c9741909440306217e5f3b924862636"
      const res = await fetch(`https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&format=json&limit=1`)
      if (res.ok) {
        const data = await res.json()
        if (data && data[0]) {
          setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
          setIsSearching(false)
          return
        }
      }
      // Fallback OSM
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`)
      if (nomRes.ok) {
        const nomData = await nomRes.json()
        if (nomData && nomData[0]) {
          setMapCenter({ lat: parseFloat(nomData[0].lat), lng: parseFloat(nomData[0].lon) })
        }
      }
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setIsSearching(false)
    }
  }

  // Statistics
  const totalMapped = filteredComplaints.length
  const newCount = complaints.filter(c => c.status === "New").length
  const activeCount = complaints.filter(c => ["Assigned", "Working"].includes(c.status)).length
  const resolvedCount = complaints.filter(c => ["Resolved", "Closed"].includes(c.status)).length

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">City Infrastructure Map</h1>
          <p className="text-slate-500 mt-1">Live geographic visualization of civic issues, reports, and resolution statuses across the city.</p>
        </div>
        <Button onClick={fetchComplaints} variant="outline" size="sm" className="gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Map
        </Button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Mapped Issues</p>
            <p className="text-xl font-bold text-slate-800">{totalMapped}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">New Reports</p>
            <p className="text-xl font-bold text-slate-800">{newCount}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">In Progress</p>
            <p className="text-xl font-bold text-slate-800">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Resolved</p>
            <p className="text-xl font-bold text-slate-800">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Main Map Card */}
      <Card className="flex-1 flex flex-col overflow-hidden border-slate-100 shadow-sm rounded-2xl">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">Live Incident Map</CardTitle>
            <CardDescription className="text-xs text-slate-500">Interactive OpenStreetMap view integrated with LocationIQ geocoding.</CardDescription>
          </div>
          
          {/* Controls: Search + Filters */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchLocality} className="relative flex items-center">
              <Search className="absolute left-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg w-44 focus:w-56 transition-all focus:outline-none focus:border-blue-500"
              />
            </form>

            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 pl-2 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="Working">Working</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 pl-2 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Road">Road</option>
                <option value="Garbage">Garbage</option>
                <option value="Water">Water</option>
                <option value="Electricity">Electricity</option>
                <option value="Street Light">Street Light</option>
                <option value="Drainage">Drainage</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-[#4CC9B0]" />
              <p className="text-sm font-medium">Loading live map markers...</p>
            </div>
          ) : (
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={13}
              style={{ height: "100%", width: "100%", zIndex: 1 }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewController center={mapCenter} bounds={mapBounds} />

              {filteredComplaints.map((item) => {
                const sc = statusColors[item.status] || statusColors.New
                return (
                  <Marker
                    key={item._id}
                    position={[item.location.lat, item.location.lng]}
                    icon={createCustomIcon(item.status)}
                  >
                    <Popup>
                      <div className="p-1 max-w-xs font-sans">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                            {item.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{item.description}</p>
                        
                        {item.location?.address && (
                          <p className="text-[11px] text-slate-600 mb-2 bg-slate-50 p-1.5 rounded border border-slate-100 font-medium">
                            📍 {item.location.address}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                          <span>Reported by: <strong>{item.citizenId?.fullName || "Citizen"}</strong></span>
                          <span className="font-semibold text-rose-500">{item.priority} Priority</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          )}

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-100 text-xs z-[1000] space-y-1.5 min-w-[140px]">
            <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">Status Legend</p>
            {Object.entries(statusColors).map(([status, { marker }]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white shadow-sm shrink-0" style={{ background: marker }}></div>
                <span className="text-slate-600 font-medium text-[11px]">{status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
