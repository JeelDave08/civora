import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Camera, Video, Upload, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"

const categories = [
  "Road", "Garbage", "Water", "Electricity", "Street Light", "Drainage", "Building", "Other"
]

export function RaiseComplaint() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    priority: "Medium",
    location: "",
  })

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
                      <option value="Emergency">Emergency</option>
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
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input 
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="pl-10" 
                        placeholder="Search location or drop a pin..." 
                      />
                    </div>
                    {/* Placeholder for Map */}
                    <div className="h-[200px] w-full rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden relative">
                      <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=New+York,NY&zoom=13&size=600x300&maptype=roadmap')] bg-cover bg-center opacity-50"></div>
                      <div className="relative z-10 flex flex-col items-center p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-border">
                        <MapPin size={24} className="text-primary mb-2" />
                        <span className="text-sm font-medium text-heading">Google Maps Interactive Placeholder</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-heading">Upload Photos/Videos</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex justify-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Camera size={20} /></div>
                        <div className="h-12 w-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center"><Video size={20} /></div>
                      </div>
                      <p className="text-sm font-medium text-heading">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or MP4 (max. 10MB)</p>
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
                  <p className="text-xl font-bold tracking-widest text-heading">CIV-8492</p>
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
              <Button onClick={handleNext} className="gap-2 bg-primary text-white hover:bg-primary/90">
                Submit Complaint <Upload size={16} />
              </Button>
            ) : (
              <Button onClick={() => window.location.href = '/citizen/my-complaints'} className="w-full sm:w-auto">
                View My Complaints
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
