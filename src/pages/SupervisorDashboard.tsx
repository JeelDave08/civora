import { Users, FileText, CheckCircle, Clock, MapPin, Search } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

const supervisorStats = [
  { title: "Assigned Today", value: "24", icon: MapPin, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Pending", value: "8", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  { title: "Completed", value: "16", icon: CheckCircle, color: "text-[#4CC9B0]", bg: "bg-[#4CC9B0]/10" },
  { title: "Active Workers", value: "5", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
];

const assignedComplaints = [
  { id: "#CMP-892", title: "Traffic light broken", worker: "Unassigned", status: "Pending", location: "5th Ave Intersection" },
  { id: "#CMP-893", title: "Water main leak", worker: "Mike Ross", status: "In Progress", location: "Downtown Sector 4" },
  { id: "#CMP-894", title: "Fallen tree", worker: "Harvey Specter", status: "Pending Review", location: "Central Park West" },
];

export function SupervisorDashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto font-sans"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Supervisor Dashboard</h1>
          <p className="mt-1 text-slate-500">Monitor tasks, assign workers, and review completed jobs.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {supervisorStats.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Task Assignment Table */}
        <Card className="lg:col-span-2 rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800">Assign & Monitor Work</CardTitle>
            <CardDescription>Allocate field workers to pending city complaints.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-sm font-semibold text-slate-400">
                    <th className="pb-3">Complaint</th>
                    <th className="pb-3">Assigned Worker</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assignedComplaints.map((c) => (
                    <tr key={c.id}>
                      <td className="py-4 pr-4">
                        <p className="font-bold text-slate-800 text-sm">{c.title}</p>
                        <p className="text-xs text-slate-500">{c.location}</p>
                      </td>
                      <td className="py-4 pr-4">
                        {c.worker === "Unassigned" ? (
                          <select className="text-xs border border-slate-200 rounded-md p-1 outline-none focus:border-[#4CC9B0]">
                            <option value="">Select Worker...</option>
                            <option value="w1">Mike Ross</option>
                            <option value="w2">Harvey Specter</option>
                          </select>
                        ) : (
                          <span className="text-sm font-medium text-slate-700">{c.worker}</span>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                          c.status === 'Pending Review' ? 'bg-purple-100 text-purple-700' :
                          c.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {c.status === 'Pending Review' ? (
                          <button className="text-xs font-bold bg-[#4CC9B0] text-white px-3 py-1.5 rounded-lg hover:bg-[#3bb59d]">Review Images</button>
                        ) : c.worker === 'Unassigned' ? (
                          <button className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800">Assign</button>
                        ) : (
                          <span className="text-xs text-slate-400">Working</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Worker Performance */}
        <Card className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800">Worker Status</CardTitle>
            <CardDescription>Available team members.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">MR</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Mike Ross</p>
                    <p className="text-xs text-slate-500">Working on 1 task</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">HS</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Harvey Specter</p>
                    <p className="text-xs text-slate-500">Available</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
