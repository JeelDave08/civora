import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Activity, Zap, ShieldCheck, Loader2, CheckCircle, AlertTriangle, XCircle, Droplets, Trash2, Car, Trees, Plus, X } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE = 'http://localhost:5000/api/admin';

const iconMap: Record<string, any> = {
  Car, Droplets, Zap, Trash2, ShieldCheck, Trees, Server: Activity, Activity
};

const iconOptions = ['Car', 'Droplets', 'Zap', 'Trash2', 'ShieldCheck', 'Trees', 'Activity'];

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
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    icon: 'Activity',
    color: 'text-emerald-500',
    status: 'Active'
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

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

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create service');

      showFeedback('success', `City Service "${data.name}" created successfully!`);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', icon: 'Activity', color: 'text-emerald-500', status: 'Active' });
      fetchDepartments();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error creating service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" service department?`)) return;

    try {
      const response = await fetch(`${API_BASE}/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete service');

      showFeedback('success', `Service "${name}" deleted`);
      fetchDepartments();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting service');
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
        showFeedback('success', 'Service status updated');
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
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto font-sans relative"
    >
      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-bold ${
              toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">City Services</h1>
          <p className="text-slate-500 mt-1">Manage, add, and monitor all smart city services & departments.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#4CC9B0] hover:bg-[#3bb59d] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all hover:shadow-lg"
        >
          <Plus size={18} />
          Add New Service
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => {
          const IconComp = iconMap[dept.icon] || Activity;
          const statusCfg = statusConfig[dept.status] || statusConfig.Active;
          const StatusIcon = statusCfg.icon;

          return (
            <Card key={dept._id} className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all group relative overflow-hidden">
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
                <button
                  onClick={() => handleDeleteService(dept._id, dept.name)}
                  title="Delete Service"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">{dept.description || 'No description available.'}</p>
                
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

      {/* CREATE SERVICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative"
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Add New City Service</h3>
            <p className="text-slate-500 text-xs mb-6">Create a service department accessible across the city portal.</p>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Service / Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Health & Sanitation"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  placeholder="Brief summary of service duties..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Icon Style</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {iconOptions.map(iconName => {
                    const IconComp = iconMap[iconName] || Activity;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, icon: iconName })}
                        className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                          createForm.icon === iconName ? 'bg-[#4CC9B0]/10 border-[#4CC9B0] text-[#4CC9B0]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <IconComp size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-[#4CC9B0] hover:bg-[#3bb59d] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Service'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

