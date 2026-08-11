import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, MapPin, Navigation2, Camera, Map, CheckCircle2, AlertTriangle, ShieldAlert, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

type TaskState = 'assigned' | 'arrived' | 'before_uploaded' | 'in_progress' | 'issue_reported' | 'after_uploaded' | 'completed' | 'verification';

export function WorkerTaskDetail() {
  const { id } = useParams()
  
  const [taskState, setTaskState] = useState<TaskState>('assigned')
  const [showIssueModal, setShowIssueModal] = useState(false)

  const handleNavigate = () => {
    // Simulate navigation
    setTimeout(() => setTaskState('arrived'), 1000)
  }

  const handleBeforeUpload = () => {
    setTaskState('before_uploaded')
    setTimeout(() => setTaskState('in_progress'), 800)
  }

  const handleAfterUpload = () => {
    setTaskState('after_uploaded')
  }

  const handleSubmitCompletion = () => {
    setTaskState('completed')
    setTimeout(() => setTaskState('verification'), 1500)
  }

  const handleReportIssue = () => {
    setTaskState('issue_reported')
    setShowIssueModal(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 lg:p-10 max-w-4xl mx-auto font-sans pb-24"
    >
      <div className="flex items-center gap-4">
        <Link to="/worker/tasks" className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft size={20} className="text-slate-700" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Task #{id}</h1>
          <p className="text-slate-500 font-medium flex items-center gap-1.5 mt-0.5 text-sm">
            <MapPin size={14} className="text-[#4CC9B0]"/> Downtown Sector 4
          </p>
        </div>
      </div>

      <Card className="rounded-[32px] overflow-hidden border-none shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4CC9B0]/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
        <CardContent className="p-8">
          <div className="mb-6">
            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3 inline-block">Critical Priority</span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Water Main Leak Repair</h2>
            <p className="text-slate-600 font-medium leading-relaxed mt-2 text-sm">
              Citizen reported severe water leakage on the main street causing flooding. Immediate repair required to prevent road damage.
            </p>
          </div>

          <div className="flex flex-col gap-6 relative">
            {/* Step 1: Navigate */}
            <div className={`p-6 rounded-3xl border-2 transition-all ${taskState === 'assigned' ? 'border-[#4CC9B0] bg-[#4CC9B0]/5' : 'border-slate-100 bg-slate-50 opacity-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4CC9B0] text-sm">1</span> 
                  Navigate to Location
                </h3>
                {taskState !== 'assigned' && <CheckCircle2 className="text-emerald-500" />}
              </div>
              {taskState === 'assigned' && (
                <button onClick={handleNavigate} className="w-full h-12 mt-4 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                  <Navigation2 size={18} /> Start Navigation
                </button>
              )}
            </div>

            {/* Step 2: Before Image */}
            <div className={`p-6 rounded-3xl border-2 transition-all ${taskState === 'arrived' ? 'border-[#4CC9B0] bg-[#4CC9B0]/5' : 'border-slate-100 bg-slate-50 ' + (taskState === 'assigned' ? 'opacity-30 pointer-events-none' : taskState !== 'arrived' ? 'opacity-50' : '')}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4CC9B0] text-sm">2</span> 
                  Capture Before Image & GPS
                </h3>
                {['before_uploaded', 'in_progress', 'after_uploaded', 'completed', 'verification'].includes(taskState) && <CheckCircle2 className="text-emerald-500" />}
              </div>
              {taskState === 'arrived' && (
                <div onClick={handleBeforeUpload} className="mt-4 p-8 border-2 border-[#4CC9B0] border-dashed rounded-2xl bg-white hover:bg-[#4CC9B0]/5 transition-all cursor-pointer text-center">
                  <Camera className="mx-auto text-[#4CC9B0] mb-3" size={32} />
                  <p className="font-bold text-[#4CC9B0]">Upload Initial Evidence</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1"><Map size={12}/> GPS tagged automatically</p>
                </div>
              )}
            </div>

            {/* Step 3: Work In Progress / Actions */}
            <div className={`p-6 rounded-3xl border-2 transition-all ${['in_progress', 'issue_reported'].includes(taskState) ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50 ' + (['assigned', 'arrived', 'before_uploaded'].includes(taskState) ? 'opacity-30 pointer-events-none' : 'opacity-50')}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500 text-sm">3</span> 
                  Work In Progress
                </h3>
              </div>
              
              {taskState === 'in_progress' && (
                <div className="mt-4 flex gap-4">
                  <button onClick={() => setShowIssueModal(true)} className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 rounded-2xl font-bold hover:bg-rose-50 transition-colors">
                    <AlertTriangle size={18} /> Report Issue
                  </button>
                  <button onClick={() => setTaskState('after_uploaded')} className="flex-1 h-12 flex items-center justify-center gap-2 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                    Ready to Complete <ArrowLeft className="rotate-180" size={18} />
                  </button>
                </div>
              )}

              {taskState === 'issue_reported' && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 font-medium text-sm flex items-start gap-3">
                  <ShieldAlert className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-bold mb-1">Supervisor Notified</p>
                    <p className="opacity-90">Work is paused. Awaiting supervisor instructions regarding the reported material shortage.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: After Image & Completion */}
            <div className={`p-6 rounded-3xl border-2 transition-all ${taskState === 'after_uploaded' ? 'border-[#4CC9B0] bg-[#4CC9B0]/5' : 'border-slate-100 bg-slate-50 ' + (['completed', 'verification'].includes(taskState) ? 'opacity-50' : 'opacity-30 pointer-events-none')}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4CC9B0] text-sm">4</span> 
                  Completion & Evidence
                </h3>
                {['completed', 'verification'].includes(taskState) && <CheckCircle2 className="text-emerald-500" />}
              </div>
              
              {taskState === 'after_uploaded' && (
                <div className="mt-4 space-y-4">
                  <div className="p-6 border-2 border-slate-200 border-dashed rounded-2xl bg-white cursor-pointer text-center relative overflow-hidden group">
                    <Camera className="mx-auto text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" size={28} />
                    <p className="text-sm font-bold text-slate-600 group-hover:text-blue-500 transition-colors">Take After Photo</p>
                  </div>
                  
                  <div>
                    <textarea 
                      placeholder="Add completion remarks or notes for the supervisor..."
                      className="w-full h-24 p-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#4CC9B0] bg-white resize-none text-sm font-medium"
                    ></textarea>
                  </div>

                  <button onClick={handleSubmitCompletion} className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-[#4CC9B0] to-[#3bb59d] text-white rounded-2xl font-bold hover:shadow-[0_8px_25px_rgba(76,201,176,0.4)] hover:-translate-y-0.5 transition-all text-lg">
                    <Send size={20} /> Submit Work
                  </button>
                </div>
              )}
            </div>

            {/* Step 5: Verification status */}
            <AnimatePresence>
              {(taskState === 'completed' || taskState === 'verification') && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="p-6 rounded-3xl bg-purple-50 border border-purple-100 text-center">
                  <CheckCircle2 className="mx-auto text-purple-500 mb-2" size={32} />
                  <h3 className="font-bold text-purple-800 text-lg">Sent to Supervisor</h3>
                  <p className="text-sm text-purple-600/80 font-medium mt-1">
                    Your work has been submitted. Awaiting supervisor verification and approval.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </CardContent>
      </Card>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-[32px] border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-rose-50 border-b border-rose-100 pb-6 pt-8 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={28} />
              </div>
              <CardTitle className="text-xl font-bold text-rose-800">Report Problem</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                <select className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 bg-slate-50 font-medium text-sm">
                  <option value="">Select Issue Type...</option>
                  <option value="safety">Safety Hazard</option>
                  <option value="material">Material Shortage</option>
                  <option value="access">Cannot Access Location</option>
                </select>
                <textarea 
                  placeholder="Describe the issue in detail..."
                  className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 bg-slate-50 resize-none font-medium text-sm"
                ></textarea>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowIssueModal(false)} className="flex-1 h-12 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button onClick={handleReportIssue} className="flex-1 h-12 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20">Notify Supervisor</button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  )
}
