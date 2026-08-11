import { useParams, Link } from "react-router-dom"
import { ArrowLeft, User, Phone, MapPin, CheckCircle, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

export function SupervisorWorkerDetail() {
  const { id } = useParams()
  
  // Dummy data based on ID
  const worker = {
    id,
    name: id === 'w1' ? 'Mike Ross' : 'Harvey Specter',
    phone: '+1 234 567 8900',
    email: 'worker@civora.com',
    status: 'Active',
    totalCompleted: 42,
    rating: 4.8,
    joinDate: 'Jan 2023'
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-5xl mx-auto font-sans"
    >
      <div className="flex items-center gap-4">
        <Link to="/supervisor/team" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Worker Details</h1>
          <p className="text-slate-500 flex items-center gap-2">View performance and current tasks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="rounded-[20px] border-slate-100 shadow-sm lg:col-span-1 h-fit">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 flex items-center justify-center font-bold text-slate-500 text-3xl">
              {worker.name.split(' ').map(n=>n[0]).join('')}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{worker.name}</h2>
            <p className="text-slate-500 text-sm mb-4">Field Worker</p>
            <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-6">
              {worker.status}
            </span>

            <div className="w-full space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" /> {worker.phone}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <User size={16} className="text-slate-400" /> {worker.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400" /> Sector 4 (Current)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-xs font-medium mb-1">Tasks Completed</p>
              <p className="text-2xl font-bold text-slate-900">{worker.totalCompleted}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-xs font-medium mb-1">Avg Rating</p>
              <p className="text-2xl font-bold text-slate-900">{worker.rating}/5.0</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hidden md:block">
              <p className="text-slate-500 text-xs font-medium mb-1">Member Since</p>
              <p className="text-2xl font-bold text-slate-900">{worker.joinDate}</p>
            </div>
          </div>

          <Card className="rounded-[20px] border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Current Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Water main leak</h4>
                    <p className="text-xs text-slate-500 mt-1">Downtown Sector 4</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-700">In Progress</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-[20px] border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Recent History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Pothole fixed</h4>
                    <p className="text-xs text-slate-500">Completed 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Streetlight replaced</h4>
                    <p className="text-xs text-slate-500">Completed 4 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
