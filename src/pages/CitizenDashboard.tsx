import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusCircle, FileText, Map, Bell, Award, User, Settings,
  AlertTriangle, ShieldAlert, CheckCircle, Clock, Activity, MapPin, 
  Star, Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const quickActionsData = [
  { id: 1, title: "Report Complaint", icon: PlusCircle, bg: "bg-[#3E766D]", text: "text-white", to: "/citizen/raise-complaint" },
  { id: 2, title: "Track Complaint", icon: MapPin, bg: "bg-white", text: "text-[#3E766D]", to: "/citizen/track-complaint" },
  { id: 3, title: "Emergency", icon: AlertTriangle, bg: "bg-rose-500", text: "text-white", to: "/emergency" },
  { id: 4, title: "Nearby Issues", icon: Map, bg: "bg-white", text: "text-[#3E766D]", to: "/citizen/nearby" },
];

// Quick actions remain constant

// --- STYLING HELPERS ---
const getStatusColor = (status: string) => {
  switch (status) {
    case 'New': return 'bg-blue-100 text-blue-700';
    case 'Assigned': return 'bg-purple-100 text-purple-700';
    case 'Working': return 'bg-amber-100 text-amber-700';
    case 'Resolved': return 'bg-emerald-100 text-emerald-700';
    case 'Closed': return 'bg-slate-100 text-slate-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical': return 'text-rose-600 bg-rose-50 border-rose-200';
    case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};


export function CitizenDashboard() {
  const { token } = useAuth();
  const [statsData, setStatsData] = useState<any[]>([]);
  const [recentComplaintsData, setRecentComplaintsData] = useState<any[]>([]);
  const [announcementsData, setAnnouncementsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/citizen/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const iconMap: { [key: string]: any } = {
            FileText, Activity, CheckCircle, Clock, ShieldAlert, Award
          };
          
          setStatsData(data.stats.map((s: any) => ({ ...s, icon: iconMap[s.icon] || FileText })));
          setRecentComplaintsData(data.recentComplaints);
          setAnnouncementsData(data.announcements.map((a: any) => ({ ...a, icon: iconMap[a.icon] || Bell })));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-slate-500 font-medium">Loading dashboard...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1.5">Welcome back! Here is what's happening in your city.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActionsData.map((action) => (
            <Link 
              key={action.id}
              to={action.to}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-[16px] font-semibold text-sm shadow-sm hover:shadow-md transition-all ${action.bg} ${action.text} border border-slate-200`}
            >
              <action.icon size={18} />
              <span className="hidden sm:inline">{action.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsData.map((stat) => (
          <div key={stat.id} className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
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

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN - Tables & Map */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Recent Complaints Table */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Recent Complaints</h3>
              <Link to="/citizen/complaints" className="text-sm font-semibold text-[#3E766D] hover:underline">View All</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">Complaint</th>
                    <th className="pb-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="pb-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                    <th className="pb-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentComplaintsData.length > 0 ? recentComplaintsData.map((complaint) => {
                    const progress = complaint.status === 'Resolved' ? 100 : complaint.status === 'Working' ? 60 : complaint.status === 'Assigned' ? 30 : 10;
                    return (
                    <tr key={complaint._id || complaint.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                      <td className="py-4 pr-4">
                        <p className="font-bold text-slate-800 text-[15px]">{complaint.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-slate-400">
                            #{complaint._id ? complaint._id.substring(complaint._id.length - 6).toUpperCase() : complaint.id}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500">
                            {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : complaint.date}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                            <div 
                              className="h-full bg-[#3E766D] rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-500">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No recent complaints found. Report an issue to see it here!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Map Section */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Nearby Complaints Map</h3>
              <Link to="/citizen/nearby" className="text-sm font-semibold text-slate-500 hover:text-slate-800">Open in Maps</Link>
            </div>
            {/* Google Maps Placeholder */}
            <div className="w-full h-[300px] bg-slate-100 rounded-[16px] border border-slate-200 overflow-hidden relative group">
              <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=New+York,NY&zoom=13&size=800x400&maptype=roadmap&key=dummy')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500"></div>
              
              {/* Dummy Map Pins */}
              <div className="absolute top-1/3 left-1/4 animate-bounce">
                <MapPin className="text-rose-500 drop-shadow-md" size={32} fill="white" />
              </div>
              <div className="absolute top-1/2 right-1/3 animate-bounce" style={{ animationDelay: '200ms' }}>
                <MapPin className="text-amber-500 drop-shadow-md" size={32} fill="white" />
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <Link to="/citizen/nearby" className="px-6 py-3 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-800 font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
                  Explore Area
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Announcements & Feedback */}
        <div className="space-y-8">
          
          {/* Announcements Card */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Announcements</h3>
            <div className="space-y-4">
              {announcementsData.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-[16px] bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className={`mt-0.5 ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{item.type}</p>
                    <p className="text-[15px] font-bold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-2">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Card */}
          <div className="bg-gradient-to-br from-[#3E766D] to-[#2D5A52] rounded-[20px] shadow-[0_10px_30px_rgba(62,118,109,0.2)] p-6 text-white relative overflow-hidden">
            {/* Decor shapes */}
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-[20px]"></div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Help Us Improve</h3>
              <p className="text-white/80 text-sm mb-6">Rate your experience with the platform or drop a suggestion.</p>
              
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className="text-white/30 hover:text-[#F5B32C] hover:scale-110 transition-all">
                    <Star size={24} fill="currentColor" />
                  </button>
                ))}
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Your suggestion..." 
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition-all text-sm"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white text-[#3E766D] flex items-center justify-center hover:bg-[#F5B32C] hover:text-white transition-colors">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </motion.div>
  );
}
