import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Users, UserPlus, KeyRound, Trash2, Search, Loader2, ShieldCheck, UserCheck, Briefcase, Mail, CheckCircle2, AlertCircle, X } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE = 'http://localhost:5000/api/admin';

export function AdminPersonnel() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [passwordModalUser, setPasswordModalUser] = useState<any | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    personalEmail: "",
    password: "",
    role: "supervisor",
    department: "Roads & Transport"
  });
  const [newPassword, setNewPassword] = useState("");

  // Status feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchPersonnel();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data || []);
        if (data.length > 0 && !createForm.department) {
          setCreateForm(prev => ({ ...prev, department: data[0].name }));
        }
      }
    } catch (e) {
      console.error('Error fetching departments:', e);
    }
  };

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/personnel`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch personnel');
      const data = await res.json();
      setPersonnel(data || []);
    } catch (err) {
      console.error('Error fetching personnel:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName || !createForm.email || !createForm.password) return;

    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`${API_BASE}/personnel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message || `${createForm.role.toUpperCase()} account created successfully!` });
        setCreateForm({ fullName: "", email: "", personalEmail: "", password: "", role: "supervisor", department: "Roads & Transport" });
        setShowCreateModal(false);
        fetchPersonnel();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Failed to create user' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Server connection error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPassword) return;

    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`${API_BASE}/personnel/${passwordModalUser._id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: `Password changed for ${passwordModalUser.fullName}` });
        setPasswordModalUser(null);
        setNewPassword("");
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Failed to update password' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Server error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;

    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`${API_BASE}/personnel/${deleteModalUser._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: `${deleteModalUser.fullName} account deleted` });
        setDeleteModalUser(null);
        fetchPersonnel();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Failed to delete account' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Server error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPersonnel = personnel.filter(p => {
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery = (p.fullName || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  const totalSupervisors = personnel.filter(p => p.role === 'supervisor').length;
  const totalWorkers = personnel.filter(p => p.role === 'worker').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto font-sans"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">User Access Management</h1>
          <p className="text-slate-500 mt-1">Grant access, change passwords, and manage Supervisor & Field Worker accounts.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="h-11 px-5 rounded-2xl bg-[#4CC9B0] hover:bg-[#3bb59d] text-white font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <UserPlus size={18} />
          Create New User Account
        </button>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {actionMessage.text}
          </div>
          <button onClick={() => setActionMessage(null)} className="text-current opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Header */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total System Users</p>
            <p className="text-3xl font-bold text-slate-800">{personnel.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#4CC9B0] flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Supervisors</p>
            <p className="text-3xl font-bold text-slate-800">{totalSupervisors}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Field Workers</p>
            <p className="text-3xl font-bold text-slate-800">{totalWorkers}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Briefcase size={24} />
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <Card className="rounded-[24px] border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Authorized Personnel Directory</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">Manage passwords, modify credentials, and delete user access.</CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search by name, email, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl w-60 focus:outline-none focus:border-[#4CC9B0] transition-all"
              />
            </div>

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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 text-[#4CC9B0] animate-spin mb-2" />
              <p className="text-sm font-medium">Loading user access records...</p>
            </div>
          ) : filteredPersonnel.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600">No personnel found.</p>
              <p className="text-xs text-slate-400 mt-1">Create user accounts using the button above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/30">
                    <th className="py-4 px-6">User / Employee</th>
                    <th className="py-4 px-6">Access Role</th>
                    <th className="py-4 px-6">Department / Area</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPersonnel.map((user) => {
                    const isSupervisor = user.role === 'supervisor';
                    return (
                      <tr key={user._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4CC9B0] to-[#7DB9D7] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                              {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{user.fullName}</p>
                              <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                                <Mail size={12} className="text-[#4CC9B0]" /> Login: {user.email}
                              </p>
                              {user.personalEmail && (
                                <p className="text-[10px] text-slate-400 font-medium">
                                  Personal Email: {user.personalEmail}
                                </p>
                              )}
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
                          <span className="font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                            {user.city || 'General'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPasswordModalUser(user)}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                            >
                              <KeyRound size={13} />
                              Change Password
                            </button>
                            <button
                              onClick={() => setDeleteModalUser(user)}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                            >
                              <Trash2 size={13} />
                              Delete User
                            </button>
                          </div>
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

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden font-sans animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="text-[#4CC9B0]" size={20} /> Create User Account
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Access Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] bg-white text-sm font-semibold text-slate-800"
                >
                  <option value="supervisor">Supervisor</option>
                  <option value="worker">Field Worker</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Civora Login Email (Portal Login ID)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.supervisor@civora.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personal Real Email (Credentials Dispatch Target)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.personal@gmail.com"
                  value={createForm.personalEmail}
                  onChange={(e) => setCreateForm({ ...createForm, personalEmail: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Temporary password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department / City Service</label>
                <select
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] bg-white text-sm font-semibold text-slate-800"
                >
                  {departments.length > 0 ? (
                    departments.map((d: any) => (
                      <option key={d._id} value={d.name}>{d.name}</option>
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
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full h-11 mt-2 rounded-xl bg-[#4CC9B0] hover:bg-[#3bb59d] text-white font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={18} />}
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden font-sans animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="text-amber-500" size={20} /> Change User Password
              </h3>
              <button onClick={() => setPasswordModalUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Set a new password for <strong className="text-slate-800">{passwordModalUser.fullName}</strong> ({passwordModalUser.email}).
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading || !newPassword}
                className="w-full h-11 mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={18} />}
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER MODAL */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden font-sans animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
                <Trash2 className="text-rose-600" size={20} /> Delete User Account
              </h3>
              <button onClick={() => setDeleteModalUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">
                Are you sure you want to delete <strong className="text-slate-900">{deleteModalUser.fullName}</strong> ({deleteModalUser.role.toUpperCase()})?
              </p>
              <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
                ⚠️ Warning: This will revoke all system access. Any active complaints assigned to this user will be unassigned automatically.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalUser(null)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all text-xs flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
