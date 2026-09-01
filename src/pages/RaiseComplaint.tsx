import { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../context/AuthContext"
import { MapPin, Camera, Video, Upload, CheckCircle, ArrowRight, ArrowLeft, Navigation, X, RefreshCw, Loader2, Search, Target, Sparkles, AlertTriangle, Edit3, ShieldAlert, Users, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

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

const DEFAULT_CENTER = { lat: 23.0225, lng: 72.5714 } // Ahmedabad City Center

const categories = [
  "Road", "Garbage", "Water", "Electricity", "Street Light", "Drainage", "Building", "Other"
]

export interface AiImageAnalysisResult {
  detectedIssue: string
  confidenceScore: number
  suggestedCategory: string
  suggestedPriority: string
  suggestedDepartment: string
  status: 'NOT_ANALYZED' | 'ANALYZING' | 'COMPLETED' | 'FAILED'
  error?: string
}

// Custom interactive map picker marker icon
const locationPinIcon = new L.DivIcon({
  html: `<div style="
    width: 36px; height: 36px; 
    background: #ef4444; 
    border: 3px solid white; 
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    display: flex; align-items: center; justify-content: center;
  ">
    <div style="width: 12px; height: 12px; background: white; border-radius: 50%;"></div>
  </div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
})

// Recenter Map Helper
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 16)
  }, [lat, lng, map])
  return null
}

// Map Click Picker Helper
function LocationPickerEvents({ onSelectLocation }: { onSelectLocation: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function RaiseComplaint() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [step, setStep] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [isGeocodingText, setIsGeocodingText] = useState(false)
  const [complaintId, setComplaintId] = useState("CIV-8492")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<any>(null)

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // AI Analysis state per image URL
  const [aiAnalysisMap, setAiAnalysisMap] = useState<Record<string, AiImageAnalysisResult>>({})
  const [activeConfirmedAi, setActiveConfirmedAi] = useState<{
    category: string
    priority: string
    department: string
    suggestedSlaHours: number
  } | null>(null)

  const [formData, setFormData] = useState({
    category: "",
    description: "",
    priority: "Medium",
    department: "",
    location: "",
    lat: DEFAULT_CENTER.lat as number | null,
    lng: DEFAULT_CENTER.lng as number | null,
    images: [] as string[]
  })

  // Trigger AI Image Analysis for a Cloudinary image URL
  const handleAnalyzeImage = async (url: string) => {
    // Return early if already analyzing
    if (aiAnalysisMap[url]?.status === 'ANALYZING') return

    setAiAnalysisMap(prev => ({
      ...prev,
      [url]: {
        detectedIssue: '',
        confidenceScore: 0,
        suggestedCategory: '',
        suggestedPriority: '',
        suggestedDepartment: '',
        status: 'ANALYZING'
      }
    }))

    try {
      const res = await fetch("http://localhost:5000/api/citizen/complaints/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: url })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setAiAnalysisMap(prev => ({
          ...prev,
          [url]: {
            detectedIssue: data.analysis.detectedIssue,
            confidenceScore: data.analysis.confidenceScore,
            suggestedCategory: data.analysis.suggestedCategory,
            suggestedPriority: data.analysis.suggestedPriority,
            suggestedDepartment: data.analysis.suggestedDepartment,
            status: 'COMPLETED'
          }
        }))
      } else {
        setAiAnalysisMap(prev => ({
          ...prev,
          [url]: {
            detectedIssue: 'Unknown Civic Issue',
            confidenceScore: 0,
            suggestedCategory: 'Other',
            suggestedPriority: 'Medium',
            suggestedDepartment: 'General Civic Admin',
            status: 'FAILED',
            error: data.message || 'AI analysis temporarily unavailable'
          }
        }))
      }
    } catch (err: any) {
      setAiAnalysisMap(prev => ({
        ...prev,
        [url]: {
          detectedIssue: 'Unknown Civic Issue',
          confidenceScore: 0,
          suggestedCategory: 'Other',
          suggestedPriority: 'Medium',
          suggestedDepartment: 'General Civic Admin',
          status: 'FAILED',
          error: 'Network error analyzing photo'
        }
      }))
    }
  }

  // Apply AI Suggestion to Form State
  const handleApplyAiSuggestion = (url: string) => {
    const analysis = aiAnalysisMap[url]
    if (!analysis || analysis.status !== 'COMPLETED') return

    setFormData(prev => ({
      ...prev,
      category: analysis.suggestedCategory,
      priority: analysis.suggestedPriority,
      department: analysis.suggestedDepartment
    }))

    setActiveConfirmedAi({
      category: analysis.suggestedCategory,
      priority: analysis.suggestedPriority,
      department: analysis.suggestedDepartment,
      suggestedSlaHours: analysis.suggestedPriority === 'Critical' ? 12 : analysis.suggestedPriority === 'High' ? 24 : 48
    })

    alert(`AI Suggestions applied! Category set to "${analysis.suggestedCategory}" & Priority set to "${analysis.suggestedPriority}".`)
  }

  // Start Webcam Stream
  const openCamera = async () => {
    if (formData.images.length >= 3) {
      alert("You can upload a maximum of 3 images per complaint.")
      return
    }
    try {
      setIsCameraOpen(true)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Camera access error:", err)
      alert("Unable to access camera. Please allow camera permissions or upload an image file.")
      setIsCameraOpen(false)
    }
  }

  // Stop Webcam Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraOpen(false)
  }

  // Capture Photo from Webcam Stream
  const capturePhoto = async () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to Blob
    canvas.toBlob(async (blob) => {
      if (!blob) return
      stopCamera()
      setIsUploading(true)

      const file = new File([blob], `live_camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" })
      const data = new FormData()
      data.append("file", file)
      data.append("upload_preset", "civora")
      data.append("cloud_name", "racerjru")

      try {
        const res = await fetch("https://api.cloudinary.com/v1_1/racerjru/image/upload", {
          method: "POST",
          body: data
        })
        const uploadedImage = await res.json()
        if (uploadedImage.secure_url) {
          setFormData(prev => ({ ...prev, images: [...prev.images, uploadedImage.secure_url].slice(0, 3) }))
          handleAnalyzeImage(uploadedImage.secure_url)
        }
      } catch (err) {
        console.error("Error uploading camera capture:", err)
      } finally {
        setIsUploading(false)
      }
    }, "image/jpeg", 0.9)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingQuota = 3 - formData.images.length
    if (remainingQuota <= 0) {
      alert("You can upload a maximum of 3 images.")
      return
    }

    const filesToUpload = files.slice(0, remainingQuota)
    setIsUploading(true)

    try {
      const uploadedUrls: string[] = []
      for (const file of filesToUpload) {
        const data = new FormData()
        data.append("file", file)
        data.append("upload_preset", "civora")
        data.append("cloud_name", "racerjru")

        const res = await fetch("https://api.cloudinary.com/v1_1/racerjru/image/upload", {
          method: "POST",
          body: data
        })
        const uploadedImage = await res.json()
        if (uploadedImage.secure_url) {
          uploadedUrls.push(uploadedImage.secure_url)
        }
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls].slice(0, 3) }))
      // Trigger AI analysis automatically for each newly uploaded image
      uploadedUrls.forEach(url => handleAnalyzeImage(url))
    } catch (err) {
      console.error("Error uploading to Cloudinary:", err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }))
  }

  // Reverse Geocode (lat/lng -> address string) via Backend LocationIQ Proxy
  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    if (import.meta.env.DEV) {
      console.log(`[GPS] latitude: ${lat}, longitude: ${lng}`);
    }
    setIsDetectingLocation(true);
    setFormData(prev => ({ ...prev, location: "📍 Detecting location..." }));

    try {
      const response = await fetch(`http://localhost:5000/api/citizen/reverse-geocode?lat=${lat}&lng=${lng}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.address) {
          setFormData(prev => ({ ...prev, location: data.address, lat, lng }));
          return;
        }
      }

      // Direct fallback if backend proxy returns non-ok
      const apiUrl = import.meta.env.VITE_GEOCODE_API_URL || "https://us1.locationiq.com/v1/reverse";
      const apiKey = import.meta.env.VITE_GEOCODE_API_KEY || "pk.0c9741909440306217e5f3b924862636";
      const directRes = await fetch(`${apiUrl}?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`);
      if (directRes.ok) {
        const data = await directRes.json();
        const addr = data.address || {};
        const road = addr.road || addr.street || addr.pedestrian || addr.footway || "";
        const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.locality || "";
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || "";
        const state = addr.state || "";

        let formatted = "";
        if (road && neighbourhood && city) formatted = `${road}, ${neighbourhood}, ${city}`;
        else if (road && city) formatted = `${road}, ${city}`;
        else if (neighbourhood && city) formatted = `${neighbourhood}, ${city}`;
        else if (city && state) formatted = `${city}, ${state}`;
        else formatted = data.display_name || `📍 GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        setFormData(prev => ({ ...prev, location: formatted, lat, lng }));
        return;
      }

      setFormData(prev => ({ ...prev, location: `📍 GPS detected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng }));
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setFormData(prev => ({ ...prev, location: `📍 GPS detected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng }));
    } finally {
      setIsDetectingLocation(false);
    }
  }

  // Forward Geocode (Search text address -> lat/lng & redirect map position)
  const handleAddressSearch = async (customQuery?: string, keepUserText = false) => {
    const query = (customQuery !== undefined ? customQuery : formData.location).trim()
    if (!query) return
    setIsGeocodingText(true)
    try {
      const apiKey = import.meta.env.VITE_GEOCODE_API_KEY || "pk.0c9741909440306217e5f3b924862636"
      const response = await fetch(`https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(query)}&format=json&limit=1`)
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          setFormData(prev => ({
            ...prev,
            lat,
            lng,
            location: keepUserText ? prev.location : (data[0].display_name || query)
          }))
          setIsGeocodingText(false)
          return
        }
      }
      // Fallback search via Nominatim
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
      if (nomRes.ok) {
        const nomData = await nomRes.json()
        if (nomData && nomData.length > 0) {
          const lat = parseFloat(nomData[0].lat)
          const lng = parseFloat(nomData[0].lon)
          setFormData(prev => ({
            ...prev,
            lat,
            lng,
            location: keepUserText ? prev.location : (nomData[0].display_name || query)
          }))
        }
      }
    } catch (err) {
      console.error("Address search error:", err)
    } finally {
      setIsGeocodingText(false)
    }
  }

  // Detect exact GPS location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setIsDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        await fetchAddressFromCoords(lat, lng)
        setIsDetectingLocation(false)
      },
      (error) => {
        console.error("Error detecting location:", error)
        alert("Could not detect your exact location automatically. You can click on the map or type your city/area!")
        setIsDetectingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Handle map click selection
  const handleSelectMapLocation = (lat: number, lng: number) => {
    fetchAddressFromCoords(lat, lng)
  }

  // Strict Validation logic
  const canProceedStep1 = !!formData.category
  const canProceedStep2 = !!formData.description.trim()
  const canSubmitStep3 = !!formData.location.trim()

  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateCandidates, setDuplicateCandidates] = useState<any[]>([])
  const [isJoiningDuplicate, setIsJoiningDuplicate] = useState(false)

  // Direct submission without duplicate prompt
  const createComplaintDoc = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch("http://localhost:5000/api/citizen/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `${formData.category} Issue at ${formData.location}`,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          department: formData.department || undefined,
          location: formData.location,
          lat: formData.lat,
          lng: formData.lng,
          imageUrl: formData.images[0] || "",
          images: formData.images,
          aiAnalysisStatus: activeConfirmedAi ? 'COMPLETED' : 'NOT_ANALYZED',
          suggestedSlaHours: activeConfirmedAi ? activeConfirmedAi.suggestedSlaHours : null,
          aiAnalysis: activeConfirmedAi ? {
            category: activeConfirmedAi.category,
            priority: activeConfirmedAi.priority,
            department: activeConfirmedAi.department,
            suggestedSlaHours: activeConfirmedAi.suggestedSlaHours,
            confirmedByCitizen: true,
            confirmedAt: new Date()
          } : undefined,
          aiProvider: 'OpenAI',
          aiModel: 'gpt-4o-mini',
          aiAnalysisVersion: '1.0'
        })
      })
      const data = await res.json()
      if (res.ok) {
        setComplaintId(data._id.substring(data._id.length - 6).toUpperCase())
        handleNext()
      } else {
        alert("Submission failed: " + (data.message || "Unknown error"))
      }
    } catch (err: any) {
      alert("Error submitting complaint: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit trigger - performs duplicate check first
  const handleSubmit = async () => {
    if (!canSubmitStep3) {
      alert("Please enter or detect your exact location before submitting.")
      return
    }

    setIsSubmitting(true)

    // Call Duplicate Check API
    try {
      console.log("[DUPLICATE CHECK] Starting duplicate detection for:", formData.category, formData.location)
      const checkRes = await fetch("http://localhost:5000/api/citizen/complaints/check-duplicates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `${formData.category} Issue at ${formData.location}`,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          lat: formData.lat || 23.0225,
          lng: formData.lng || 72.5714,
          imageUrl: formData.images[0] || "",
          images: formData.images,
          location: {
            address: formData.location,
            lat: formData.lat || 23.0225,
            lng: formData.lng || 72.5714
          }
        })

      })

      console.log("[DUPLICATE CHECK] Response status:", checkRes.status)

      if (checkRes.ok) {
        const checkData = await checkRes.json()
        console.log("[DUPLICATE CHECK] Response data:", checkData)
        if (checkData.duplicates && checkData.duplicates.length > 0) {
          console.log("[DUPLICATE CHECK] Found duplicate candidates, displaying warning modal!")
          setDuplicateCandidates(checkData.duplicates)
          setShowDuplicateModal(true)
          setIsSubmitting(false)
          return
        }
      } else {
        const errData = await checkRes.json()
        console.error("[DUPLICATE CHECK ERROR] Backend error:", checkRes.status, errData)
      }
    } catch (checkErr) {
      console.error("[DUPLICATE CHECK ERROR] Network error:", checkErr)
    }

    // No duplicates found -> create new complaint
    console.log("[COMPLAINT CREATE] Creating new complaint")
    await createComplaintDoc()

  }

  // Join Existing Issue Handler
  const handleJoinExistingIssue = async (candidateRawId: string) => {
    setIsJoiningDuplicate(true)
    try {
      const res = await fetch(`http://localhost:5000/api/citizen/complaints/${candidateRawId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          comment: formData.description,
          evidenceImages: formData.images
        })
      })

      const data = await res.json()
      if (res.ok) {
        setShowDuplicateModal(false)
        setComplaintId(candidateRawId.substring(candidateRawId.length - 6).toUpperCase())
        handleNext()
      } else {
        alert(data.message || "Failed to join community issue.")
      }
    } catch (err: any) {
      alert("Error joining community issue: " + err.message)
    } finally {
      setIsJoiningDuplicate(false)
    }
  }

  const handleNext = () => setStep(s => Math.min(s + 1, 4))
  const handlePrev = () => setStep(s => Math.max(s - 1, 1))


  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-heading">Raise Complaint</h1>
        <p className="mt-1 text-muted-foreground">Report an issue in your locality to the concerned department.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-border -z-10 -translate-y-1/2"></div>
        <div className="absolute left-0 top-1/2 h-1 bg-primary -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
        
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`flex items-center justify-center w-10 h-10 rounded-full border-4 font-semibold transition-colors duration-300 ${step >= s ? 'bg-primary border-primary/20 text-white' : 'bg-card border-border text-muted-foreground'}`}>
            {step > s ? <CheckCircle size={18} /> : s}
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-heading">Select Category</h3>
                  <span className="text-xs text-rose-500 font-medium">* Required</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.map((cat) => (
                    <div 
                      key={cat}
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`cursor-pointer p-4 rounded-xl border text-center transition-all duration-300 ${formData.category === cat ? 'border-primary bg-primary/5 text-primary shadow-sm ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/50'}`}
                    >
                      <span className="font-medium">{cat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-6"
              >
                <h3 className="text-xl font-semibold text-heading">Issue Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-heading">Description</label>
                      <span className="text-xs text-rose-500 font-medium">* Required</span>
                    </div>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Describe the issue in detail (e.g. Broken streetlight near block A)..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-heading">Priority</label>
                    <select 
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-6"
              >
                <h3 className="text-xl font-semibold text-heading">Location & Photo Evidence</h3>
                <div className="space-y-6">
                  {/* Location Input & Map Picker */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-heading">Exact Location Address</label>
                      <span className="text-xs text-rose-500 font-medium">* Required (Click map to pinpoint)</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                          value={formData.location}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({ ...prev, location: val }));
                            
                            // Auto-detect and relocate on map dynamically as user types (debounced)
                            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                            if (val.trim().length >= 3) {
                              searchTimeoutRef.current = setTimeout(() => {
                                handleAddressSearch(val, true);
                              }, 600);
                            }
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch(formData.location, false))}
                          className="pl-10 pr-24" 
                          placeholder="Type address, landmark, or city (e.g. Rajkot)..." 
                        />
                        <Button 
                          type="button"
                          onClick={() => handleAddressSearch(formData.location, false)}
                          disabled={isGeocodingText || !formData.location.trim()}
                          size="sm"
                          variant="ghost"
                          className="absolute right-1 top-1 h-8 text-xs px-2 gap-1 text-primary"
                        >
                          {isGeocodingText ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                          Find Location
                        </Button>
                      </div>
                      <Button 
                        type="button"
                        onClick={handleDetectLocation} 
                        disabled={isDetectingLocation}
                        size="sm" 
                        variant="secondary" 
                        className="h-10 px-4 text-xs gap-1.5 shrink-0 bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        {isDetectingLocation ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Navigation size={14} />
                        )}
                        Detect GPS
                      </Button>
                    </div>

                    {/* Interactive Leaflet Map Picker */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target size={13} className="text-rose-500" /> Map auto-centers on typed address or GPS. Click map to fine-tune.
                        </span>
                        {formData.lat && formData.lng && (
                          <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded">
                            GPS: {formData.lat.toFixed(5)}, {formData.lng.toFixed(5)}
                          </span>
                        )}
                      </div>
                      <div className="h-56 w-full rounded-xl overflow-hidden border border-border relative z-0 shadow-inner">
                        <MapContainer
                          center={[formData.lat || DEFAULT_CENTER.lat, formData.lng || DEFAULT_CENTER.lng]}
                          zoom={15}
                          style={{ height: "100%", width: "100%" }}
                          zoomControl={true}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          {formData.lat && formData.lng && (
                            <>
                              <RecenterMap lat={formData.lat} lng={formData.lng} />
                              <Marker position={[formData.lat, formData.lng]} icon={locationPinIcon}>
                                <Popup>
                                  <div className="p-1 text-xs">
                                    <strong>📍 Issue Location</strong>
                                    <p className="text-[11px] text-muted-foreground mt-1">{formData.location || "Selected Spot"}</p>
                                  </div>
                                </Popup>
                              </Marker>
                            </>
                          )}
                          <LocationPickerEvents onSelectLocation={handleSelectMapLocation} />
                        </MapContainer>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Photo Options: Live Camera OR Multiple File Upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-heading">Add Complaint Images ({formData.images.length}/3 photos)</label>
                      <span className="text-xs text-muted-foreground">Upload up to 3 photos as evidence</span>
                    </div>

                    {/* Image Preview Grid with AI Analysis per photo */}
                    {formData.images.length > 0 && (
                      <div className="space-y-4 mb-4">
                        {formData.images.map((url, idx) => {
                          const aiState = aiAnalysisMap[url]
                          const confidencePct = aiState ? Math.round(aiState.confidenceScore * 100) : 0
                          let confidenceBadgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          if (confidencePct < 70) {
                            confidenceBadgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/30"
                          }

                          return (
                            <div key={idx} className="rounded-xl border border-border bg-card p-4 space-y-3">
                              <div className="flex flex-col sm:flex-row items-start gap-4">
                                <div className="relative rounded-lg overflow-hidden border border-border w-28 h-28 shrink-0 bg-black/5">
                                  <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                                    title="Remove photo"
                                  >
                                    <X size={12} />
                                  </button>
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                                    Photo #{idx + 1}
                                  </span>
                                </div>

                                <div className="flex-1 w-full space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-heading flex items-center gap-1.5">
                                      <Sparkles size={14} className="text-primary animate-pulse" />
                                      AI Photo Analysis
                                    </h4>

                                    {!aiState || aiState.status === 'NOT_ANALYZED' ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleAnalyzeImage(url)}
                                        className="h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 gap-1.5"
                                      >
                                        <Sparkles size={12} /> 🤖 Analyze Photo
                                      </Button>
                                    ) : null}
                                  </div>

                                  {/* AI Loading State */}
                                  {aiState?.status === 'ANALYZING' && (
                                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3 text-xs text-primary font-medium">
                                      <Loader2 size={16} className="animate-spin text-primary" />
                                      <span>🤖 Analyzing photo issue with AI... Please wait.</span>
                                    </div>
                                  )}

                                  {/* AI Completed State */}
                                  {aiState?.status === 'COMPLETED' && (
                                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-primary/20 space-y-2 text-xs">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Detected Issue</span>
                                          <span className="font-bold text-heading">{aiState.detectedIssue}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">AI Signal Confidence</span>
                                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${confidenceBadgeColor}`}>
                                            {confidencePct}% ({confidencePct >= 90 ? 'High' : confidencePct >= 70 ? 'Moderate' : 'Low'})
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Suggested Category</span>
                                          <span className="font-medium text-heading">{aiState.suggestedCategory}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Suggested Priority</span>
                                          <span className="font-medium text-heading">{aiState.suggestedPriority}</span>
                                        </div>
                                      </div>

                                      {confidencePct < 70 && (
                                        <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 font-medium">
                                          <AlertTriangle size={12} />
                                          ⚠️ AI is not confident about this image. Please verify manually.
                                        </div>
                                      )}

                                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => handleApplyAiSuggestion(url)}
                                          className="h-7 text-xs bg-emerald-600 text-white hover:bg-emerald-700 gap-1 px-2.5"
                                        >
                                          <CheckCircle size={12} /> ✅ Use AI Suggestion
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setStep(1)}
                                          className="h-7 text-xs gap-1 px-2 text-muted-foreground"
                                        >
                                          <Edit3 size={12} /> ✏️ Edit Manually
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setAiAnalysisMap(prev => ({
                                              ...prev,
                                              [url]: { ...prev[url], status: 'NOT_ANALYZED' }
                                            }))
                                          }}
                                          className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                                        >
                                          Ignore
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* AI Failed State */}
                                  {aiState?.status === 'FAILED' && (
                                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                                        <AlertTriangle size={14} />
                                        <span>⚠️ AI analysis is temporarily unavailable. You can continue manually.</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAnalyzeImage(url)}
                                          className="h-7 text-[11px] gap-1 px-2 border-amber-500/30 text-amber-700 dark:text-amber-300"
                                        >
                                          <RefreshCw size={11} /> Try Again
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {isCameraOpen ? (
                      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 flex items-center gap-4 z-10">
                          <Button onClick={capturePhoto} className="bg-primary text-white gap-2 shadow-lg">
                            <Camera size={18} /> Snap Photo
                          </Button>
                          <Button variant="secondary" onClick={stopCamera} className="gap-2">
                            <X size={18} /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : formData.images.length < 3 && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Live Camera Button */}
                        <div 
                          onClick={openCamera}
                          className="border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                            <Camera size={20} />
                          </div>
                          <span className="font-semibold text-xs text-heading">Click Live Photo</span>
                          <span className="text-[11px] text-muted-foreground">Webcam or mobile camera</span>
                        </div>

                        {/* File Upload Option */}
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/50 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                            accept="image/*"
                            multiple
                          />
                          <div className="h-10 w-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                            <Upload size={20} />
                          </div>
                        </div>
                      </div>
                    )}
                    {isUploading && (
                      <div className="flex items-center gap-2 text-xs text-primary font-medium justify-center pt-2">
                        <Loader2 size={14} className="animate-spin" /> Uploading images...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 text-center space-y-6 py-16"
              >
                <div className="h-24 w-24 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-3xl font-bold text-heading">Complaint Submitted!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your complaint has been successfully registered. You will receive notifications regarding its progress.
                </p>
                <div className="bg-muted p-4 rounded-xl max-w-xs mx-auto mt-6">
                  <p className="text-sm text-muted-foreground">Complaint ID</p>
                  <p className="text-xl font-bold tracking-widest text-heading">CIV-{complaintId}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-between">
            {step > 1 && step < 4 ? (
              <Button variant="outline" onClick={handlePrev} className="gap-2">
                <ArrowLeft size={16} /> Back
              </Button>
            ) : <div></div>}
            
            {step === 1 ? (
              <Button onClick={handleNext} disabled={!canProceedStep1} className="gap-2">
                Next <ArrowRight size={16} />
              </Button>
            ) : step === 2 ? (
              <Button onClick={handleNext} disabled={!canProceedStep2} className="gap-2">
                Next <ArrowRight size={16} />
              </Button>
            ) : step === 3 ? (
              <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmitStep3} className="gap-2 bg-primary text-white hover:bg-primary/90">
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'} <Upload size={16} />
              </Button>
            ) : (
              <Button onClick={() => navigate('/citizen/my-complaints')} className="w-full sm:w-auto">
                View My Complaints
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Similar Issue / Duplicate Warning Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl overflow-hidden relative text-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                    ⚠️ Similar Issue Found Nearby
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    A matching issue has already been reported nearby. You can join it to speed up resolution!
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDuplicateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Candidates list */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {duplicateCandidates.map((dup, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-2xl border border-emerald-500/30 bg-slate-800/90 space-y-3 relative shadow-inner"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        {dup.complaintId}
                      </span>
                      <h4 className="text-base font-bold text-emerald-400 mt-1.5">{dup.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                        📍 {dup.locationAddress} <span className="text-slate-400 font-mono">({dup.distanceMeters}m away)</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm">
                        ⚡ {dup.similarityScore}% Match
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-700/80">
                    <span className="flex items-center gap-1.5 font-semibold text-teal-300">
                      <Users size={14} className="text-teal-400" /> {dup.supporterCount} Citizens Affected
                    </span>

                    <div className="flex gap-2.5 items-center">
                      <a
                        href={`/citizen/complaint/${dup.rawId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-teal-300 font-medium transition-colors"
                      >
                        <ExternalLink size={12} /> View Details
                      </a>
                      <Button
                        size="sm"
                        onClick={() => handleJoinExistingIssue(dup.rawId)}
                        disabled={isJoiningDuplicate}
                        className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-1.5 px-3.5 shadow-md"
                      >
                        {isJoiningDuplicate ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
                        👥 Join Existing Issue
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions: Join or Report New */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Joining consolidates tasks so workers resolve the issue faster.
              </span>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  onClick={createComplaintDoc}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto text-xs border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  ➕ Report New Issue Anyway
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

