import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Activity, Loader2, UserCheck, Users, ShieldCheck, CheckCircle2, Clock, Search, Filter, Mail, Phone, Briefcase } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { motion } from "framer-motion"

const API_BASE = 'http://localhost:5000/api/admin';

export function AdminMonitoring() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalSupervisors: 0,
    totalWorkers: 0,
    totalActiveTasks: 0,
    totalResolvedTasks: 0
  });

  useEffect(() => {
    fetchPersonnelMonitoring();
  }, [roleFilter]);

  const fetchPersonnelMonitoring = async () => {
    try {
      setLoading(true);
      const url = roleFilter === "all" 
        ? `${API_BASE}/personnel-monitoring` 
        : `${API_BASE}/personnel-monitoring?role=${roleFilter}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch personnel monitoring data');
      const data = await response.json();
      setPersonnel(data.personnel || []);
      setStats(data.stats || {
        totalSupervisors: 0,
        totalWorkers: 0,
        totalActiveTasks: 0,
        totalResolvedTasks: 0
      });
    } catch (err) {
      console.error('Error fetching personnel monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPersonnel = personnel.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.fullName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-10 h-10 text-[#4CC9B0] animate-spin" />
        <p className="text-sm font-medium">Loading supervisor and field worker telemetry...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto font-sans"
    >
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Personnel Monitoring</h1>
        <p className="text-slate-500 mt-1">Live operational telemetry for Supervisors and Field Workers only.</p>
      </div>

      {/* Top Telemetry Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Supervisors Monitored", value: String(stats.totalSupervisors), icon: UserCheck, color: "text-[#7DB9D7]", bg: "bg-[#7DB9D7]/10" },
          { title: "Field Workers Monitored", value: String(stats.totalWorkers), icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
          { title: "Active Tasks in Progress", value: String(stats.totalActiveTasks), icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { title: "Total Tasks Resolved", value: String(stats.totalResolvedTasks), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Monitoring Table & Filters */}
      <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Supervisors & Field Workers Roster</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">Real-time status, assigned workloads, and resolution metrics.</CardDescription>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search name, email or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl w-60 focus:outline-none focus:border-[#4CC9B0] transition-all"
              />
            </div>

            {/* Role Filter Buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
              <button
                onClick={() => setRoleFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${roleFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"}`}
              >
                All
              </button>
              <button
                onClick={() => setRoleFilter("supervisor")}
                className={`px-3 py-1.5 rounded-lg transition-all ${roleFilter === "supervisor" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                Supervisors
              </button>
              <button
                onClick={() => setRoleFilter("worker")}
                className={`px-3 py-1.5 rounded-lg transition-all ${roleFilter === "worker" ? "bg-white text-purple-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                Workers
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredPersonnel.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600">No personnel found matching your filter.</p>
              <p className="text-xs text-slate-400 mt-1">Supervisors and Field Workers will appear here when registered.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/30">
                    <th className="py-4 px-6">Personnel</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Department / Area</th>
                    <th className="py-4 px-6">Active Tasks</th>
                    <th className="py-4 px-6">Resolved Tasks</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPersonnel.map((person) => {
                    const isSupervisor = person.role === 'supervisor';
                    return (
                      <tr key={person._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600">
                              {person.profileImage ? (
                                <img src={person.profileImage} alt={person.fullName} className="w-full h-full object-cover" />
                              ) : (
                                person.fullName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{person.fullName}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Mail size={12} /> {person.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] ${
                            isSupervisor 
                              ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                              : 'bg-purple-50 text-purple-700 border border-purple-100'
                          }`}>
                            {isSupervisor ? <UserCheck size={12} /> : <Briefcase size={12} />}
                            {isSupervisor ? 'Supervisor' : 'Field Worker'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {person.department}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            {person.activeTasks}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 font-bold text-emerald-600">
                            <CheckCircle2 size={14} />
                            {person.resolvedTasks}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active On Duty
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Real-Time Activity & Notifications Feed */}
      <AdminActivityFeed token={token} />
    </motion.div>
  );
}

function AdminActivityFeed({ token }: { token: string | null }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/activity-logs?limit=40`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden mt-6">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-slate-800">Supervisors & Field Workers Notifications Feed</CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">Real-time log of supervisor logins, field worker logins, assignments, and work progress.</CardDescription>
        </div>
        <button 
          onClick={fetchLogs} 
          className="text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          <Activity size={14} className="text-[#4CC9B0]" /> Refresh Log
        </button>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 text-[#4CC9B0] animate-spin mr-2" />
            <span className="text-xs font-semibold">Loading system telemetry logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium">
            No system notifications recorded yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-sm transition-all flex items-start gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold uppercase shadow-sm ${
                  log.actorRole === 'supervisor' ? 'bg-blue-100 text-blue-700' :
                  log.actorRole === 'worker' ? 'bg-purple-100 text-purple-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {log.actorRole ? log.actorRole.charAt(0) : 'A'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800 text-xs">{log.title}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{log.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{log.details}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-500">By: {log.actorName}</span>
                    <span>•</span>
                    <span className="uppercase font-extrabold text-[#4CC9B0]">{log.actorRole}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
