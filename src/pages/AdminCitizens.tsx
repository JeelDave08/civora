import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Users, UserPlus, UserCheck, UserX, Search, Loader2, Mail, MapPin, Calendar } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { motion } from "framer-motion"

const API_BASE = 'http://localhost:5000/api/admin';

export function AdminCitizens() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, newRegistrations: 0, active: 0, suspended: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    fetchCitizens();
  }, [page, search]);

  const fetchCitizens = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.append('search', search);

      const response = await fetch(`${API_BASE}/citizens?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch citizens');

      const data = await response.json();
      setCitizens(data.citizens);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching citizens:', err);
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Citizen Directory</h1>
          <p className="text-slate-500 mt-1">Manage registered citizens and their details.</p>
        </div>
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
                    </tr>
                  </thead>
                  <tbody>
                    {citizens.map((citizen: any) => (
                      <tr key={citizen._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4CC9B0] to-[#7DB9D7] flex items-center justify-center text-white text-sm font-bold">
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
    </motion.div>
  )
}
