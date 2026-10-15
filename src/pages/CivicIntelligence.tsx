import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {
  MapPin, AlertTriangle, RefreshCw, CheckCircle2, Clock, Activity, Search,
  Navigation, UserCheck, Eye, X, Flame, ShieldAlert, Users, Layers,
  Sparkles, SlidersHorizontal, ArrowUpRight, CheckCircle, Calendar,
  Building, ChevronRight, BarChart3, Filter
} from "lucide-react"
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

const DEFAULT_CENTER = { lat: 22.3039, lng: 70.8022 } // Rajkot, Gujarat, India

// Standardized Category Colors as specified in requirements
export const categoryColors: Record<string, { marker: string; bg: string; text: string; icon: string }> = {
  Road: { marker: "#ef4444", bg: "bg-red-50 border-red-200", text: "text-red-700", icon: "🔴" },
  Pothole: { marker: "#ef4444", bg: "bg-red-50 border-red-200", text: "text-red-700", icon: "🔴" },
  Garbage: { marker: "#f97316", bg: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: "🟠" },
  Waste: { marker: "#f97316", bg: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: "🟠" },
  "Street Light": { marker: "#eab308", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: "🟡" },
  Electricity: { marker: "#eab308", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: "🟡" },
  Water: { marker: "#3b82f6", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: "🔵" },
  Drainage: { marker: "#a855f7", bg: "bg-purple-50 border-purple-200", text: "text-purple-700", icon: "🟣" },
  Parks: { marker: "#22c55e", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: "🟢" },
  Building: { marker: "#854d0e", bg: "bg-amber-950/10 border-amber-900/20", text: "text-amber-900", icon: "🟤" },
  Other: { marker: "#64748b", bg: "bg-slate-100 border-slate-200", text: "text-slate-700", icon: "⚫" },
}

