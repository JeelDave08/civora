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

  useEffect(() => {
    fetchFieldWorkers()
  }, [])

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
      if (id && id.length === 24) {
        const response = await fetch(`${API_BASE}/complaints/${id}/assign`, {
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
      setTimeout(() => setFlowState('worker_progress'), 2000)
      setTimeout(() => setFlowState('verification'), 6000)
    } catch (err: any) {
      alert(err.message || 'Error assigning worker');
    }
  }

  const handleApprove = async () => {
    try {
      if (id && id.length === 24) {
        await fetch(`${API_BASE}/complaints/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'Resolved' })
        });
      }
      setFlowState('approved')
    } catch (err) {
      console.error('Approve error:', err);
    }
  }

  const handleRework = () => {
    setFlowState('rework')
    setTimeout(() => setFlowState('worker_progress'), 2000)
    setTimeout(() => setFlowState('verification'), 6000)
  }

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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Complaint #{id}</h1>
          <p className="text-slate-500 flex items-center gap-2"><MapPin size={16}/> 5th Ave Intersection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details & Flow */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Review Complaint */}
          <Card className="rounded-[20px] border-slate-100 shadow-sm overflow-hidden">
            <div className="h-48 bg-slate-200 relative">
              {/* Placeholder Image */}
              <div className="absolute inset-0 bg-slate-300 flex items-center justify-center text-slate-500 font-semibold text-sm">
                 [Before Image / User Uploaded Site Evidence]
              </div>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Traffic light broken</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                The main traffic light at the intersection has been malfunctioning since yesterday evening, causing severe traffic jams and near accidents.
              </p>
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

            {/* STATE: Verification */}
            {flowState === 'verification' && (
              <motion.div key="verification" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <Card className="rounded-[20px] border-slate-100 shadow-sm border-t-4 border-t-purple-500">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-purple-700">Supervisor Verification Required</CardTitle>
                    <CardDescription>Worker marked this task as complete. Review the after images.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-slate-200 mb-6 rounded-xl relative flex items-center justify-center text-slate-500">
                      [After Image Uploaded by Worker]
                    </div>
                    <div className="flex gap-4">
                      <button onClick={handleApprove} className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 flex items-center justify-center gap-2">
                        <CheckCircle2 size={20} /> Approve & Notify Citizen
                      </button>
                      <button onClick={handleRework} className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 flex items-center justify-center gap-2">
                        <AlertCircle size={20} /> Request Rework
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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
                        Citizen has been notified for final verification. Once satisfied, the ticket will be CLOSED.
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
