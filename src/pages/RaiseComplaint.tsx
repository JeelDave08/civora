import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../context/AuthContext"
import { MapPin, Camera, Video, Upload, CheckCircle, ArrowRight, ArrowLeft, Navigation } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"

const categories = [
  "Road", "Garbage", "Water", "Electricity", "Street Light", "Drainage", "Building", "Other"
]

export function RaiseComplaint() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [step, setStep] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [complaintId, setComplaintId] = useState("CIV-8492")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    priority: "Medium",
    location: "",
    lat: null as number | null,
    lng: null as number | null,
    imageUrl: ""
  })

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

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setIsDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          
          const apiUrl = import.meta.env.VITE_GEOCODE_API_URL || "https://us1.locationiq.com/v1/reverse"
          const apiKey = import.meta.env.VITE_GEOCODE_API_KEY || "pk.dummy_key"
          
          const response = await fetch(`${apiUrl}?key=${apiKey}&lat=${lat}&lon=${lon}&format=json`)
          if (response.ok) {
            const data = await response.json()
            setFormData(prev => ({ ...prev, location: data.display_name, lat, lng: lon }))
          } else {
            setFormData(prev => ({ ...prev, location: `${lat.toFixed(6)}, ${lon.toFixed(6)}`, lat, lng: lon }))
          }
        } catch (error) {
          console.error("Error fetching location details:", error)
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          setFormData(prev => ({ ...prev, location: `${lat.toFixed(6)}, ${lon.toFixed(6)}`, lat, lng: lon }))
        } finally {
          setIsDetectingLocation(false)
        }
      },
      (error) => {
        console.error("Error detecting location:", error)
        alert("Could not detect your location. Please check permissions.")
        setIsDetectingLocation(false)
      }
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch("http://localhost:5000/api/citizen/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `${formData.category} Issue at ${formData.location || 'Unknown Location'}`,
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
        console.error("Submission failed:", data)
      }
    } catch (err: any) {
      alert("Error submitting complaint: " + err.message)
      console.error("Error submitting complaint:", err)
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
                <h3 className="text-xl font-semibold text-heading">Select Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.map((cat) => (
                    <div 
                      key={cat}
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`cursor-pointer p-4 rounded-xl border text-center transition-all duration-300 ${formData.category === cat ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border bg-card hover:border-primary/50'}`}
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
                    <label className="text-sm font-medium text-heading">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Describe the issue in detail..."
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
                <h3 className="text-xl font-semibold text-heading">Location & Media</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-heading">Exact Location</label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input 
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="pl-10 pr-32" 
                        placeholder="Search location or detect automatically..." 
                      />
                      <Button 
                        type="button"
                        onClick={handleDetectLocation} 
                        disabled={isDetectingLocation}
                        size="sm" 
                        variant="secondary" 
                        className="absolute right-1 top-1 h-8 text-xs px-3 gap-1"
                      >
                        {isDetectingLocation ? (
                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Navigation size={12} />
                        )}
                        Detect
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-heading">Upload Photos/Videos</label>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*,video/mp4"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-sm font-medium">Uploading to Cloudinary...</p>
                        </div>
                      ) : formData.imageUrl ? (
                        <div className="flex flex-col items-center justify-center">
                          <img src={formData.imageUrl} alt="Uploaded preview" className="h-32 object-contain rounded-lg mb-4" />
                          <p className="text-sm font-medium text-success">Upload successful! Click to change.</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Camera size={20} /></div>
                            <div className="h-12 w-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center"><Video size={20} /></div>
                          </div>
                          <p className="text-sm font-medium text-heading">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or MP4 (max. 10MB)</p>
                        </>
                      )}
                    </div>
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
            
            {step < 3 ? (
              <Button onClick={handleNext} className="gap-2" disabled={step === 1 && !formData.category}>
                Next <ArrowRight size={16} />
              </Button>
            ) : step === 3 ? (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 bg-primary text-white hover:bg-primary/90">
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
