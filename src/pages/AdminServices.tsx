import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Activity, Zap, ShieldCheck, Loader2, CheckCircle, AlertTriangle, XCircle, Droplets, Trash2, Car, Trees } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE = 'http://localhost:5000/api/admin';

const iconMap: Record<string, any> = {
  Car, Droplets, Zap, Trash2, ShieldCheck, Trees, Server: Activity, Activity
};

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  Active: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
  Maintenance: { color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
  Inactive: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
};

export function AdminServices() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`${API_BASE}/departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setDepartments(prev => prev.map(d => d._id === id ? { ...d, status: newStatus } : d));
      }
    } catch (err) {
      console.error('Error updating department:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#4CC9B0] animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">City Services</h1>
          <p className="text-slate-500 mt-1">Manage and monitor all smart city services.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => {
          const IconComp = iconMap[dept.icon] || Activity;
          const statusCfg = statusConfig[dept.status] || statusConfig.Active;
          const StatusIcon = statusCfg.icon;

          return (
            <Card key={dept._id} className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${statusCfg.bg} flex items-center justify-center`}>
                    <IconComp size={22} className={dept.color || statusCfg.color} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">{dept.name}</CardTitle>
                    <div className={`flex items-center gap-1 mt-0.5 ${statusCfg.color}`}>
                      <StatusIcon size={12} />
                      <span className="text-xs font-semibold">{dept.status}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">{dept.description || 'No description available.'}</p>
                
                <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                    {dept.supervisorCount || 0} Supervisors
                  </span>
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                    {dept.workerCount || 0} Workers
                  </span>
                </div>

                <div className="flex gap-2">
                  {['Active', 'Maintenance', 'Inactive'].map(status => (
                    <button
                      key={status}
                      onClick={() => updateStatus(dept._id, status)}
                      disabled={dept.status === status || updatingId === dept._id}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                        dept.status === status
                          ? `${statusConfig[status].bg} ${statusConfig[status].color} border border-current/20`
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                      } disabled:cursor-not-allowed`}
                    >
                      {updatingId === dept._id ? '...' : status}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  )
}
