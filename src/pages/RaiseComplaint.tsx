import { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../context/AuthContext"
import { MapPin, Camera, Video, Upload, CheckCircle, ArrowRight, ArrowLeft, Navigation, X, RefreshCw, Loader2, Search, Target, AlertTriangle, ShieldAlert, Users, ExternalLink } from "lucide-react"
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
  const searchTimeoutRef = useRef<any>(null)

  // Camera & Live Photo state
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [liveCapturedBlob, setLiveCapturedBlob] = useState<Blob | null>(null)
  const [liveCapturedPreviewUrl, setLiveCapturedPreviewUrl] = useState<string | null>(null)
  const [isLivePhoto, setIsLivePhoto] = useState(false)
  const [livePhotoCapturedAt, setLivePhotoCapturedAt] = useState<string | null>(null)
  const [wardNumber, setWardNumber] = useState("")
  const [cameraError, setCameraError] = useState<string | null>(null)

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

  // Start Webcam Stream
  const openCamera = async () => {
    if (formData.images.length >= 3) {
      alert("You can upload a maximum of 3 images per complaint.")
      return
    }
    setCameraError(null)
    setLiveCapturedPreviewUrl(null)
    setLiveCapturedBlob(null)
    try {
      setIsCameraOpen(true)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      console.error("Camera access error:", err)
      const errText = "Camera permission is required to take a Live Photo."
      setCameraError(errText)
      alert(errText)
      setIsCameraOpen(false)
    }
  }

  // Stop Webcam Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (liveCapturedPreviewUrl) {
      URL.revokeObjectURL(liveCapturedPreviewUrl)
    }
    setLiveCapturedPreviewUrl(null)
    setLiveCapturedBlob(null)
    setIsCameraOpen(false)
  }

  // Capture Photo from Webcam Stream (creates preview before uploading)
  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return
      const previewUrl = URL.createObjectURL(blob)
      setLiveCapturedBlob(blob)
      setLiveCapturedPreviewUrl(previewUrl)
    }, "image/jpeg", 0.9)
  }

  // Retake photo: clear captured preview and restart camera stream
  const retakePhoto = async () => {
    if (liveCapturedPreviewUrl) {
      URL.revokeObjectURL(liveCapturedPreviewUrl)
    }
    setLiveCapturedPreviewUrl(null)
    setLiveCapturedBlob(null)
    if (!stream) {
      await openCamera()
    }
  }

  // Use captured live photo: uploads to Cloudinary & captures GPS
  const useCapturedPhoto = async () => {
    if (!liveCapturedBlob) return

    const timestamp = new Date().toISOString()
    setIsLivePhoto(true)
    setLivePhotoCapturedAt(timestamp)

    // Automatically trigger GPS location detection for the live photo
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          await fetchAddressFromCoords(lat, lng)
        },
        (locErr) => {
          console.warn("Location permission warning:", locErr)
          alert("Current location permission is required for the Live Photo location feature. You can still set your location manually on the map.")
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }

    // Stop camera and upload blob
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraOpen(false)
    setIsUploading(true)

    const file = new File([liveCapturedBlob], `live_camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" })
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
      }
    } catch (err) {
      console.error("Error uploading camera capture:", err)
      alert("Error uploading live photo. Please try again.")
    } finally {
      if (liveCapturedPreviewUrl) {
        URL.revokeObjectURL(liveCapturedPreviewUrl)
      }
      setLiveCapturedPreviewUrl(null)
      setLiveCapturedBlob(null)
      setIsUploading(false)
    }
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

  // Reverse Geocode (lat/lng -> address string) via Backend Mapbox Proxy
  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    if (import.meta.env.DEV) {
      console.log(`[GPS] latitude: ${lat}, longitude: ${lng}`);
    }
    setIsDetectingLocation(true);
    setFormData(prev => ({ ...prev, location: "📍 Detecting location..." }));

    /**
     * Build the most specific real street/building address available.
     *
     * Desired format:
     *   [house_number], [building/apartment], [road/street], [locality/suburb], Rajkot, Gujarat - [postcode]
     *
     * Strict Priority:
     *   house_number -> building/apartment -> road/street -> neighbourhood/suburb/locality -> city -> state -> postcode
     *
     * Administrative "county/taluka" is NEVER used as a street/locality address.
     */
    const cleanToken = (t: string) => (t ? String(t).trim().replace(/^,+|,+$/g, '').trim() : '');

    const formatLocationAddress = (addr: Record<string, string>, displayName?: string): string | null => {
      if (!addr && !displayName) return null;
      addr = addr || {};

      // 1. house_number
      const houseNumber = cleanToken(addr.house_number || addr.street_number || '');

      // 2. building / apartment / POI name
      const building = cleanToken(
        addr.building || addr.apartment || addr.flats || addr.residential_complex ||
        addr.house_name || addr.commercial || addr.amenity || addr.office ||
        addr.shop || addr.hotel || addr.hospital || addr.tourism || addr.leisure ||
        addr.advertising_agency || addr.school || addr.university || addr.college ||
        addr.bank || addr.restaurant || addr.cafe || addr.mall || addr.place_of_worship || ''
      );

      // 3. road / street name
      const road = cleanToken(
        addr.road || addr.street || addr.pedestrian || addr.footway ||
        addr.path || addr.cycleway || addr.lane || addr.avenue || addr.boulevard || addr.highway || ''
      );

      // 4. neighbourhood / suburb / locality
      const neighbourhood = cleanToken(addr.neighbourhood || addr.quarter || addr.allotments || '');
      const suburb = cleanToken(addr.suburb || addr.residential || addr.hamlet || '');
      const locality = cleanToken(addr.locality || addr.village || '');

      const localityParts: string[] = [];
      [neighbourhood, suburb, locality].forEach(loc => {
        if (loc && !localityParts.some(p => p.toLowerCase() === loc.toLowerCase())) {
          if (!road || !road.toLowerCase().includes(loc.toLowerCase())) {
            localityParts.push(loc);
          }
        }
      });
      const area = localityParts.join(', ');

      // 5. city (strictly city/town, NEVER county/taluka)
      let city = cleanToken(addr.city || addr.town || addr.municipality || '');
      if (!city) {
        if (addr.state_district && !/taluka/i.test(addr.state_district)) {
          city = cleanToken(addr.state_district);
        } else {
          city = 'Rajkot';
        }
      }

      // 6. state
      const state = cleanToken(addr.state || 'Gujarat');

      // 7. postcode / PIN
      let pin = cleanToken(addr.postcode || '');
      if (!pin && displayName) {
        const pinMatch = String(displayName).match(/\b(36\d{4})\b/);
        if (pinMatch) pin = pinMatch[1];
      }

      // Assemble prioritized address parts:
      // [house_number], [building], [road], [locality/suburb], [city], [state] - [pin]
      const parts: string[] = [];

      // 1. House Number
      if (houseNumber) {
        parts.push(houseNumber);
      }

      // 2. Building / Apartment / POI
      if (building && building.toLowerCase() !== houseNumber.toLowerCase()) {
        parts.push(building);
      }

      // 3. Road / Street
      if (road) {
        if (!building || !building.toLowerCase().includes(road.toLowerCase())) {
          parts.push(road);
        }
      }

      // 4. Locality / Suburb / Neighbourhood
      if (area) {
        const areaLower = area.toLowerCase();
        const cityLower = city.toLowerCase();
        if (areaLower !== cityLower) {
          parts.push(area);
        }
      }

      // 5. City
      if (city) {
        parts.push(city);
      }

      // 6. State + PIN
      if (state && pin) {
        parts.push(`${state} - ${pin}`);
      } else if (state) {
        parts.push(state);
      } else if (pin) {
        parts.push(pin);
      }

      return parts.length ? parts.join(', ') : null;
    };

    try {
      const response = await fetch(`http://10.152.129.95:5000/api/citizen/reverse-geocode?lat=${lat}&lng=${lng}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (import.meta.env.DEV) {
          console.log('[BACKEND GEOCODE] response:', data);
        }
        if (data.success && data.address) {
          setFormData(prev => ({ ...prev, location: data.address, lat, lng }));
          return;
        }
      }

      // Direct Mapbox fallback if backend proxy fails
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.VITE_GEOCODE_API_KEY;
      try {
        const directRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`);
        if (directRes.ok) {
          const mbData = await directRes.json();
          const firstFeature = mbData.features && mbData.features[0];
          if (firstFeature) {
            const houseNumber = cleanToken(firstFeature.address || '');
            const streetOrPoi = cleanToken(firstFeature.text || '');
            let neighbourhood = '';
            let locality = '';
            let city = '';
            let state = '';
            let postcode = '';

            if (Array.isArray(firstFeature.context)) {
              firstFeature.context.forEach((ctx: any) => {
                const id = ctx.id || '';
                const text = cleanToken(ctx.text || '');
                if (id.startsWith('neighborhood')) neighbourhood = text;
                else if (id.startsWith('locality'))    locality    = text;
                else if (id.startsWith('place'))       city        = text;
                else if (id.startsWith('region'))      state       = text;
                else if (id.startsWith('postcode'))    postcode    = text;
              });
            }

            if (!city)  city  = 'Rajkot';
            if (!state) state = 'Gujarat';

            const localityParts: string[] = [];
            [neighbourhood, locality].forEach(l => {
              if (l && !localityParts.includes(l) && l.toLowerCase() !== city.toLowerCase()) {
                localityParts.push(l);
              }
            });
            const localityStr = localityParts.join(', ');

            const parts: string[] = [];
            if (houseNumber && streetOrPoi) parts.push(`${houseNumber}, ${streetOrPoi}`);
            else if (streetOrPoi)           parts.push(streetOrPoi);
            else if (houseNumber)           parts.push(houseNumber);

            if (localityStr) parts.push(localityStr);
            if (city)        parts.push(city);
            if (state && postcode)  parts.push(`${state} - ${postcode}`);
            else if (state)         parts.push(state);
            else if (postcode)      parts.push(postcode);

            const formatted = parts.length ? parts.join(', ') : (firstFeature.place_name || `📍 GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            setFormData(prev => ({ ...prev, location: formatted, lat, lng }));
            return;
          }
        }
      } catch (mbErr) {
        console.warn('Mapbox direct reverse error:', mbErr);
      }

      // Nominatim last-resort fallback with format=jsonv2, addressdetails=1, zoom=18, accept-language=en
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=en`, {
        headers: { 'User-Agent': 'CivoraApp/1.0' }
      });
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        const addr = nomData.address || {};
        if (import.meta.env.DEV) {
          console.log('[NOMINATIM FALLBACK] display_name:', nomData.display_name);
          console.log('[NOMINATIM FALLBACK] address:', addr);
        }
        const formatted = formatLocationAddress(addr, nomData.display_name) || `📍 GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.VITE_GEOCODE_API_KEY
      const mbRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=IN&proximity=70.8022,22.3039&limit=1`)
      if (mbRes.ok) {
        const mbData = await mbRes.json()
        if (mbData && mbData.features && mbData.features.length > 0) {
          const feat = mbData.features[0]
          const [lon, lat] = feat.center
          setFormData(prev => ({
            ...prev,
            lat,
            lng: lon,
            location: keepUserText ? prev.location : (feat.place_name || query)
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
      const res = await fetch("http://10.152.129.95:5000/api/citizen/complaints", {
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
          ward: wardNumber || undefined,
          isLivePhoto: isLivePhoto,
          livePhotoCapturedAt: livePhotoCapturedAt || undefined,
          lat: formData.lat,
          lng: formData.lng,
          imageUrl: formData.images[0] || "",
          images: formData.images,
          aiAnalysisStatus: 'NOT_ANALYZED'
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
      const checkRes = await fetch("http://10.152.129.95:5000/api/citizen/complaints/check-duplicates", {
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
          ward: wardNumber || undefined,
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
      const res = await fetch(`http://10.152.129.95:5000/api/citizen/complaints/${candidateRawId}/join`, {
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

                    {/* Ward Number Configuration for Supervisor Dispatch */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-heading">Ward Number</label>
                        <span className="text-xs text-muted-foreground">Configured for Ward Supervisor dispatch</span>
                      </div>
                      <Input
                        value={wardNumber}
                        onChange={(e) => setWardNumber(e.target.value)}
                        placeholder="e.g. Ward No. 12 or 12"
                        className="h-10 text-sm"
                      />
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

                    {/* Image Preview Grid */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {formData.images.map((url, idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden border border-border bg-black/5 aspect-square group shadow-sm">
                            <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                              title="Remove photo"
                            >
                              <X size={12} />
                            </button>
                            <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                              Photo #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Camera Error Alert */}
                    {cameraError && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>{cameraError} You can still upload photos from your device below.</span>
                      </div>
                    )}

                    {/* Camera Active View */}
                    {isCameraOpen ? (
                      liveCapturedPreviewUrl ? (
                        /* Captured Photo Preview State: Retake or Use Photo */
                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border-2 border-emerald-500/50 shadow-2xl">
                          <img src={liveCapturedPreviewUrl} alt="Captured Live Photo" className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3 bg-black/70 text-emerald-400 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm border border-emerald-500/30 font-medium">
                            <Camera size={13} /> Live Photo Captured
                          </div>
                          <div className="absolute bottom-4 flex items-center gap-3 z-10 bg-black/75 px-4 py-2 rounded-2xl backdrop-blur-md">
                            <Button type="button" onClick={retakePhoto} variant="secondary" className="gap-1.5 font-bold text-xs h-9">
                              <RefreshCw size={13} /> Retake
                            </Button>
                            <Button type="button" onClick={useCapturedPhoto} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold text-xs h-9 shadow-lg">
                              <CheckCircle size={14} /> Use Photo
                            </Button>
                            <Button type="button" variant="ghost" onClick={stopCamera} className="text-white/80 hover:text-white text-xs h-9">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Live Camera Stream Preview */
                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border border-border shadow-xl">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3 bg-red-600/90 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-bold animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white"></span> Live Camera
                          </div>
                          <div className="absolute bottom-4 flex items-center gap-3 z-10 bg-black/70 px-4 py-2 rounded-2xl backdrop-blur-md">
                            <Button type="button" onClick={capturePhoto} className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold text-xs h-9 shadow-lg">
                              <Camera size={16} /> Capture Photo
                            </Button>
                            <Button type="button" variant="secondary" onClick={stopCamera} className="gap-1.5 text-xs h-9 font-semibold">
                              <X size={14} /> Cancel
                            </Button>
                          </div>
                        </div>
                      )
                    ) : formData.images.length < 3 && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Take Live Photo Button */}
                        <div 
                          onClick={openCamera}
                          className="border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group hover:border-primary shadow-sm"
                        >
                          <div className="h-11 w-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Camera size={22} />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-heading block">📷 Take Live Photo</span>
                            <span className="text-[11px] text-muted-foreground block">Camera capture with real-time GPS location</span>
                          </div>
                        </div>

                        {/* Upload Photo Button */}
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-border hover:border-secondary/60 hover:bg-muted/50 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group shadow-sm"
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                            accept="image/*"
                            multiple
                          />
                          <div className="h-11 w-11 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Upload size={22} />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-heading block">🖼 Upload Photo</span>
                            <span className="text-[11px] text-muted-foreground block">Select photos from device gallery</span>
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


