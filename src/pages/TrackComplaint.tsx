import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Clock, CheckCircle, AlertTriangle, ArrowRight, Building2, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

export function TrackComplaint() {
  const [complaintId, setComplaintId] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaintId.trim()) return
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setHasSearched(true)
    }, 800)
  }

  // Dummy data
  const complaint = {
    id: complaintId.toUpperCase(),
    title: "Water pipeline leakage",
    category: "Water",
    status: "In Progress",
    priority: "Emergency",
    date: "Oct 20, 2023",
    description: "There is a major water pipeline leakage near the central market. Gallons of water are being wasted and the street is flooding.",
    location: "Central Market, Block 4",
    department: "Water Board",
    timeline: [
      { status: "Complaint Registered", date: "Oct 20, 08:30 AM", active: true },
      { status: "Assigned to Department", date: "Oct 20, 09:15 AM", active: true },
      { status: "Inspection in Progress", date: "Oct 20, 11:00 AM", active: true },
      { status: "Repair Work Started", date: "Pending", active: false },
      { status: "Resolved", date: "Pending", active: false },
    ]
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-heading">Track Complaint Status</h1>
        <p className="mt-4 text-muted-foreground">Enter your Complaint ID below to check its real-time progress and updates from the assigned department.</p>
      </div>

      {/* Search Bar */}
      <Card className="shadow-lg border-primary/20 bg-primary/5">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input 
                placeholder="e.g. CIV-8492" 
                className="pl-12 h-14 text-lg font-medium tracking-wide uppercase bg-white border-border"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 text-base shrink-0" disabled={isLoading || !complaintId.trim()}>
              {isLoading ? "Searching..." : "Track Status"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result Section */}
      {hasSearched && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Header Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-primary mb-1">COMPLAINT ID: {complaint.id}</p>
                <h3 className="text-2xl font-bold text-heading">{complaint.title}</h3>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar size={14} /> {complaint.date}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin size={14} /> {complaint.location}
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right shrink-0">
                <p className="text-sm font-medium text-muted-foreground mb-2">Current Status</p>
                <Badge variant="info" className="text-base px-4 py-1.5 gap-2 shadow-sm">
                  <Clock size={16} /> {complaint.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Details */}
            <Card className="md:col-span-1 h-fit">
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-semibold text-heading">{complaint.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Priority</p>
                  <Badge variant="outline" className="text-destructive border-destructive/50">{complaint.priority}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="font-semibold text-heading flex items-center gap-2"><Building2 size={16} className="text-muted-foreground"/> {complaint.department}</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm leading-relaxed">{complaint.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="md:col-span-2">
              <CardContent className="p-8">
                <h4 className="text-lg font-bold text-heading mb-8">Resolution Progress</h4>
                
                <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-muted">
                  {complaint.timeline.map((item, i) => (
                    <div key={i} className="relative">
                      <div className={`absolute -left-10 h-6 w-6 rounded-full border-[3px] border-card flex items-center justify-center transition-colors ${item.active ? 'bg-primary text-white shadow-[0_0_0_4px_rgba(76,201,176,0.2)]' : 'bg-muted'}`}>
                        {item.active && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <div className={`${item.active ? 'opacity-100' : 'opacity-50'}`}>
                        <h4 className="text-base font-semibold text-heading">{item.status}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Empty State / Initial View */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-16 px-4">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Search size={40} className="text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold text-heading">Ready to track</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Enter the 7-character ID you received when submitting your complaint.</p>
        </div>
      )}
    </div>
  )
}
