import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Navigation2, Loader2, Navigation, ExternalLink } from "lucide-react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
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

const DEFAULT_LOCATION = { lat: 22.3039, lng: 70.8022 } // Rajkot, Gujarat, India

const workerPinIcon = new L.DivIcon({
  html: `<div style="
    width: 22px; height: 22px; 
    background: #4CC9B0; 
    border: 3px solid white; 
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(76, 201, 176, 0.3), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function createTaskPin(priority: string) {
  const color = priority === "Critical" || priority === "High" ? "#ef4444" : "#f59e0b"
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

function RecenterController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 14)
  }, [lat, lng, map])
  return null
}

export function WorkerMap() {
  const { token } = useAuth()
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
    fetchWorkerTasks()
  }, [])

  const fetchWorkerTasks = async () => {
    try {
      setLoading(true)
      const res = await fetch("http://localhost:5000/api/worker/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || data.assignedComplaints || [])
      }
    } catch (err) {
      console.error("Error fetching worker tasks:", err)
    } finally {
      setLoading(false)
    }
  }

  const recenterGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      })
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto font-sans h-full flex flex-col"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Task Navigation Map</h1>
          <p className="mt-1 text-slate-500">View exact task locations and get directions to assigned complaints.</p>
        </div>
        <button 
          onClick={recenterGPS} 
          className="h-10 px-4 rounded-xl bg-white text-slate-700 font-bold shadow-sm border border-slate-200 flex items-center gap-2 text-xs hover:bg-slate-50"
        >
          <Navigation size={14} className="text-[#4CC9B0]" /> Recenter My GPS
        </button>
      </div>

      <div className="flex-1 min-h-[500px] relative rounded-[32px] overflow-hidden border-4 border-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] bg-slate-100 flex flex-col z-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-[#4CC9B0]" />
            <p className="text-sm font-medium">Loading task map location markers...</p>
          </div>
        ) : (
          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterController lat={userLocation.lat} lng={userLocation.lng} />

            {/* Worker GPS Marker */}
            <Marker position={[userLocation.lat, userLocation.lng]} icon={workerPinIcon}>
              <Popup>
                <div className="p-1 font-sans text-xs text-center font-bold text-slate-800">
                  📍 Your Location
                </div>
              </Popup>
            </Marker>

            {/* Assigned Task Markers */}
            {tasks.map((task) => {
              const lat = task.location?.lat || 23.0225 + (Math.random() - 0.5) * 0.04
              const lng = task.location?.lng || 72.5714 + (Math.random() - 0.5) * 0.04
              const address = task.location?.address || "Assigned Spot"

              return (
                <Marker key={task._id} position={[lat, lng]} icon={createTaskPin(task.priority)}>
                  <Popup>
                    <div className="p-1 font-sans max-w-xs">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {task.status || "Assigned"}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1 mb-1">{task.title}</h4>
                      <p className="text-xs text-slate-500 mb-2">{task.description}</p>
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 mb-2">
                        📍 {address}
                      </p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        <ExternalLink size={12} /> Open in Google Maps
                      </a>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        )}
      </div>
    </motion.div>
  )
}
