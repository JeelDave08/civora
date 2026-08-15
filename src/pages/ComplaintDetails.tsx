import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { MapPin, Clock, CheckCircle, AlertTriangle, ArrowLeft, Building2, User, Calendar, MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "../context/AuthContext"

export function ComplaintDetails() {
  const { id } = useParams()
  const { token } = useAuth()
  const [complaint, setComplaint] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchComplaintDetails = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`http://localhost:5000/api/citizen/complaints/${id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          
          const formattedComplaint = {
            id: data._id.substring(data._id.length - 6).toUpperCase(),
            rawId: data._id,
            title: data.title,
            category: data.category,
            status: data.status,
            priority: data.priority,
            date: new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
            description: data.description || data.title,
            location: typeof data.location === "object" ? (data.location?.address || "Unknown Location") : (data.location || "Unknown Location"),
            department: data.department || "Under Review",
            assignedTo: data.assignedTo || "Not Assigned Yet",
            images: data.imageUrl ? [data.imageUrl] : [],
            timeline: [
              { status: "Complaint Registered", date: new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), active: true },
              { status: "Assigned to Department", date: ["Assigned", "Working", "Resolved", "Closed"].includes(data.status) ? "Completed" : "Pending", active: ["Assigned", "Working", "Resolved", "Closed"].includes(data.status) },
              { status: "Inspection Completed", date: ["Working", "Resolved", "Closed"].includes(data.status) ? "Completed" : "Pending", active: ["Working", "Resolved", "Closed"].includes(data.status) },
              { status: "Work in Progress", date: ["Working", "Resolved", "Closed"].includes(data.status) ? "In Progress" : "Pending", active: ["Working", "Resolved", "Closed"].includes(data.status) },
              { status: "Resolved", date: ["Resolved", "Closed"].includes(data.status) ? "Resolved" : "Pending", active: ["Resolved", "Closed"].includes(data.status) },
            ]
          }
          setComplaint(formattedComplaint)
        } else {
          setError("Failed to fetch complaint details.")
        }
      } catch (err) {
        console.error("Error fetching complaint details:", err)
        setError("Error loading complaint data.")
      } finally {
        setIsLoading(false)
      }
    }

    if (id && token) {
      fetchComplaintDetails()
    }
  }, [id, token])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse">Loading complaint details...</p>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-16">
        <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-heading">Failed to Load Complaint</h3>
        <p className="text-muted-foreground">
          {error || "The complaint you are trying to view could not be found or you do not have permission to view it."}
        </p>
        <Button asChild>
          <Link to="/citizen/my-complaints">Back to My Complaints</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/citizen/my-complaints"><ArrowLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading flex items-center gap-3">
            Complaint #{complaint.id}
            <Badge variant="info" className="gap-1"><Clock size={12} /> {complaint.status}</Badge>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-heading">{complaint.title}</h3>
                  <Badge variant="outline" className="text-warning border-warning/50">{complaint.priority} Priority</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">{complaint.description}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">Location</p>
                    <p className="text-sm text-muted-foreground">{complaint.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">Reported On</p>
                    <p className="text-sm text-muted-foreground">{complaint.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">Department</p>
                    <p className="text-sm text-muted-foreground">{complaint.department}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">Assigned To</p>
                    <p className="text-sm text-muted-foreground">{complaint.assignedTo}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-heading mb-3">Attached Media</h4>
                {complaint.images && complaint.images.length > 0 ? (
                  <div className="flex gap-4 flex-wrap">
                    {complaint.images.map((img, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedImage(img)}
                        className="h-24 w-32 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity relative group"
                      >
                        <img src={img} alt="Complaint" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                          View
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No media attached to this complaint.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare size={20} /> Comments & Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mb-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary font-bold">
                    RK
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-2xl rounded-tl-none p-4 border border-border/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm text-heading">Rajesh Kumar (Field Agent)</span>
                      <span className="text-xs text-muted-foreground">Oct 26, 11:30 AM</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Inspection completed. Materials have been ordered and work will commence tomorrow morning.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Input placeholder="Type a message or ask a question..." className="flex-1" />
                <Button size="icon" className="shrink-0"><Send size={18} /></Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resolution Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-border">
                {complaint.timeline.map((item, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-9 h-6 w-6 rounded-full border-4 border-card flex items-center justify-center ${item.active ? 'bg-primary text-white' : 'bg-muted'}`}>
                      {item.active && <CheckCircle size={12} />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${item.active ? 'text-heading' : 'text-muted-foreground'}`}>{item.status}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-border">
                <Button className="w-full gap-2" variant="outline" asChild>
                  <Link to={`/citizen/live-tracking/${complaint.id}`}>
                    <MapPin size={16} /> Track on Map
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-3xl max-h-[80vh] p-2 bg-card rounded-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Full screen preview" className="max-w-full max-h-[75vh] object-contain rounded-xl" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
