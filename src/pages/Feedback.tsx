import { useState, useEffect } from "react"
import { Star, Send, Loader2, MessageSquare, CheckCircle, Eye, Clock } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { useAuth } from "../context/AuthContext"
import { motion } from "framer-motion"

const API_BASE = 'http://localhost:5000/api';

// ==========================================
// ADMIN FEEDBACK MANAGEMENT VIEW
// ==========================================
function AdminFeedbackView() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, newCount: 0, reviewedCount: 0, resolvedCount: 0 });
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, [filter]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('status', filter);

      const response = await fetch(`${API_BASE}/admin/feedbacks?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setFeedbacks(data.feedbacks);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_BASE}/admin/feedbacks/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchFeedbacks();
    } catch (err) {
      console.error('Error updating feedback:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
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
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Citizen Feedback</h1>
        <p className="text-slate-500 mt-1">Review and manage feedback from citizens.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Feedback</p>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <p className="text-slate-500 text-sm font-medium mb-1">Average Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-amber-500">{stats.avgRating}</p>
            <Star size={24} className="fill-amber-400 text-amber-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <p className="text-slate-500 text-sm font-medium mb-1">New (Unread)</p>
          <p className="text-3xl font-bold text-blue-500">{stats.newCount}</p>
        </div>
        <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <p className="text-slate-500 text-sm font-medium mb-1">Resolved</p>
          <p className="text-3xl font-bold text-emerald-500">{stats.resolvedCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'New', 'Reviewed', 'Resolved'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              filter === s
                ? 'bg-[#4CC9B0] text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <Card className="rounded-[20px]">
            <CardContent className="py-16 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No feedback found.</p>
            </CardContent>
          </Card>
        ) : (
          feedbacks.map((fb: any) => (
            <Card key={fb._id} className="rounded-[20px] border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-sm transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4CC9B0] to-[#7DB9D7] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {fb.citizenId?.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-slate-800">{fb.subject}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          fb.status === 'New' ? 'bg-blue-50 text-blue-600' :
                          fb.status === 'Reviewed' ? 'bg-amber-50 text-amber-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {fb.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{fb.comment}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={14} className={s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">
                          by {fb.citizenId?.fullName || 'Anonymous'} • {formatDate(fb.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {fb.status === 'New' && (
                      <button
                        onClick={() => updateStatus(fb._id, 'Reviewed')}
                        className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                        title="Mark as Reviewed"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {fb.status !== 'Resolved' && (
                      <button
                        onClick={() => updateStatus(fb._id, 'Resolved')}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Mark as Resolved"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ==========================================
// CITIZEN FEEDBACK SUBMISSION VIEW
// ==========================================
function CitizenFeedbackView() {
  const { token } = useAuth();
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [subject, setSubject] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!subject || !comment || rating === 0) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/citizen/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, comment, rating })
      });
      if (response.ok) {
        setSubmitted(true);
        setSubject('');
        setComment('');
        setRating(0);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-heading">Share Your Feedback</h1>
        <p className="mt-2 text-muted-foreground">Help us improve the Civora platform and city services.</p>
      </div>

      {submitted && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-semibold text-sm p-4 rounded-xl flex items-center gap-2">
          <CheckCircle size={18} />
          Thank you! Your feedback has been submitted successfully.
        </div>
      )}

      <Card>
        <CardContent className="p-8">
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="flex flex-col items-center space-y-2 mb-8">
              <label className="text-sm font-medium text-heading mb-2">How would you rate your overall experience?</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      size={40} 
                      className={`${(hover || rating) >= star ? "fill-warning text-warning" : "text-muted"} transition-colors`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-heading">Subject</label>
              <Input 
                placeholder="What is this regarding?" 
                value={subject}
                onChange={(e: any) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-heading">Your Comments</label>
              <textarea 
                className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Tell us what you loved or what we can do better..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full gap-2" disabled={submitting || !subject || !comment || rating === 0}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// MAIN EXPORT — switches based on role
// ==========================================
export function Feedback() {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <AdminFeedbackView />;
  }
  
  return <CitizenFeedbackView />;
}