// Marker Icon Generator
function createCategoryMarkerIcon(category: string, priority: string, isCommunity: boolean) {
  const catKey = Object.keys(categoryColors).find(k => (category || '').toLowerCase().includes(k.toLowerCase())) || 'Other';
  const color = categoryColors[catKey]?.marker || "#64748b";
  const ringColor = priority === 'Critical' ? '#be123c' : priority === 'High' ? '#f59e0b' : '#3b82f6';
  const size = isCommunity ? 38 : 32;

  return new L.DivIcon({
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${color};
        border: 3px solid ${isCommunity ? '#f59e0b' : 'white'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <div style="
          width: ${size / 2.8}px; height: ${size / 2.8}px;
          background: white;
          border-radius: 50%;
          box-shadow: inset 0 0 2px rgba(0,0,0,0.2);
        "></div>
      </div>
    `,
    className: "civic-map-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

// Controller to auto-fit map center & zoom dynamically
function MapViewController({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

export function CivicIntelligence() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [summary, setSummary] = useState<any>({
    totalIssues: 0,
    activeIssues: 0,
    resolvedIssues: 0,
    communityIssues: 0,
    slaBreachedIssues: 0,
    categoryCounts: { Road: 0, Garbage: 0, 'Street Light': 0, Water: 0, Drainage: 0, Parks: 0, Building: 0, Other: 0 }
  })
  const [hotspots, setHotspots] = useState<any[]>([])
  const [complaints, setComplaints] = useState<any[]>([])

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [selectedPriority, setSelectedPriority] = useState<string>("All")
  const [selectedWard, setSelectedWard] = useState<string>("All")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All")
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("30")
  const [communityOnly, setCommunityOnly] = useState<boolean>(false)
  const [selectedAiStatus, setSelectedAiStatus] = useState<string>("All")
  const [selectedSlaStatus, setSelectedSlaStatus] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Map view controls
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState<number>(12)
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null)
  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null)

  useEffect(() => {
    fetchIntelligenceData()

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }, [selectedCategory, selectedStatus, selectedPriority, selectedWard, selectedDepartment, selectedTimeframe, communityOnly, selectedAiStatus, selectedSlaStatus])

  const fetchIntelligenceData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (selectedCategory !== "All") params.append("category", selectedCategory)
      if (selectedStatus !== "All") params.append("status", selectedStatus)
      if (selectedPriority !== "All") params.append("priority", selectedPriority)
      if (selectedWard !== "All") params.append("ward", selectedWard)
      if (selectedDepartment !== "All") params.append("department", selectedDepartment)
      if (selectedTimeframe !== "All") params.append("days", selectedTimeframe)
      if (communityOnly) params.append("communityOnly", "true")
      if (selectedAiStatus !== "All") params.append("aiStatus", selectedAiStatus)
      if (selectedSlaStatus !== "All") params.append("slaStatus", selectedSlaStatus)

      const res = await fetch(`http://10.152.129.95:5000/api/admin/civic-intelligence/map?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary || summary)
        setHotspots(data.hotspots || [])
        setComplaints(data.complaints || [])
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      } else {
        setError("Unable to load civic intelligence data. Please check backend server connection.")
      }
    } catch (err: any) {
      console.error("Error loading civic intelligence map:", err)
      setError("Unable to load civic intelligence data: " + (err.message || "Network error"))
    } finally {
      setLoading(false)
    }
  }

  // Filter complaints client-side search query
  const filteredComplaints = complaints.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (c.title || '').toLowerCase().includes(q);
    const catMatch = (c.category || '').toLowerCase().includes(q);
    const addrMatch = (c.location?.address || '').toLowerCase().includes(q);
    const idMatch = String(c._id).toLowerCase().includes(q);
    return titleMatch || catMatch || addrMatch || idMatch;
  });

  // Calculate Spatial Heat Density Circles (Group complaints into clusters for visual heatmap)
  const heatClusters = hotspots.map(h => {
    let intensityColor = "#ef4444"; // Red for high density
    let fillOpacity = 0.25;
    let radius = 1200;

    if (h.count > 15) {
      intensityColor = "#ef4444"; // High intensity
      fillOpacity = 0.35;
      radius = 1800;
    } else if (h.count > 5) {
      intensityColor = "#f59e0b"; // Medium intensity
      fillOpacity = 0.25;
      radius = 1400;
    } else {
      intensityColor = "#3b82f6"; // Low intensity
      fillOpacity = 0.18;
      radius = 1000;
    }

    return {
      ...h,
      intensityColor,
      fillOpacity,
      radius
    };
  });

  const handleHotspotClick = (h: any) => {
    setSelectedHotspot(h)
    setMapCenter({ lat: h.lat, lng: h.lng })
    setMapZoom(14)
  }

  const recenterGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setMapZoom(14)
      })
    }
  }

  const topCategoryEntry = Object.entries(summary.categoryCounts || {}).sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]
  const topCategoryName = topCategoryEntry ? String(topCategoryEntry[0]) : 'Road'
  const topCategoryCount = topCategoryEntry ? Number(topCategoryEntry[1]) : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* Header Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 lg:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-[#4CC9B0]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#4CC9B0]">
            <Sparkles size={14} /> City Intelligence Platform
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
            🗺️ Civic Problem Heatmap
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Live geographic density analytics, multi-level ward drill-down, and spatial issue monitoring across the municipality.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 font-medium block">Last Updated</span>
            <span className="text-xs font-bold text-[#4CC9B0]">{lastUpdated || "Just now"}</span>
          </div>
          <Button
            onClick={fetchIntelligenceData}
            disabled={loading}
            className="bg-[#4CC9B0] hover:bg-[#3bb59d] text-slate-950 font-bold rounded-xl h-11 px-5 gap-2 shadow-lg transition-all"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh Map Data
          </Button>
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-800 text-sm font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-600" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchIntelligenceData} variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-100">
            Retry
          </Button>
        </div>
      )}

      {/* City Overview Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Mapped</span>
          <p className="text-2xl font-black text-slate-900">{summary.totalIssues}</p>
          <span className="text-[10px] font-bold text-slate-500 block">All matching filters</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block flex items-center gap-1">
            <Flame size={13} /> Active Issues
          </span>
          <p className="text-2xl font-black text-rose-700">{summary.activeIssues}</p>
          <span className="text-[10px] font-bold text-rose-500 block">Needs field resolution</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 size={13} /> Resolved Today
          </span>
          <p className="text-2xl font-black text-emerald-700">{summary.resolvedIssues}</p>
          <span className="text-[10px] font-bold text-emerald-500 block">Verified & closed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block flex items-center gap-1">
            <Users size={13} /> Community Hotspots
          </span>
          <p className="text-2xl font-black text-amber-700">{summary.communityIssues}</p>
          <span className="text-[10px] font-bold text-amber-600 block">Multiple citizen reports</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block flex items-center gap-1">
            <ShieldAlert size={13} /> SLA Breaches
          </span>
          <p className="text-2xl font-black text-purple-700">{summary.slaBreachedIssues}</p>
          <span className="text-[10px] font-bold text-purple-500 block">Exceeded resolution SLA</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block flex items-center gap-1">
            <BarChart3 size={13} /> Top Category
          </span>
          <p className="text-lg font-extrabold text-blue-900 truncate">
            {topCategoryName}
          </p>
          <span className="text-[10px] font-bold text-blue-600 block">
            {topCategoryCount} issues
          </span>
        </div>
      </div>

      {/* Category Distribution Legend Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 overflow-x-auto">
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider shrink-0 flex items-center gap-1">
          <Layers size={14} /> Category Breakdown:
        </span>
        <div className="flex items-center gap-2 flex-nowrap">
          {Object.entries(summary.categoryCounts || {}).map(([cat, count]: any) => {
            const colors = categoryColors[cat] || categoryColors.Other;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? "All" : cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat ? "ring-2 ring-slate-900 bg-slate-900 text-white" : `${colors.bg} ${colors.text}`
                }`}
              >
                <span>{colors.icon}</span>
                <span>{cat}:</span>
                <span className="font-black">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter Control Bar */}
      <Card className="rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-[#4CC9B0]" />
            <CardTitle className="text-base font-bold text-slate-800">Intelligence Filters</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search location or complaint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 focus:w-64 transition-all focus:outline-none focus:border-[#4CC9B0]"
              />
            </div>
            {(selectedCategory !== "All" || selectedStatus !== "All" || selectedPriority !== "All" || selectedWard !== "All" || selectedDepartment !== "All" || communityOnly) && (
              <Button
                onClick={() => {
                  setSelectedCategory("All")
                  setSelectedStatus("All")
                  setSelectedPriority("All")
                  setSelectedWard("All")
                  setSelectedDepartment("All")
                  setSelectedTimeframe("30")
                  setCommunityOnly(false)
                  setSelectedAiStatus("All")
                  setSelectedSlaStatus("All")
                  setSearchQuery("")
                }}
                variant="ghost"
                size="sm"
                className="text-xs text-rose-600 hover:bg-rose-50"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#4CC9B0]"
            >
              <option value="All">All Categories</option>
              <option value="Road">Road / Potholes</option>
              <option value="Garbage">Garbage / Waste</option>
              <option value="Street Light">Street Light</option>
              <option value="Water">Water Supply</option>
              <option value="Drainage">Drainage</option>
              <option value="Parks">Parks & Spaces</option>
              <option value="Building">Building & Const.</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#4CC9B0]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="New">New</option>
              <option value="Assigned">Assigned</option>
              <option value="Working">Working</option>
              <option value="Pending Citizen Verification">Verification</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#4CC9B0]"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Ward Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ward / Area</label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#4CC9B0]"
            >
              <option value="All">All Wards</option>
              <option value="Ward 1">Ward 1</option>
              <option value="Ward 2">Ward 2</option>
              <option value="Ward 3">Ward 3</option>
              <option value="Ward 4">Ward 4</option>
              <option value="Ward 5">Ward 5</option>
              <option value="Ward 8">Ward 8</option>
              <option value="Ward 12">Ward 12</option>
            </select>
          </div>

          {/* Department Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#4CC9B0]"
            >
              <option value="All">All Depts</option>
              <option value="Roads & Transport">Roads & Transport</option>
              <option value="Waste Management">Waste Management</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Electricity">Electricity</option>
              <option value="Public Safety">Public Safety</option>
            </select>
          </div>

          {/* Timeframe Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time Range</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#4CC9B0]"
            >
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="15">Last 15 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="All">All Time</option>
            </select>
          </div>

          {/* SLA Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SLA Status</label>
            <select
              value={selectedSlaStatus}
              onChange={(e) => setSelectedSlaStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#4CC9B0]"
            >
              <option value="All">All SLA</option>
              <option value="On Track">On Track</option>
              <option value="Due Soon">Due Soon (&lt; 24h)</option>
              <option value="Overdue">Overdue / Breached</option>
            </select>
          </div>

          {/* Community Issues Toggle */}
          <div className="space-y-1 flex flex-col justify-end">
            <button
              onClick={() => setCommunityOnly(!communityOnly)}
              className={`w-full h-9 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                communityOnly ? "bg-amber-500 text-white border-amber-600 shadow-sm" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Users size={14} /> Community Only
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Hotspots Panel + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: 🔥 Top Civic Hotspots Ranking Panel */}
        <Card className="lg:col-span-1 rounded-3xl border-slate-100 shadow-sm bg-white flex flex-col h-[650px] overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="text-rose-500 animate-pulse" size={18} /> Top Civic Hotspots
              </CardTitle>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {hotspots.length} Wards
              </span>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Ranked by complaint concentration. Click to auto-zoom map.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-3 overflow-y-auto space-y-3.5 flex-1">
            {hotspots.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-medium space-y-2">
                <MapPin className="mx-auto text-slate-300" size={32} />
                <p className="text-xs">No active hotspots found for the selected filters.</p>
              </div>
            ) : (
              hotspots.map((h, idx) => (
                <div
                  key={h.ward}
                  onClick={() => handleHotspotClick(h)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${
                    selectedHotspot?.ward === h.ward ? "border-[#4CC9B0] bg-[#4CC9B0]/5 ring-2 ring-[#4CC9B0]/20" : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#4CC9B0] transition-colors">
                        {h.ward}
                      </h4>
                    </div>
                    <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                      {h.count} Issues
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[11px] pt-1 border-t border-slate-100 mt-2 text-slate-500">
                    <div>Active: <strong className="text-rose-600">{h.activeCount}</strong></div>
                    <div>Resolved: <strong className="text-emerald-600">{h.resolvedCount}</strong></div>
                    <div>Community: <strong className="text-amber-600">{h.communityCount}</strong></div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right Column: Full Interactive Heatmap View */}
        <Card className="lg:col-span-3 rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col h-[650px] relative">
          <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
            <Button
              onClick={recenterGPS}
              size="sm"
              className="bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-md rounded-xl text-xs gap-1.5"
            >
              <Navigation size={13} className="text-[#4CC9B0]" /> Recenter My GPS
            </Button>

            {selectedHotspot && (
              <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 animate-in fade-in">
                <span>📍 Zoomed to {selectedHotspot.ward}</span>
                <X size={12} className="cursor-pointer hover:text-rose-400" onClick={() => setSelectedHotspot(null)} />
              </span>
            )}
          </div>

          <CardContent className="p-0 flex-1 relative h-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full bg-slate-50 gap-3 text-slate-400">
                <RefreshCw size={32} className="animate-spin text-[#4CC9B0]" />
                <p className="text-sm font-semibold">Loading city intelligence heatmap points...</p>
              </div>
            ) : (
              <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewController center={mapCenter} zoom={mapZoom} />

                {/* Spatial Heat Density Visual Layer */}
                {heatClusters.map((cluster) => (
                  <Circle
                    key={`heat-${cluster.ward}`}
                    center={[cluster.lat, cluster.lng]}
                    radius={cluster.radius}
                    pathOptions={{
                      color: cluster.intensityColor,
                      fillColor: cluster.intensityColor,
                      fillOpacity: cluster.fillOpacity,
                      weight: 2,
                      dashArray: "4, 4"
                    }}
                  />
                ))}

                {/* Individual Complaint Markers */}
                {filteredComplaints.map((item) => {
                  const lat = item.location?.lat || 22.3039;
                  const lng = item.location?.lng || 70.8022;
                  const isCommunity = (item.communityIssue?.supporterCount || 0) > 1 || item.communityIssue?.isPrimary;
                  const colors = categoryColors[item.category] || categoryColors.Other;

                  return (
                    <Marker
                      key={item._id}
                      position={[lat, lng]}
                      icon={createCategoryMarkerIcon(item.category, item.priority, isCommunity)}
                    >
                      <Popup>
                        <div className="p-1.5 max-w-xs font-sans space-y-2">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {colors.icon} {item.category}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {item.status}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>

                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px] space-y-1 text-slate-600">
                            <div>📍 <strong>Location:</strong> {item.location?.address || `${lat}, ${lng}`}</div>
                            <div>👤 <strong>Citizen:</strong> {item.citizenId?.fullName || 'Citizen'}</div>
                            {item.workerId && (
                              <div>🔧 <strong>Assigned:</strong> {typeof item.workerId === 'object' ? item.workerId.fullName : 'Worker'}</div>
                            )}
                            {isCommunity && (
                              <div className="text-amber-700 font-bold bg-amber-50 p-1 rounded border border-amber-200">
                                👥 {item.communityIssue?.supporterCount || 1} Citizens Affected
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => setSelectedComplaint(item)}
                            className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Eye size={13} /> View Full Complaint Details
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            )}

            {/* Heat Intensity Legend Overlay */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 text-xs z-[1000] space-y-2 min-w-[160px]">
              <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1">
                <Flame size={14} className="text-rose-500" /> Heatmap Legend
              </p>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-500 opacity-80 shadow-sm shrink-0"></div>
                  <span className="text-slate-700 font-bold text-[11px]">High Density (&gt;15)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 opacity-80 shadow-sm shrink-0"></div>
                  <span className="text-slate-700 font-bold text-[11px]">Medium Density (5-15)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 opacity-80 shadow-sm shrink-0"></div>
                  <span className="text-slate-700 font-bold text-[11px]">Low Density (&lt;5)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FULL COMPLAINT DETAIL MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 font-sans">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-white">
                    #CMP-{String(selectedComplaint._id).slice(-4).toUpperCase()}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    {selectedComplaint.status}
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-lg">
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

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
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

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Location</h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2 text-sm text-slate-700 font-medium">
                  <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{selectedComplaint.location?.address || `${selectedComplaint.location?.lat}, ${selectedComplaint.location?.lng}`}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Description</h4>
                <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedComplaint.description || "No description provided."}
                </p>
              </div>

              {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attached Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedComplaint.images.map((imgUrl: string, idx: number) => (
                      <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl overflow-hidden border border-slate-200 block h-28 bg-slate-100 hover:opacity-90 transition-opacity">
                        <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

