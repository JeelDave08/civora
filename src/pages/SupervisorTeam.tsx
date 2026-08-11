import { useState } from "react"
import { Link } from "react-router-dom"
import { Users, Search, ArrowRight, Activity, MapPin, UserPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

const initialWorkers = [
  { id: "w1", name: "Mike Ross", status: "Active", tasks: 1, lastLocation: "Sector 4", phone: "+1 234 567 8900" },
  { id: "w2", name: "Harvey Specter", status: "Available", tasks: 0, lastLocation: "HQ", phone: "+1 234 567 8901" },
  { id: "w3", name: "Donna Paulsen", status: "Offline", tasks: 0, lastLocation: "Unknown", phone: "+1 234 567 8902" },
];

export function SupervisorTeam() {
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  })

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName || !formData.email || !formData.password) return;

    // Save to localStorage for temporary checking
    const existingUsers = JSON.parse(localStorage.getItem('temp_users') || '[]');
    existingUsers.push({
      email: formData.email.toLowerCase(),
      password: formData.password,
      role: 'worker',
      name: formData.fullName
    });
    localStorage.setItem('temp_users', JSON.stringify(existingUsers));
    
    alert("Worker credentials created temporarily! They can now log in.")
    setShowAddWorker(false)
    setFormData({ fullName: "", email: "", password: "" })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto font-sans"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Team</h1>
          <p className="mt-1 text-slate-500">Manage your field workers and monitor their status.</p>
        </div>
        <button 
          onClick={() => setShowAddWorker(!showAddWorker)} 
          className="flex items-center gap-2 bg-[#4CC9B0] hover:bg-[#3bb59d] text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
        >
          <UserPlus size={18} /> Add New Worker
        </button>
      </div>

      <AnimatePresence>
        {showAddWorker && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border-t-4 border-t-[#4CC9B0] mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Create Field Worker Account</CardTitle>
                <CardDescription>Generate temporary credentials for a new field worker.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddWorker} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" placeholder="e.g. John Doe"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email ID</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" placeholder="worker@civora.com"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                    <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" placeholder="pass123"/>
                  </div>
                  <button type="submit" className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">
                    Save & Create
                  </button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">Field Workers</CardTitle>
          <CardDescription>View all workers under your supervision.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search workers..." className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0]" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialWorkers.map((w) => (
              <div key={w.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-lg">
                      {w.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{w.name}</h3>
                      <p className="text-xs text-slate-500">{w.phone}</p>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${w.status === 'Active' ? 'bg-blue-500' : w.status === 'Available' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1 text-slate-500 mb-1"><Activity size={14}/> <span className="text-xs font-semibold">Active Tasks</span></div>
                    <p className="font-bold text-slate-800">{w.tasks}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1 text-slate-500 mb-1"><MapPin size={14}/> <span className="text-xs font-semibold">Location</span></div>
                    <p className="font-bold text-slate-800 text-sm truncate">{w.lastLocation}</p>
                  </div>
                </div>

                <Link to={`/supervisor/team/${w.id}`} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:border-[#4CC9B0] hover:text-[#4CC9B0] transition-colors text-sm">
                  View Details <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
