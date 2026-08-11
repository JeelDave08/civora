import { Link } from "react-router-dom"
import { Clock, MapPin, Search, ChevronRight, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

const myTasks = [
  { id: "#CMP-893", title: "Water main leak", status: "In Progress", location: "Downtown Sector 4", priority: "Critical" },
  { id: "#CMP-892", title: "Traffic light broken", status: "Pending", location: "5th Ave Intersection", priority: "High" },
  { id: "#CMP-894", title: "Fallen tree branch", status: "Pending", location: "Central Park West", priority: "Medium" },
];

export function WorkerTasks() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-5xl mx-auto font-sans"
    >
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Tasks</h1>
        <p className="mt-1 text-slate-500">View and manage your assigned fieldwork tasks.</p>
      </div>

      <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-xl font-bold text-slate-800">Assigned To You</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search tasks by ID or location..." className="w-full h-12 pl-12 pr-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-[#4CC9B0] focus:bg-white bg-slate-50/50 transition-all text-sm font-medium" />
            </div>
          </div>
          
          <div className="space-y-4">
            {myTasks.map((t) => (
              <Link key={t.id} to={`/worker/tasks/${t.id.replace('#', '')}`}>
                <div className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-[#4CC9B0]/40 hover:shadow-lg transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">{t.id}</span>
                      <h3 className="font-bold text-slate-800 group-hover:text-[#4CC9B0] transition-colors text-lg">{t.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><MapPin size={16}/> {t.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                      t.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                      t.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {t.priority === 'Critical' && <AlertTriangle size={14} className="mr-1" />}
                      {t.priority}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                      t.status === 'In Progress' ? 'bg-[#4CC9B0]/10 text-[#4CC9B0]' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.status}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-[#4CC9B0]/10 flex items-center justify-center transition-colors shrink-0">
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-[#4CC9B0]" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
