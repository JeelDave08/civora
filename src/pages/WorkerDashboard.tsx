import { CheckCircle, Clock, MapPin, Camera, Navigation2, CheckSquare, AlertTriangle, Image as ImageIcon, ChevronRight, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/Card"

const workerStats = [
  { title: "Today's Tasks", value: "3", icon: MapPin, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Completed", value: "1", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
  { title: "Pending", value: "2", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
];

export function WorkerDashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-6 lg:p-10 max-w-6xl mx-auto font-sans"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Worker Dashboard</h1>
          <p className="mt-1 text-slate-500">Your daily route, active assignments, and issue reporting.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-100">
          <Activity size={16} /> Online & Ready
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {workerStats.map((stat) => (
          <div key={stat.title} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
              <p className="text-3xl font-black text-slate-800">{stat.value}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
              <stat.icon size={28} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Active Task Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[32px] overflow-hidden border-none shadow-[0_8px_30px_rgba(0,0,0,0.06)] bg-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4CC9B0]/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
            
            <CardContent className="p-0 z-10 relative">
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">Active Task</span>
                    <span className="text-slate-400 text-xs font-bold">#CMP-893</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Water Main Leak Repair</h2>
                  <p className="flex items-center gap-1.5 mt-2 text-slate-500 font-medium">
                    <MapPin size={16} className="text-[#4CC9B0]" /> Downtown Sector 4 (2.4 miles away)
                  </p>
                </div>
                <button className="h-12 px-6 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 shrink-0">
                  <Navigation2 size={18} /> Navigate
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-lg">Proof of Work</h3>
                  
                  <div className="group p-6 border-2 border-slate-200 border-dashed rounded-3xl bg-slate-50/50 hover:bg-white hover:border-[#4CC9B0] transition-all cursor-pointer text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#4CC9B0]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Camera className="mx-auto text-slate-400 group-hover:text-[#4CC9B0] mb-3 transition-colors" size={32} />
                    <p className="text-sm font-bold text-slate-700 group-hover:text-[#4CC9B0] transition-colors">Upload Before Image</p>
                    <p className="text-xs text-slate-500 mt-1">Required before starting work</p>
                  </div>

                  <div className="group p-6 border-2 border-slate-200 border-dashed rounded-3xl bg-slate-50/50 hover:bg-white hover:border-blue-500 transition-all cursor-pointer text-center relative overflow-hidden opacity-60 hover:opacity-100">
                    <ImageIcon className="mx-auto text-slate-400 group-hover:text-blue-500 mb-3 transition-colors" size={32} />
                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-500 transition-colors">Upload After Image</p>
                    <p className="text-xs text-slate-500 mt-1">Required for completion</p>
                  </div>
                </div>

                <div className="space-y-4 flex flex-col h-full">
                  <h3 className="font-bold text-slate-800 text-lg">Task Notes</h3>
                  <div className="flex-1">
                    <textarea 
                      className="w-full h-full min-h-[140px] p-4 rounded-3xl border-2 border-slate-100 focus:outline-none focus:border-[#4CC9B0] bg-slate-50/50 focus:bg-white resize-none text-sm transition-all"
                      placeholder="Describe the tools used and the final outcome of the repair..."
                    ></textarea>
                  </div>
                  <button className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-[#4CC9B0] to-[#3bb59d] text-white rounded-2xl font-bold hover:shadow-[0_8px_25px_rgba(76,201,176,0.4)] hover:-translate-y-0.5 transition-all">
                    <CheckSquare size={20} /> Submit for Review
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar Tasks */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <AlertTriangle className="text-amber-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Safety First!</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ensure you wear high-visibility gear at intersection zones. Report any immediate hazards to the supervisor.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-800">Next in Queue</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2.5 py-1 rounded-full">2 Pending</span>
            </div>
            
            <div className="space-y-3">
              <div className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-[#4CC9B0]/40 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#4CC9B0] transition-colors">Traffic light broken</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5 font-medium"><MapPin size={12}/> 5th Ave Intersection</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#4CC9B0]/10 flex items-center justify-center transition-colors">
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-[#4CC9B0]" />
                </div>
              </div>

              <div className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-[#4CC9B0]/40 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#4CC9B0] transition-colors">Fallen tree branch</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5 font-medium"><MapPin size={12}/> Central Park West</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#4CC9B0]/10 flex items-center justify-center transition-colors">
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-[#4CC9B0]" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  )
}
