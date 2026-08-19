import { useState, useEffect } from "react"
import { 
  Users, UserCheck, UserPlus, FileText, CheckCircle, Clock, ShieldAlert, 
  Award, Loader2, TrendingUp, Activity, ArrowUpRight, CheckCircle2, AlertCircle, Building2, ChevronRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useAuth } from "../context/AuthContext"
import { Link } from "react-router-dom"

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
  const [selectedDays, setSelectedDays] = useState<number>(7)
  const [stats, setStats] = useState<any[]>([])
  const [unassignedComplaints, setUnassignedComplaints] = useState<any[]>([])
  const [overview, setOverview] = useState<any>({})
  const [departments, setDepartments] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    role: "supervisor",
    fullName: "",
    email: "",
    password: "",
    department: "Roads & Transport"
  })

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboard(selectedDays);
    fetchDepartments();
  }, [selectedDays]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE}/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data || []);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, department: data[0].name }));
        }
      }
    } catch (e) {
      console.error('Error fetching departments:', e);
    }
  };

  const fetchDashboard = async (daysCount: number = 7) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/dashboard?days=${daysCount}`, {
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
          <p className="text-slate-500 font-medium">Loading executive dashboard...</p>
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
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#1e3a34] p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-[#4CC9B0]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4CC9B0]/20 text-[#4CC9B0] text-xs font-bold uppercase tracking-wider mb-3">
              <Activity size={14} /> Executive Command Center
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Admin Overview</h1>
            <p className="mt-1.5 text-slate-300 max-w-xl text-sm leading-relaxed">
              Real-time monitoring of civic requests, workforce allocation, and system performance metrics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Timeframe Filter Dropdown */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 flex flex-col justify-center">
              <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-1 block">
                Timeframe Filter
              </label>
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="bg-slate-900/90 text-white font-bold text-xs rounded-xl px-3 py-1.5 border border-white/20 focus:outline-none focus:border-[#4CC9B0] cursor-pointer"
              >
                <option value={7}>Last 7 Days (Default)</option>
                <option value={15}>Last 15 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={60}>Last 60 Days</option>
              </select>
            </div>

            {overview.resolutionRate !== undefined && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 min-w-[180px] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#4CC9B0] text-slate-900 flex items-center justify-center font-black text-xl shadow-lg">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Resolution Rate</p>
                  <p className="text-3xl font-black text-white">{overview.resolutionRate}%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconComponent = iconMap[stat.icon] || Clock;
          return (
            <div 
              key={stat.title} 
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between hover:shadow-md transition-all group"
            >
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.title}</p>
                <p className="text-3xl font-extrabold text-slate-800 group-hover:scale-105 transition-transform">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform`}>
                <IconComponent size={26} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Complaints</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{overview.totalComplaints || 0}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-500 font-bold uppercase">Registered Citizens</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{overview.totalCitizens || 0}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-500 font-bold uppercase">Active Supervisors</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{overview.totalSupervisors || 0}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-500 font-bold uppercase">Field Workers</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{overview.totalWorkers || 0}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Personnel Assignment Block */}
        <Card className="rounded-3xl border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#4CC9B0]/10 text-[#4CC9B0]">
                <UserPlus size={20} />
              </div>
              <div>
                <CardTitle className="text-lg font-extrabold text-slate-800">Quick Personnel Assignment</CardTitle>
                <CardDescription className="text-xs">Create & onboard new supervisors or field staff instantly.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={handleAssign}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Role *</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] bg-white text-sm font-medium"
                  >
                    <option value="supervisor">Supervisor</option>
                    <option value="worker">Field Worker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Department *</label>
                  <select 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] bg-white text-sm font-medium"
                  >
                    {departments.length > 0 ? (
                      departments.map((dept: any) => (
                        <option key={dept._id} value={dept.name}>{dept.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Roads & Transport">Roads & Transport</option>
                        <option value="Water Supply">Water Supply</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Waste Management">Waste Management</option>
                        <option value="Public Safety">Public Safety</option>
                        <option value="Parks & Recreation">Parks & Recreation</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="e.g. John Doe" 
                  required
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email *</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. john@civora.com" 
                    required
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password *</label>
                  <input 
                    type="text" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Temp password" 
                    required
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm" 
                  />
                </div>
              </div>
              
              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-emerald-50 text-emerald-700 text-xs font-bold p-3 rounded-xl flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Personnel account created successfully!
                  </motion.div>
                )}
                {assignError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl flex items-center gap-2"
                  >
                    <AlertCircle size={16} />
                    {assignError}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={isAssigning}
                className="w-full h-11 rounded-xl bg-[#4CC9B0] hover:bg-[#3bb59d] disabled:bg-[#4CC9B0]/60 text-white font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2 text-sm"
              >
                {isAssigning ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Assign Employee Account
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Pending Complaints Overview */}
        <Card className="rounded-3xl border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-extrabold text-slate-800">Unassigned Civic Tickets</CardTitle>
                    <CardDescription className="text-xs">Newly logged complaints awaiting supervisor triage.</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedDays}
                    onChange={(e) => setSelectedDays(Number(e.target.value))}
                    className="bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#4CC9B0] cursor-pointer shadow-sm"
                  >
                    <option value={7}>Last 7 Days</option>
                    <option value={15}>Last 15 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={60}>Last 60 Days</option>
                  </select>
                  <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1.5 rounded-xl shrink-0">
                    {unassignedComplaints.length} Pending
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {unassignedComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-slate-700 font-bold text-sm">All Clear!</p>
                    <p className="text-slate-400 text-xs mt-1">No unassigned complaints in queue.</p>
                  </div>
                ) : (
                  unassignedComplaints.map((complaint: any) => (
                    <div 
                      key={complaint._id || complaint.id} 
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-snug">{complaint.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] font-bold text-slate-400">{complaint.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            {complaint.department || 'General'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-full shrink-0 ${
                        complaint.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 
                        complaint.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                        complaint.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {complaint.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/30">
            <Link 
              to="/admin/services" 
              className="w-full py-2.5 text-xs font-extrabold text-[#4CC9B0] hover:text-[#3bb59d] flex items-center justify-center gap-1 transition-colors"
            >
              View Full Complaints Register <ChevronRight size={16} />
            </Link>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}

