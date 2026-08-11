import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { MapPin, Clock, CheckCircle, AlertTriangle, ArrowLeft, Building2, User, Calendar, MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

export function ComplaintDetails() {
  const { id } = useParams()

  const complaint = {
    id: id || "CIV-8492",
    title: "Large pothole on main street",
    category: "Road",
    status: "In Progress",
    priority: "High",
    date: "Oct 25, 2023",
    description: "There is a massive pothole that has been causing traffic slowdowns and potential vehicle damage near the intersection of Main St and 4th Ave. It needs immediate attention before the rainy season starts.",
    location: "Intersection of Main St & 4th Ave",
    department: "Public Works",
    assignedTo: "Rajesh Kumar (Field Agent)",
    images: ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400"],
    timeline: [
      { status: "Complaint Registered", date: "Oct 25, 10:30 AM", active: true },
      { status: "Assigned to Department", date: "Oct 25, 02:15 PM", active: true },
      { status: "Inspection Completed", date: "Oct 26, 11:00 AM", active: true },
      { status: "Work in Progress", date: "Pending", active: false },
      { status: "Resolved", date: "Pending", active: false },
    ]
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
                <div className="flex gap-4">
                  {complaint.images.map((img, i) => (
                    <div key={i} className="h-24 w-32 rounded-lg overflow-hidden border border-border">
                      <img src={img} alt="Complaint" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
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
    </div>
  )
}
