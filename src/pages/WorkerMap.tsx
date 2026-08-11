import { motion } from "framer-motion"
import { MapPin, Navigation2 } from "lucide-react"

export function WorkerMap() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto font-sans h-full flex flex-col"
    >
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Task Map</h1>
        <p className="mt-1 text-slate-500">View all your pending tasks on the city map.</p>
      </div>

      <div className="flex-1 min-h-[500px] relative rounded-[32px] overflow-hidden border-4 border-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] bg-slate-100 flex items-center justify-center">
        {/* Mock Map Background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-300 via-slate-100 to-slate-50"></div>
        
        {/* Mock Pins */}
        <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
          <div className="bg-white px-3 py-1.5 rounded-full shadow-lg font-bold text-xs text-slate-800 mb-1">#CMP-893</div>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/40 relative">
            <span className="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-20"></span>
            <MapPin size={20} />
          </div>
        </div>

        <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center opacity-50">
          <div className="bg-white px-3 py-1.5 rounded-full shadow-md font-bold text-xs text-slate-600 mb-1">#CMP-892</div>
          <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center text-white shadow-md">
            <MapPin size={16} />
          </div>
        </div>

        {/* Current Location */}
        <div className="absolute bottom-1/4 left-1/4 flex flex-col items-center">
          <div className="w-6 h-6 bg-[#4CC9B0] rounded-full border-4 border-white shadow-lg relative">
             <span className="absolute w-full h-full bg-[#4CC9B0] rounded-full animate-ping opacity-40"></span>
          </div>
        </div>

        {/* Overlays */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          <button className="h-12 px-6 rounded-2xl bg-white text-slate-800 font-bold shadow-lg border border-slate-100 flex items-center gap-2 hover:bg-slate-50">
             <Navigation2 size={18} className="text-[#4CC9B0]" /> Recenter
          </button>
        </div>
      </div>
    </motion.div>
  )
}
