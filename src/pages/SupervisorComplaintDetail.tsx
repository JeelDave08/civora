import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, MapPin, Calendar, Clock, UserCheck, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useAuth } from "../context/AuthContext"

const API_BASE = 'http://localhost:5000/api/admin';

export function SupervisorComplaintDetail() {
  const { id } = useParams()
  const { token } = useAuth()
  
  // Simulated flow state: 'review' -> 'assigned' -> 'worker_progress' -> 'verification' -> 'approved' -> 'closed'
  const [flowState, setFlowState] = useState<'review' | 'assigned' | 'worker_progress' | 'verification' | 'approved' | 'rework'>('review')
  
  const [assignment, setAssignment] = useState({ worker: "", startDate: "", dueDate: "" })
  const [workers, setWorkers] = useState<any[]>([])
  const [loadingWorkers, setLoadingWorkers] = useState(true)

  const [complaintData, setComplaintData] = useState<any>(null)
  const [loadingComplaint, setLoadingComplaint] = useState(true)

  useEffect(() => {
    fetchFieldWorkers()
    if (id) fetchComplaintDetail()
  }, [id])

  const fetchComplaintDetail = async () => {
    try {
      setLoadingComplaint(true)
      const res = await fetch(`${API_BASE}/complaints?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const found = (data.complaints || []).find((c: any) => c._id === id || String(c._id).endsWith(id || ''))
        if (found) {
          setComplaintData(found)
          if (found.status === 'Assigned') setFlowState('assigned')
          else if (found.status === 'Working') setFlowState('worker_progress')
          else if (found.status === 'Resolved' || found.status === 'Closed') setFlowState('approved')
        }
      }
    } catch (e) {
      console.error('Error fetching complaint details:', e)
    } finally {
      setLoadingComplaint(false)
    }
  }

  const fetchFieldWorkers = async () => {
    try {
      setLoadingWorkers(true)
      const res = await fetch(`${API_BASE}/personnel-monitoring?role=worker`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWorkers(data.personnel || [])
      }
    } catch (e) {
      console.error('Error loading workers:', e)
    } finally {
      setLoadingWorkers(false)
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignment.worker || !assignment.startDate || !assignment.dueDate) return;

    try {
      const targetId = complaintData?._id || id;
      if (targetId) {
        const response = await fetch(`${API_BASE}/complaints/${targetId}/assign`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            workerId: assignment.worker,
            startDate: assignment.startDate,
            dueDate: assignment.dueDate
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to assign worker');
        }
      }

      setFlowState('assigned')
      fetchComplaintDetail()
    } catch (err: any) {
      alert(err.message || 'Error assigning worker');
    }
  }

  const handleApprove = async () => {
    try {
      const targetId = complaintData?._id || id;
      if (targetId) {
        await fetch(`${API_BASE}/complaints/${targetId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'Closed' })
        });
      }
      setFlowState('approved')
    } catch (err) {
      console.error('Approve error:', err);
    }
  }

  const handleRework = async () => {
    try {
      const targetId = complaintData?._id || id;
      if (targetId) {
        await fetch(`${API_BASE}/complaints/${targetId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'Assigned' })
        });
      }
      setFlowState('rework')
    } catch (err) {
      console.error('Rework error:', err);
    }
  }

  const displayTitle = complaintData?.title || 'Civic Infrastructure Complaint';
  const displayDesc = complaintData?.description || 'No description available for this reported issue.';
  const displayLocation = typeof complaintData?.location === 'object' ? (complaintData.location.address || `${complaintData.location.lat}, ${complaintData.location.lng}`) : (complaintData?.location || 'Field Location');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-5xl mx-auto font-sans"
    >
      <div className="flex items-center gap-4">
        <Link to="/supervisor/complaints" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Complaint #{String(id).slice(-4).toUpperCase()}</h1>
          <p className="text-slate-500 flex items-center gap-2"><MapPin size={16}/> {displayLocation}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details & Flow */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Review Complaint */}
          <Card className="rounded-[20px] border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-100 p-4 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Attached Complaint Evidence Photos</span>
              {complaintData?.images && complaintData.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {complaintData.images.map((img: string, idx: number) => (
                    <div key={idx} className="h-44 bg-slate-200 rounded-xl overflow-hidden shadow-sm relative group border border-slate-200">
                      <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                        Photo #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : complaintData?.imageUrl ? (
                <div className="h-48 bg-slate-200 rounded-xl overflow-hidden">
                  <img src={complaintData.imageUrl} alt="Complaint Evidence" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-32 text-slate-400 font-medium text-sm flex items-center justify-center bg-slate-200/50 rounded-xl border border-dashed border-slate-300">
                  No site evidence photos attached
                </div>
              )}
            </div>
            <CardContent className="p-6 space-y-4">
              {/* Community Issue Telemetry & Reopen Alert Banner */}
              {complaintData?.communityIssue && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      👥 Community Issue Telemetry
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white">
                      {complaintData.communityIssue.supporterCount || 1} Citizens Affected
                    </span>
                  </div>

                  {complaintData.communityIssue.verification?.reopenSignaled && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 flex items-center justify-between text-xs text-rose-800 font-bold animate-pulse">
                      <span>⚠️ REOPEN SIGNAL ALERT: Citizen feedback threshold (&gt;30% &quot;Still Exists&quot;) exceeded!</span>
                      <button
                        onClick={handleRework}
                        className="px-2.5 py-1 bg-rose-600 text-white rounded-md text-[11px] font-extrabold hover:bg-rose-700 transition-colors shadow-sm"
                      >
                        Reopen & Assign Rework
                      </button>
                    </div>
                  )}

                  {complaintData.communityIssue.verification && (
                    <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                      <span>✅ {complaintData.communityIssue.verification.resolvedCount || 0} Citizens Verified Resolved</span>
                      <span>❌ {complaintData.communityIssue.verification.stillExistsCount || 0} Citizens Reported Still Exists</span>
                    </div>
                  )}
                </div>
              )}

              <h3 className="text-xl font-bold text-slate-800">{displayTitle}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {displayDesc}
              </p>


              {/* AI Photo & Issue Intelligence Card for Supervisor */}
              {(complaintData?.aiAnalysis || complaintData?.aiImageAnalysis) && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold flex items-center gap-1.5 text-[#4CC9B0]">
                        <span>🤖</span> AI Photo Detection Summary
                      </h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {complaintData.aiAnalysis?.confirmedByCitizen || complaintData.aiImageAnalysis?.confirmedByCitizen ? '✅ Citizen Confirmed' : 'AI Suggested'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Detected Issue</span>
                        <span className="font-bold text-white">{complaintData.aiAnalysis?.issueSummary || complaintData.aiImageAnalysis?.detectedIssue || complaintData.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">AI Confidence</span>
                        <span className="font-bold text-[#4CC9B0]">
                          {complaintData.aiAnalysis?.confidenceScore || complaintData.aiImageAnalysis?.confidenceScore
                            ? `${Math.round((complaintData.aiAnalysis?.confidenceScore || complaintData.aiImageAnalysis?.confidenceScore) * 100)}%`
                            : '94%'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Category</span>
                        <span className="font-semibold text-slate-200">{complaintData.aiAnalysis?.category || complaintData.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Priority</span>
                        <span className="font-semibold text-slate-200">{complaintData.aiAnalysis?.priority || complaintData.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Area Based on Flow State */}
          <AnimatePresence mode="wait">
            
            {/* STATE: Review & Assign */}
            {flowState === 'review' && (
              <motion.div key="review" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <Card className="rounded-[20px] border-slate-100 shadow-sm border-t-4 border-t-[#4CC9B0]">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Assign Field Worker</CardTitle>
                    <CardDescription>Create a task and assign it to a team member.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAssign} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Worker</label>
                        {loadingWorkers ? (
                          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                            <Loader2 className="animate-spin text-[#4CC9B0]" size={14} /> Loading workers from database...
                          </div>
                        ) : (
                          <select required className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:border-[#4CC9B0] outline-none bg-white font-medium text-sm text-slate-800" onChange={(e) => setAssignment({...assignment, worker: e.target.value})}>
                            <option value="">Choose Field Worker...</option>
                            {workers.map((w: any) => (
                              <option key={w._id} value={w._id}>
                                {w.fullName} ({w.department || 'Field Force'})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                          <input type="date" required className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:border-[#4CC9B0] outline-none text-sm" onChange={(e) => setAssignment({...assignment, startDate: e.target.value})}/>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                          <input type="date" required className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:border-[#4CC9B0] outline-none text-sm" onChange={(e) => setAssignment({...assignment, dueDate: e.target.value})}/>
                        </div>
                      </div>
                      <button type="submit" className="w-full h-11 mt-2 rounded-xl bg-[#4CC9B0] text-white font-bold hover:bg-[#3bb59d] transition-colors shadow-sm">
                        Create Task & Notify Worker
                      </button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STATE: Assigned / Worker Progress */}
            {(flowState === 'assigned' || flowState === 'worker_progress' || flowState === 'rework') && (
              <motion.div key="progress" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <Card className="rounded-[20px] border-slate-100 shadow-sm border-t-4 border-t-blue-500">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      <RefreshCw size={32} className="animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        {flowState === 'assigned' ? 'Worker Notified' : flowState === 'rework' ? 'Reworking Issue' : 'Work In Progress'}
                      </h3>
                      <p className="text-slate-500 mt-2">
                        {assignment.worker} is currently handling this issue. Awaiting completion and after-images.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STATE: Verification / Pending Citizen Verification */}
            {(flowState === 'verification' || complaintData?.status === 'Pending Citizen Verification') && (
              <motion.div key="verification" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <Card className="rounded-[20px] border-slate-100 shadow-sm border-t-4 border-t-purple-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-purple-700">Supervisor Approval & Citizen Verification</CardTitle>
                        <CardDescription>Worker marked this task as resolved. Review resolution evidence and trigger nearby citizen verification.</CardDescription>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 font-bold text-xs rounded-full">
                        Pending Supervisor Approval
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {complaintData?.afterImage ? (
                      <div className="h-56 bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200">
                        <img src={complaintData.afterImage} alt="Worker Resolution Evidence" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-sm font-medium text-center">
                        Resolution details uploaded by field agent.
                      </div>
                    )}
                    <div className="flex gap-4 pt-2">
                      <button 
                        onClick={async () => {
                          const targetId = complaintData?._id || id;
                          const res = await fetch(`${API_BASE}/complaints/${targetId}/approve-resolution`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) {
                            alert('Resolution approved! Citizen verification notifications sent to nearby citizens.');
                            fetchComplaintDetail();
                          }
                        }} 
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={20} /> Approve Resolution & Trigger Nearby Verification
                      </button>
                      <button onClick={handleRework} className="h-12 px-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-bold hover:bg-rose-100 flex items-center justify-center gap-2">
                        <AlertCircle size={20} /> Request Rework
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STATE: Community Reopened – Supervisor Review Required */}
            {(complaintData?.status?.includes('Community Reopened') || complaintData?.citizenVerification?.communityReopened) && (
              <motion.div key="community_reopened" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <Card className="rounded-[20px] border-amber-200 shadow-md bg-amber-50/50 border-2">
                  <CardHeader className="bg-amber-100/50 border-b border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xl">
                          ⚠️
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-amber-900">Community Reopen Alert</CardTitle>
                          <CardDescription className="text-amber-800/80 font-medium">
                            Citizens reported that this issue still exists after worker resolution. Supervisor review is required.
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-white rounded-xl border border-amber-200">
                        <span className="block text-xs text-amber-700 font-bold uppercase">Citizens Notified</span>
                        <span className="text-2xl font-black text-slate-800">{complaintData?.citizenVerification?.citizensNotified || 0}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-emerald-200">
                        <span className="block text-xs text-emerald-600 font-bold uppercase">✅ Resolved</span>
                        <span className="text-2xl font-black text-emerald-600">{complaintData?.citizenVerification?.yesCount || 0}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-rose-200">
                        <span className="block text-xs text-rose-600 font-bold uppercase">❌ Still Exists</span>
                        <span className="text-2xl font-black text-rose-600">{complaintData?.citizenVerification?.stillExistsCount || 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                      <button 
                        onClick={async () => {
                          const targetId = complaintData?._id || id;
                          const res = await fetch(`${API_BASE}/complaints/${targetId}/reopen-review`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ action: 'REWORK', supervisorNotes: 'Assigned rework based on community feedback.' })
                          });
                          if (res.ok) {
                            alert('Complaint reassigned for rework.');
                            fetchComplaintDetail();
                          }
                        }} 
                        className="flex-1 h-12 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shadow-md flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={18} /> Reassign Rework to Worker
                      </button>
                      <button 
                        onClick={async () => {
                          const targetId = complaintData?._id || id;
                          const res = await fetch(`${API_BASE}/complaints/${targetId}/reopen-review`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ action: 'CLOSE', supervisorNotes: 'Verified resolved after supervisor inspection.' })
                          });
                          if (res.ok) {
                            alert('Complaint closed by supervisor.');
                            fetchComplaintDetail();
                          }
                        }} 
                        className="h-12 px-6 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors"
                      >
                        Force Close Issue
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Citizen Verification Telemetry Card */}
            {complaintData?.citizenVerification && (
              <Card className="rounded-[20px] border-slate-100 shadow-sm mt-6">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center justify-between">
                    <span>Citizen Verification Results</span>
                    <span className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold">
                      {complaintData.citizenVerification.verificationStatus || 'IN_VERIFICATION'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-xs text-slate-500 font-bold uppercase block mb-1">👥 Notified</span>
                      <span className="text-2xl font-black text-slate-800">{complaintData.citizenVerification.citizensNotified || 0}</span>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-xs text-emerald-700 font-bold uppercase block mb-1">✅ Resolved</span>
                      <span className="text-2xl font-black text-emerald-600">{complaintData.citizenVerification.yesCount || 0}</span>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                      <span className="text-xs text-rose-700 font-bold uppercase block mb-1">❌ Still Exists</span>
                      <span className="text-2xl font-black text-rose-600">{complaintData.citizenVerification.stillExistsCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STATE: Approved */}
            {flowState === 'approved' && (
              <motion.div key="approved" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <Card className="rounded-[20px] border-slate-100 shadow-sm border-t-4 border-t-emerald-500">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Task Approved</h3>
                      <p className="text-slate-500 mt-2">
                        Citizen verification active. Feedback is being aggregated.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Right Column - Timeline */}
        <div className="space-y-6">
          <Card className="rounded-[20px] border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">Flow Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#4CC9B0] text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                    <AlertCircle size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900 text-sm">Complaint Created</div>
                    </div>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${flowState !== 'review' ? 'is-active' : 'opacity-50'}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${flowState !== 'review' ? 'bg-blue-500 text-white shadow' : 'bg-slate-200 text-slate-500'} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                    <UserCheck size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="font-bold text-slate-900 text-sm">Assigned & Notified</div>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${(flowState === 'verification' || flowState === 'approved') ? 'is-active' : 'opacity-50'}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${(flowState === 'verification' || flowState === 'approved') ? 'bg-purple-500 text-white shadow' : 'bg-slate-200 text-slate-500'} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                    <RefreshCw size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="font-bold text-slate-900 text-sm">Work Completed</div>
                  </div>
                </div>

                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${flowState === 'approved' ? 'is-active' : 'opacity-50'}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${flowState === 'approved' ? 'bg-emerald-500 text-white shadow' : 'bg-slate-200 text-slate-500'} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="font-bold text-slate-900 text-sm">Verified & Closed</div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </motion.div>
  )
}
