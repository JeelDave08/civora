import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { 
  MoreHorizontal, X, 
  Car, Droplets, Zap, Trash2, Lightbulb, FileText,
  Mail, LockKeyhole
} from "lucide-react"
import workerImg from "../assets/worker.png"

export function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const navigate = useNavigate()

  const onSubmitEmail = (data: any) => {
    console.log(data)
    // Handle reset
  }

  return (
    <div className="min-h-screen w-full flex font-sans bg-white">
      
      {/* Left Side (45%) - Branding Panel */}
      <div className="hidden lg:flex w-[45%] h-screen sticky top-0 bg-gradient-to-br from-[#3E766D] to-[#2D5A52] flex-col items-center justify-between p-8 overflow-hidden z-20 shadow-[10px_0_30px_rgba(0,0,0,0.1)]">
        
        {/* Abstract shapes */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[60px]"></div>
          <div className="absolute -bottom-[10%] -right-[10%] w-[300px] h-[300px] bg-[#F5B32C]/5 rounded-full blur-[60px]"></div>
          
          {/* Subtle City Skyline */}
          <div className="absolute bottom-0 w-full h-24 opacity-10 flex items-end justify-center space-x-1 px-4">
            <div className="w-10 h-16 bg-white rounded-t-sm"></div>
            <div className="w-8 h-24 bg-white rounded-t-sm"></div>
            <div className="w-12 h-12 bg-white rounded-t-sm"></div>
            <div className="w-10 h-20 bg-white rounded-t-sm"></div>
            <div className="w-16 h-10 bg-white rounded-t-sm"></div>
            <div className="w-8 h-18 bg-white rounded-t-sm"></div>
            <div className="w-10 h-16 bg-white rounded-t-sm"></div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="w-full flex justify-between items-center z-10 px-2">
          <MoreHorizontal className="text-white/60" size={24} />
          <Link to="/">
            <X className="text-white/60 hover:text-white transition-colors cursor-pointer" size={20} />
          </Link>
        </div>

        {/* Center Content */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
          {/* Illustration Container */}
          <motion.div 
            animate={{ y: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="mb-6 relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-white/5 blur-xl rounded-full scale-110"></div>
            <div className="w-48 h-48 lg:w-56 lg:h-56 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center relative shadow-[0_0_30px_rgba(0,0,0,0.1)] overflow-hidden">
               <img 
                 src={workerImg} 
                 alt="Civic Worker" 
                 className="w-full h-full object-cover scale-[1.15]"
               />
            </div>
          </motion.div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#F5B32C] mb-1.5 tracking-tight leading-none drop-shadow-sm">
            Civora
          </h1>
          <p className="text-[#F5B32C]/90 text-sm font-medium tracking-wide">
            Where Every City Begins to Improve
          </p>


        </div>
      </div>

      {/* Right Side (55%) - Form Panel */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative z-10 min-h-screen bg-white">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="absolute top-6 left-0 w-full lg:hidden flex justify-between items-center px-6">
          <h1 className="text-xl font-bold text-[#3E766D] tracking-tight">Civora</h1>
          <Link to="/login">
            <X className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" size={20} />
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-[340px] flex flex-col items-center"
        >
          <div className="mb-6 p-4 bg-[#3E766D]/5 rounded-2xl border border-[#3E766D]/10">
            <LockKeyhole size={36} className="text-[#3E766D]" strokeWidth={1.5} />
          </div>

          <div className="mb-8 text-center w-full">
            <h2 className="text-[26px] leading-tight font-bold text-[#0F172A] tracking-tight mb-2">
              Forgot Password?
            </h2>
            <p className="text-slate-500 text-[13px] leading-relaxed max-w-[280px] mx-auto">
              No worries. We'll send password reset instructions to your email.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmitEmail)} className="w-full space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-[#3E766D] transition-colors" />
              </div>
              <input
                type="email"
                {...register("email", { required: true })}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3E766D] focus:ring-[3px] focus:ring-[#3E766D]/10 transition-all text-[14px] shadow-sm"
                placeholder="Email Address"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-[#3E766D] to-[#2D5A52] text-white font-semibold text-[14px] shadow-[0_4px_12px_rgba(62,118,109,0.2)] hover:shadow-[0_6px_16px_rgba(62,118,109,0.3)] hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200"
            >
              Reset Password
            </button>
          </form>

          <div className="mt-10 text-center w-full">
            <Link to="/login" className="text-[#3E766D] font-bold text-[13px] hover:underline transition-all inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
