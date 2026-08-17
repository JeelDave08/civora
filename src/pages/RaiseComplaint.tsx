import { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../context/AuthContext"
import { MapPin, Camera, Video, Upload, CheckCircle, ArrowRight, ArrowLeft, Navigation, X, RefreshCw, Loader2, Search, Target } from "lucide-react"
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

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const [formData, setFormData] = useState({
    category: "",
    description: "",
    priority: "Medium",
    location: "",
    lat: DEFAULT_CENTER.lat as number | null,
    lng: DEFAULT_CENTER.lng as number | null,
    imageUrl: ""
  })

  // Start Webcam Stream
  const openCamera = async () => {
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

      const file = new File([blob], "live_camera_capture.jpg", { type: "image/jpeg" })
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
        setFormData(prev => ({ ...prev, imageUrl: uploadedImage.secure_url }))
      } catch (err) {
        console.error("Error uploading camera capture:", err)
      } finally {
        setIsUploading(false)
      }
    }, "image/jpeg", 0.9)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
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
      setFormData(prev => ({ ...prev, imageUrl: uploadedImage.secure_url }))
    } catch (err) {
      console.error("Error uploading to Cloudinary:", err)
    } finally {
      setIsUploading(false)
    }
  }

  // Reverse Geocode (lat/lng -> address string)
  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const apiUrl = import.meta.env.VITE_GEOCODE_API_URL || "https://us1.locationiq.com/v1/reverse"
      const apiKey = import.meta.env.VITE_GEOCODE_API_KEY || "pk.0c9741909440306217e5f3b924862636"
      const response = await fetch(`${apiUrl}?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`)
      if (response.ok) {
        const data = await response.json()
        if (data.display_name) {
          setFormData(prev => ({ ...prev, location: data.display_name, lat, lng }))
          return
        }
      }
      // Fallback reverse geocoding via Nominatim
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      if (nomRes.ok) {
        const nomData = await nomRes.json()
        if (nomData.display_name) {
          setFormData(prev => ({ ...prev, location: nomData.display_name, lat, lng }))
          return
        }
      }
      setFormData(prev => ({ ...prev, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng }))
    } catch (err) {
      console.error("Reverse geocoding error:", err)
      setFormData(prev => ({ ...prev, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng }))
    }
  }

  // Forward Geocode (Search address -> lat/lng)
  const handleAddressSearch = async () => {
    if (!formData.location.trim()) return
    setIsGeocodingText(true)
    try {
      const apiKey = import.meta.env.VITE_GEOCODE_API_KEY || "pk.0c9741909440306217e5f3b924862636"
      const response = await fetch(`https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(formData.location)}&format=json&limit=1`)
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          setFormData(prev => ({ ...prev, lat, lng, location: data[0].display_name }))
          setIsGeocodingText(false)
          return
        }
      }
      // Fallback search via Nominatim
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}&limit=1`)
      if (nomRes.ok) {
        const nomData = await nomRes.json()
        if (nomData && nomData.length > 0) {
          const lat = parseFloat(nomData[0].lat)
          const lng = parseFloat(nomData[0].lon)
          setFormData(prev => ({ ...prev, lat, lng, location: nomData[0].display_name }))
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
        alert("Could not detect your exact location automatically. You can click on the map to pinpoint your location!")
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

  const handleSubmit = async () => {
    if (!canSubmitStep3) {
      alert("Please enter or detect your exact location before submitting.")
      return
    }

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
          location: formData.location,
          lat: formData.lat,
          lng: formData.lng,
          imageUrl: formData.imageUrl
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
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
                          className="pl-10 pr-24" 
                          placeholder="Enter street, area, or landmark..." 
                        />
                        <Button 
                          type="button"
                          onClick={handleAddressSearch}
                          disabled={isGeocodingText || !formData.location.trim()}
                          size="sm"
                          variant="ghost"
                          className="absolute right-1 top-1 h-8 text-xs px-2 gap-1 text-primary"
                        >
                          {isGeocodingText ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                          Find
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
                          <Target size={13} className="text-rose-500" /> Click on the map below to pinpoint exact location
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

                  {/* Dual Photo Options: Live Camera OR File Upload */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-heading">Add Complaint Image (Live Camera or Upload)</label>

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
                    ) : formData.imageUrl ? (
                      <div className="border border-border rounded-xl p-4 text-center bg-card flex flex-col items-center">
                        <img src={formData.imageUrl} alt="Complaint preview" className="h-44 object-cover rounded-lg mb-3 shadow" />
                        <div className="flex gap-3">
                          <Button size="sm" variant="outline" onClick={() => setFormData({ ...formData, imageUrl: "" })}>
                            Remove & Retake
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Live Camera Button */}
                        <div 
                          onClick={openCamera}
                          className="border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                        >
                          <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                            <Camera size={24} />
                          </div>
                          <span className="font-semibold text-sm text-heading">Click Live Photo</span>
                          <span className="text-xs text-muted-foreground">Use webcam or mobile camera</span>
                        </div>

                        {/* File Upload Option */}
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                            accept="image/*"
                          />
                          <div className="h-12 w-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                            <Upload size={24} />
                          </div>
                          <span className="font-semibold text-sm text-heading">Upload Image File</span>
                          <span className="text-xs text-muted-foreground">PNG, JPG up to 10MB</span>
                        </div>
                      </div>
                    )}

                    {isUploading && (
                      <div className="flex items-center gap-2 text-xs text-primary font-medium justify-center pt-2">
                        <Loader2 size={14} className="animate-spin" /> Uploading image...
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
    </div>
  )
}
