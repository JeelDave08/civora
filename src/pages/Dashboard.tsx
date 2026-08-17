import { useState, useEffect } from "react"
import { Users, UserCheck, UserPlus, FileText, CheckCircle, Clock, ShieldAlert, Award, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useAuth } from "../context/AuthContext"

const API_BASE = 'http://localhost:5000/api/admin';

const iconMap: Record<string, any> = {
  Clock, CheckCircle, UserCheck, Users, ShieldAlert, Award
};

export function Dashboard() {
  const { token } = useAuth();
  const [isAssigning, setIsAssigning] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assignError, setAssignError] = useState('')

  // Dashboard data from API
  const [stats, setStats] = useState<any[]>([])
  const [unassignedComplaints, setUnassignedComplaints] = useState<any[]>([])
  const [overview, setOverview] = useState<any>({})
  
  const [formData, setFormData] = useState({
    role: "supervisor",
    fullName: "",
    email: "",
    password: "",
    department: "Roads & Transport"
  })

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      
      const data = await response.json();
      setStats(data.stats);
      setUnassignedComplaints(data.unassignedComplaints || []);
      setOverview(data.overview || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName || !formData.email || !formData.password) return;
    
    setIsAssigning(true)
    setAssignError('')

    try {
      const response = await fetch(`${API_BASE}/personnel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department
        })
      });

      const result = await response.json();

      if (response.ok) {
        setShowSuccess(true)
        setFormData({
          role: "supervisor",
          fullName: "",
          email: "",
          password: "",
          department: "Roads & Transport"
        })
        // Refresh dashboard stats
        fetchDashboard();
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        setAssignError(result.message || 'Failed to create account');
      }
    } catch (err) {
      setAssignError('Connection error. Please try again.');
    } finally {
      setIsAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#4CC9B0] animate-spin" />
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
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
        {overview.resolutionRate !== undefined && (
          <div className="bg-gradient-to-r from-[#4CC9B0]/10 to-[#7DB9D7]/10 border border-[#4CC9B0]/20 rounded-2xl px-5 py-3">
            <p className="text-xs text-slate-500 font-medium">Resolution Rate</p>
            <p className="text-2xl font-bold text-[#4CC9B0]">{overview.resolutionRate}%</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconComponent = iconMap[stat.icon] || Clock;
          return (
            <div key={stat.title} className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-sm transition-all">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <IconComponent size={24} />
              </div>
            </div>
          );
        })}
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
                  <option value="worker">Worker</option>
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
                  <option>Public Safety</option>
                  <option>Parks & Recreation</option>
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
                {assignError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl flex items-center gap-2"
                  >
                    {assignError}
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
              {unassignedComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">All caught up! No unassigned tickets.</p>
                </div>
              ) : (
                unassignedComplaints.map((complaint: any) => (
                  <div key={complaint._id || complaint.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{complaint.title}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs font-medium text-slate-500">{complaint.id}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{complaint.department}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      complaint.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 
                      complaint.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                      complaint.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {complaint.priority}
                    </span>
                  </div>
                ))
              )}
              {unassignedComplaints.length > 0 && (
                <button className="w-full py-2 mt-2 text-sm font-bold text-[#4CC9B0] hover:underline">
                  View All Tickets →
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
