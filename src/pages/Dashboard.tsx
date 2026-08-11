import { useState } from "react"
import { Users, UserCheck, UserPlus, FileText, CheckCircle, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

// Dummy JSON Data for Admin
const adminStats = [
  { title: "Pending Complaints", value: "142", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  { title: "Resolved Today", value: "38", icon: CheckCircle, color: "text-[#4CC9B0]", bg: "bg-[#4CC9B0]/10" },
  { title: "Active Supervisors", value: "12", icon: UserCheck, color: "text-[#7DB9D7]", bg: "bg-[#7DB9D7]/10" },
  { title: "Field Workers", value: "45", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
];

const pendingComplaints = [
  { id: "#CMP-892", title: "Traffic light broken on 5th Ave", department: "Roads", priority: "High" },
  { id: "#CMP-893", title: "Water main leak", department: "Water", priority: "Critical" },
  { id: "#CMP-894", title: "Fallen tree blocking road", department: "Parks", priority: "High" },
];

export function Dashboard() {
  const [isAssigning, setIsAssigning] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    role: "supervisor",
    fullName: "",
    email: "",
    password: "",
    department: "Roads & Transport"
  })

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName || !formData.email || !formData.password) return;
    
    setIsAssigning(true)

    // Save to localStorage for temporary checking
    const existingUsers = JSON.parse(localStorage.getItem('temp_users') || '[]');
    existingUsers.push({
      email: formData.email.toLowerCase(),
      password: formData.password,
      role: formData.role,
      name: formData.fullName
    });
    localStorage.setItem('temp_users', JSON.stringify(existingUsers));
    
    // Simulate API call
    setTimeout(() => {
      setIsAssigning(false)
      setShowSuccess(true)
      
      // Reset form
      setFormData({
        role: "supervisor",
        fullName: "",
        email: "",
        password: "",
        department: "Roads & Transport"
      })
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000)
    }, 800)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto font-sans"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-slate-500">Manage city operations, assign personnel, and track system analytics.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-sm transition-all">
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

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Personnel Assignment Block */}
        <Card className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800">Assign Personnel</CardTitle>
            <CardDescription>Allocate supervisors and field workers to departments.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleAssign}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] bg-white text-sm"
                >
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="e.g. John Doe" 
                  required
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="e.g. john@civora.com" 
                  required
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                <input 
                  type="text" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="e.g. securePass123" 
                  required
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] bg-white text-sm"
                >
                  <option>Roads & Transport</option>
                  <option>Water Supply</option>
                  <option>Electricity</option>
                  <option>Waste Management</option>
                </select>
              </div>
              
              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-emerald-50 text-emerald-600 text-sm font-semibold p-3 rounded-xl flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Personnel Successfully Assigned!
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={isAssigning}
                className="w-full h-11 rounded-xl bg-[#4CC9B0] hover:bg-[#3bb59d] disabled:bg-[#4CC9B0]/60 text-white font-bold transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {isAssigning ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Assign Employee
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Pending Complaints Overview */}
        <Card className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800">Recent Tickets (Unassigned)</CardTitle>
            <CardDescription>Complaints waiting for supervisor assignment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingComplaints.map((complaint) => (
                <div key={complaint.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{complaint.title}</h4>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs font-medium text-slate-500">{complaint.id}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{complaint.department}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    complaint.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {complaint.priority}
                  </span>
                </div>
              ))}
              <button className="w-full py-2 mt-2 text-sm font-bold text-[#4CC9B0] hover:underline">
                View All Tickets →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
