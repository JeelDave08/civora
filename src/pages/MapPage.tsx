import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin, AlertTriangle, Filter, Loader2, RefreshCw, CheckCircle2, Clock, Activity, Search, Navigation, UserCheck, Briefcase, Eye, X, User, Calendar, Image as ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
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

const DEFAULT_CENTER = { lat: 22.3039, lng: 70.8022 } // Default to Rajkot, Gujarat, India

// Haversine distance in kilometers
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

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
      width: 34px; height: 34px; 
      background: ${color}; 
      border: 3px solid white; 
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    ">
      <div style="width: 12px; height: 12px; background: white; border-radius: 50%;"></div>
    </div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  })
}

// Controller to auto-fit map view to markers or center
function MapViewController({ center, bounds }: { center?: { lat: number; lng: number }; bounds?: L.LatLngBoundsExpression }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    } else if (center) {
      map.setView([center.lat, center.lng], 13)
    }
  }, [center, bounds, map])
  return null
}

export function MapPage() {
  const { token } = useAuth()
  const [complaints, setComplaints] = useState<any[]>([])
  const [personnel, setPersonnel] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRadius, setSelectedRadius] = useState<string>("5") // Default 5km range
  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null)
  const [assigningWorkerId, setAssigningWorkerId] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignSuccess, setAssignSuccess] = useState(false)

  useEffect(() => {
    fetchComplaints()
    fetchPersonnel()

    // Auto-detect actual user GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        (err) => {
          console.warn("Geolocation warning/permission denied, falling back to Rajkot center:", err)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }, [])

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      const res = await fetch("http://localhost:5000/api/admin/complaints?limit=200", {
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

  const fetchPersonnel = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/personnel", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPersonnel(data || [])
      }
    } catch (err) {
      console.error("Error fetching personnel:", err)
    }
  }

  // Filter complaints based on status, category, and Kilometer Radius Range
  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = selectedStatus === "All" || c.status === selectedStatus
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory
    const hasLocation = c.location?.lat && c.location?.lng

    let matchesRadius = true
    if (selectedRadius !== "All" && hasLocation) {
      const dist = getDistanceKm(mapCenter.lat, mapCenter.lng, c.location.lat, c.location.lng)
      matchesRadius = dist <= parseFloat(selectedRadius)
    }

    return matchesStatus && matchesCategory && hasLocation && matchesRadius
  })

  // Assign worker/supervisor directly from modal
  const handleAssignPersonnel = async () => {
    if (!selectedComplaint || !assigningWorkerId) return
    setIsAssigning(true)
    setAssignSuccess(false)
    try {
      const res = await fetch(`http://localhost:5000/api/admin/complaints/${selectedComplaint._id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ workerId: assigningWorkerId })
      })
      if (res.ok) {
        setAssignSuccess(true)
        fetchComplaints()
        setTimeout(() => setAssignSuccess(false), 3000)
      }
    } catch (err) {
      console.error("Error assigning personnel:", err)
    } finally {
      setIsAssigning(false)
    }
  }

  // Search locality via LocationIQ/OSM
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

  // Stats
  const totalMapped = filteredComplaints.length
  const newCount = complaints.filter(c => c.status === "New").length
  const activeCount = complaints.filter(c => ["Assigned", "Working"].includes(c.status)).length
  const resolvedCount = complaints.filter(c => ["Resolved", "Closed"].includes(c.status)).length

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">City Infrastructure Map</h1>
          <p className="text-slate-500 mt-1">Live geographic visualization with custom kilometer range filtering and full issue details.</p>
        </div>
        <Button onClick={fetchComplaints} variant="outline" size="sm" className="gap-2 rounded-xl">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Map
        </Button>
      </div>

      {/* Top Telemetry Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Mapped in Range ({selectedRadius === "All" ? "All City" : `${selectedRadius}km`})</p>
            <p className="text-xl font-bold text-slate-800">{totalMapped}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">New Reports</p>
            <p className="text-xl font-bold text-slate-800">{newCount}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">In Progress</p>
            <p className="text-xl font-bold text-slate-800">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
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
            <CardDescription className="text-xs text-slate-500">Interactive map view with customizable kilometer range circle overlay.</CardDescription>
          </div>
          
          {/* Controls: Search + Kilometer Radius Range + Status + Category */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchLocality} className="relative flex items-center">
              <Search className="absolute left-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search locality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl w-40 focus:w-52 transition-all focus:outline-none focus:border-blue-500"
              />
            </form>

            {/* KILOMETER RANGE DROPDOWN (Default 5km) */}
            <div className="flex items-center gap-1.5 bg-blue-50/70 p-1 px-2.5 rounded-xl border border-blue-100">
              <Navigation size={13} className="text-blue-600" />
              <span className="text-xs text-blue-900 font-bold">Range:</span>
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(e.target.value)}
                className="text-xs bg-white border border-blue-200 rounded-lg px-2.5 py-1 font-bold text-blue-700 focus:outline-none cursor-pointer shadow-sm"
              >
                <option value="5">5 km (Default)</option>
                <option value="10">10 km</option>
                <option value="15">15 km</option>
                <option value="20">20 km</option>
                <option value="50">50 km</option>
                <option value="All">All City (Unlimited)</option>
              </select>
            </div>

            {/* STATUS FILTER */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 px-2 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold pl-1">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="Working">Working</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* CATEGORY FILTER */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 px-2 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold pl-1">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none cursor-pointer"
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
              zoom={selectedRadius === "5" ? 13 : selectedRadius === "10" ? 12 : selectedRadius === "15" ? 11 : 10}
              style={{ height: "100%", width: "100%", zIndex: 1 }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewController center={mapCenter} />

              {/* VISUAL KILOMETER RANGE CIRCLE OVERLAY */}
              {selectedRadius !== "All" && (
                <Circle
                  center={[mapCenter.lat, mapCenter.lng]}
                  radius={parseFloat(selectedRadius) * 1000}
                  pathOptions={{
                    color: "#3b82f6",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.08,
                    weight: 2.5,
                    dashArray: "6, 6",
                  }}
                />
              )}

              {filteredComplaints.map((item) => {
                const sc = statusColors[item.status] || statusColors.New
                return (
                  <Marker
                    key={item._id}
                    position={[item.location.lat, item.location.lng]}
                    icon={createCustomIcon(item.status)}
                    eventHandlers={{
                      click: () => {
                        setSelectedComplaint(item)
                        setAssigningWorkerId(item.workerId?._id || item.workerId || "")
                      }
                    }}
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
                        
                        <button
                          onClick={() => {
                            setSelectedComplaint(item)
                            setAssigningWorkerId(item.workerId?._id || item.workerId || "")
                          }}
                          className="w-full py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 mt-1"
                        >
                          <Eye size={12} /> View Full Complaint Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          )}

          {/* Kilometer Radius Legend Badge */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-slate-200 text-xs z-[1000] flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></span>
            <span className="font-bold text-slate-700">
              Active Radius: <span className="text-blue-600 font-extrabold">{selectedRadius === "All" ? "All City" : `${selectedRadius} km Circle`}</span>
            </span>
          </div>

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

      {/* FULL COMPLAINT DETAIL & ASSIGNMENT MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 font-sans">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[selectedComplaint.status]?.bg || 'bg-slate-100'} ${statusColors[selectedComplaint.status]?.color || 'text-slate-700'}`}>
                    {selectedComplaint.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                    {selectedComplaint.category}
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg">
                    {selectedComplaint.priority} Priority
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{selectedComplaint.title}</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* User Reporter Info */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {selectedComplaint.citizenId?.fullName?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Reported By Citizen</p>
                  <p className="text-sm font-bold text-slate-800">{selectedComplaint.citizenId?.fullName || 'Citizen User'}</p>
                  {selectedComplaint.citizenId?.email && (
                    <p className="text-xs text-slate-500">{selectedComplaint.citizenId.email}</p>
                  )}
                </div>
              </div>

              {/* Location Address */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Location</h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2 text-sm text-slate-700 font-medium">
                  <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{selectedComplaint.location?.address || `${selectedComplaint.location?.lat}, ${selectedComplaint.location?.lng}`}</span>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Complaint Description</h4>
                <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedComplaint.description || "No description provided."}
                </p>
              </div>

              {/* Images */}
              {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ImageIcon size={14} /> Attached Photos ({selectedComplaint.images.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedComplaint.images.map((imgUrl: string, idx: number) => (
                      <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl overflow-hidden border border-slate-200 block h-28 bg-slate-100 hover:opacity-90 transition-opacity">
                        <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Personnel Assignment */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UserCheck size={15} className="text-blue-600" /> Assign Supervisor or Field Worker
                </h4>
                <div className="flex gap-2">
                  <select
                    value={assigningWorkerId}
                    onChange={(e) => setAssigningWorkerId(e.target.value)}
                    className="flex-1 h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Personnel to Assign...</option>
                    {personnel.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.fullName} ({p.role.toUpperCase()} — {p.city || 'General'})
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleAssignPersonnel}
                    disabled={isAssigning || !assigningWorkerId}
                    className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 transition-all disabled:opacity-50"
                  >
                    {isAssigning ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                    Assign
                  </Button>
                </div>

                {assignSuccess && (
                  <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <CheckCircle2 size={14} /> Personnel successfully assigned to complaint!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
