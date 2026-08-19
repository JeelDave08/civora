import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Users, UserPlus, UserCheck, UserX, Search, Loader2, Mail, MapPin, Calendar, Key, Trash2, X, CheckCircle, AlertTriangle } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE = 'http://localhost:5000/api/admin';

export function AdminCitizens() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, newRegistrations: 0, active: 0, suspended: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Modals & form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);

  const [addForm, setAddForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    address: ''
  });
  const [newPassword, setNewPassword] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchCitizens();
  }, [page, search]);

  const safeJsonParse = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    throw new Error(response.statusText || 'Server error occurred');
  };

  const fetchCitizens = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.append('search', search);

      const response = await fetch(`${API_BASE}/citizens?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await safeJsonParse(response).catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: Failed to fetch citizens`);
      }

      const data = await safeJsonParse(response);
      setCitizens(data.citizens || []);
      setStats(data.stats || { total: 0, newRegistrations: 0, active: 0, suspended: 0 });
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (err: any) {
      console.error('Error fetching citizens:', err);
      showToast('error', err.message || 'Failed to fetch citizens');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateCitizen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.fullName || !addForm.email || !addForm.password) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/citizens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addForm)
      });

      if (!response.ok) {
        const errorData = await safeJsonParse(response).catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: Failed to create citizen`);
      }

      const data = await safeJsonParse(response);
      showToast('success', data.message || 'Citizen created successfully!');
      setIsAddModalOpen(false);
      setAddForm({ fullName: '', email: '', password: '', phone: '', city: '', address: '' });
      fetchCitizens();
    } catch (err: any) {
      showToast('error', err.message || 'Error creating citizen account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const citizenId = selectedCitizen?._id || selectedCitizen?.id;
    if (!citizenId || !newPassword) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/citizens/${citizenId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) {
        const errorData = await safeJsonParse(response).catch(() => null);
        throw new Error(errorData?.message || `Failed to update password`);
      }

      const data = await safeJsonParse(response);
      showToast('success', data.message || `Password updated for ${selectedCitizen.fullName}`);
      setIsPasswordModalOpen(false);
      setSelectedCitizen(null);
      setNewPassword('');
    } catch (err: any) {
      showToast('error', err.message || 'Error updating password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCitizen = async (citizen: any) => {
    const citizenId = citizen?._id || citizen?.id;
    if (!citizenId) return;

    if (!window.confirm(`Are you sure you want to delete ${citizen.fullName}'s account? This action cannot be undone.`)) return;

    try {
      // Optimistically update local state immediately
      setCitizens(prev => prev.filter(c => (c._id || c.id) !== citizenId));

      const response = await fetch(`${API_BASE}/citizens/${citizenId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await safeJsonParse(response).catch(() => null);
        throw new Error(errorData?.message || `Failed to delete citizen`);
      }

      const data = await safeJsonParse(response);
      showToast('success', data.message || `Deleted ${citizen.fullName} successfully`);
      fetchCitizens();
    } catch (err: any) {
      showToast('error', err.message || 'Error deleting citizen account');
      fetchCitizens(); // revert on failure
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  const statCards = [
    { title: "Total Citizens", count: stats.total.toLocaleString(), icon: Users, color: "text-[#4CC9B0]", bg: "bg-[#4CC9B0]/10" },
    { title: "New This Week", count: String(stats.newRegistrations), icon: UserPlus, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Active Users", count: stats.active.toLocaleString(), icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Suspended", count: String(stats.suspended), icon: UserX, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto"
    >
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-bold ${
              feedback.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Citizen Directory</h1>
          <p className="text-slate-500 mt-1">Manage registered citizens, create new accounts, and update passwords.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#4CC9B0] hover:bg-[#3bb59d] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all hover:shadow-lg"
        >
          <UserPlus size={18} />
          Create Citizen
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-sm transition-all">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-slate-800">{stat.count}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Table */}
      <Card className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold text-slate-800">Citizen Records</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email, city..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm bg-white"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#4CC9B0] animate-spin" />
            </div>
          ) : citizens.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No citizens found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">City</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citizens.map((citizen: any) => (
                      <tr key={citizen._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4CC9B0] to-[#7DB9D7] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                              {citizen.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="font-semibold text-slate-800 text-sm">{citizen.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Mail size={14} className="text-slate-400" />
                            {citizen.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin size={14} className="text-slate-400" />
                            {citizen.city || '—'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Calendar size={14} className="text-slate-400" />
                            {formatDate(citizen.createdAt)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedCitizen(citizen); setIsPasswordModalOpen(true); }}
                              title="Change Password"
                              className="p-2 rounded-lg text-slate-500 hover:text-[#4CC9B0] hover:bg-[#4CC9B0]/10 transition-colors"
                            >
                              <Key size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCitizen(citizen)}
                              title="Delete Account"
                              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    Showing page {page} of {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-[#4CC9B0] text-white hover:bg-[#3bb59d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* CREATE CITIZEN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative"
          >
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Create Citizen Account</h3>
            <p className="text-slate-500 text-sm mb-6">Register a new citizen in the system.</p>

            <form onSubmit={handleCreateCitizen} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Initial password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Ahmedabad"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-[#4CC9B0] hover:bg-[#3bb59d] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && selectedCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative"
          >
            <button 
              onClick={() => { setIsPasswordModalOpen(false); setSelectedCitizen(null); }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Update Citizen Password</h3>
            <p className="text-slate-500 text-sm mb-6">
              Changing password for <span className="font-bold text-slate-800">{selectedCitizen.fullName}</span> ({selectedCitizen.email})
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Password *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsPasswordModalOpen(false); setSelectedCitizen(null); }}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-[#4CC9B0] hover:bg-[#3bb59d] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  )
}

