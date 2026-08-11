import { Link } from "react-router-dom"
import { Clock, MapPin, Search, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

const complaintsQueue = [
  { id: "#CMP-892", title: "Traffic light broken", status: "Pending", location: "5th Ave Intersection", date: "2 hrs ago" },
  { id: "#CMP-893", title: "Water main leak", status: "In Progress", location: "Downtown Sector 4", date: "1 day ago" },
  { id: "#CMP-894", title: "Fallen tree", status: "Pending Review", location: "Central Park West", date: "2 days ago" },
  { id: "#CMP-895", title: "Pothole on main road", status: "Pending", location: "Main St", date: "3 hrs ago" },
];

export function SupervisorComplaints() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto font-sans"
    >
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Complaint Queue</h1>
        <p className="mt-1 text-slate-500">Review and assign tasks to field workers.</p>
      </div>

      <Card className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">All Complaints</CardTitle>
          <CardDescription>Filter and manage incoming issues.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search complaints..." className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0]" />
            </div>
          </div>
          
          <div className="space-y-4">
            {complaintsQueue.map((c) => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">{c.id}</span>
                    <h3 className="font-bold text-slate-800">{c.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={14}/> {c.location}</span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {c.date}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                    c.status === 'Pending Review' ? 'bg-purple-100 text-purple-700' :
                    c.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {c.status}
                  </span>
                  <Link to={`/supervisor/complaints/${c.id.replace('#', '')}`} className="flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-[#4CC9B0] hover:text-[#4CC9B0] transition-colors">
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
