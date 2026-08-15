import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User, Lock, Mail, Building2, ShieldPlus, Lightbulb,
  Eye, EyeOff, CheckCircle2, ArrowRight, Check
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "../lib/firebase"
import smartCityRightImg from "../assets/smart_city_register_right.png"
import smartCitySuccessImg from "../assets/smart_city_success.png"

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D8C74] to-[#1F6B56] flex items-center justify-center text-white font-bold text-xl leading-none shadow-md">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-8"/><path d="M12 8l4-4"/><path d="M12 8L8 4"/><path d="M12 14l5-5"/><path d="M12 14l-5-5"/><circle cx="12" cy="8" r="4"/></svg>
    </div>
    <div className="flex flex-col">
      <span className="text-[20px] font-extrabold text-slate-800 leading-none tracking-tight">Civora</span>
      <span className="text-[9px] text-slate-500 mt-0.5 font-semibold uppercase tracking-wider">Smart City. Better Tomorrow.</span>
    </div>
  </div>
)

const InputField = ({ label, name, type = "text", isDone, registerProps, icon: Icon, placeholder, showEye, onEyeClick, isEyeOpen, onPaste }: any) => {
  return (
    <div className={`relative w-full rounded-[10px] border-[1.5px] transition-all duration-300 ${isDone ? 'border-[#2D8C74] bg-[#2D8C74]/[0.02]' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <div className="flex items-center min-h-[46px] px-3 py-1">
        <Icon className={`w-4 h-4 mr-3 shrink-0 ${isDone ? 'text-[#2D8C74]' : 'text-slate-400'}`} strokeWidth={2.5} />
        
        <div className="flex-1 flex flex-col justify-center overflow-hidden pt-0.5">
          <span className={`text-[9px] font-bold leading-tight mb-0.5 ${isDone ? 'text-[#2D8C74]' : 'text-slate-500'}`}>{label}</span>
          <input
            type={type}
            placeholder={placeholder}
            onPaste={onPaste}
            {...registerProps}
            className="w-full bg-transparent text-[13px] leading-tight text-slate-800 font-medium placeholder-slate-300 focus:outline-none pb-0.5"
          />
        </div>

        {showEye && (
          <button type="button" onClick={onEyeClick} className="ml-2 shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            {isEyeOpen ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {isDone && !showEye && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2 shrink-0 w-[16px] h-[16px] bg-[#2D8C74] rounded-full flex items-center justify-center">
            <Check size={10} strokeWidth={3} className="text-white" />
          </motion.div>
        )}
      </div>
    </div>
  )
}

export function Register() {
  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({ mode: "onChange" })
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  
  const fullNameValue = watch("fullName")
  const emailValue = watch("email")
  const cityValue = watch("city")
  const passwordValue = watch("password")
  const confirmPasswordValue = watch("confirmPassword")

  const isNameDone = !!fullNameValue && fullNameValue.length > 2
  const isEmailDone = !!emailValue && emailValue.includes('@') && emailValue.includes('.')
  const isCityDone = !!cityValue && cityValue.length > 2
  const isPasswordDone = !!passwordValue && passwordValue.length > 5
  const isConfirmDone = !!confirmPasswordValue && confirmPasswordValue === passwordValue && isPasswordDone

  const completedStepsCount = [isNameDone, isEmailDone, isCityDone, isPasswordDone, isConfirmDone].filter(Boolean).length

  const onSubmit = async (data: any) => {
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          city: data.city,
          password: data.password
        })
      });
      const result = await response.json();
      if (response.ok) {
        login(result.token, result.user);
        setIsSuccess(true);
      } else {
        setErrorMsg(result.message || "Registration failed");
        console.error("Registration failed:", result.message);
      }
    } catch (error) {
      setErrorMsg("Network error. Is the backend running?");
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const onContinueToDashboard = () => {
    navigate("/citizen/dashboard")
  }

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName,
          uid: user.uid
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        login(data.token, data.user);
        navigate("/citizen/dashboard");
      } else {
        console.error("Google login failed via backend:", data.message);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  }

  const steps = [
    { id: 1, label: "Full Name", isDone: isNameDone, icon: User, title: "Add Name", subtitle: "Citizen arrives" },
    { id: 2, label: "Email Address", isDone: isEmailDone, icon: Mail, title: "Add Email", subtitle: "Buildings light up" },
    { id: 3, label: "City", isDone: isCityDone, icon: Building2, title: "Add City", subtitle: "Nature appears" },
    { id: 4, label: "Password", isDone: isPasswordDone, icon: Lock, title: "Add Password", subtitle: "Streetlights on" },
    { id: 5, label: "Confirm Password", isDone: isConfirmDone, icon: ShieldPlus, title: "Confirm Password", subtitle: "City is active" }
  ]

  const getCityFilter = () => {
    switch(completedStepsCount) {
      case 0: return "grayscale(100%) brightness(40%) contrast(100%)"
      case 1: return "grayscale(70%) brightness(55%) contrast(105%)"
      case 2: return "grayscale(40%) brightness(70%) contrast(110%)"
      case 3: return "grayscale(20%) brightness(85%) contrast(115%) sepia(10%) hue-rotate(5deg)"
      case 4: return "grayscale(0%) brightness(100%) contrast(120%) sepia(20%) hue-rotate(10deg)"
      case 5: return "grayscale(0%) brightness(115%) contrast(125%) saturate(130%) drop-shadow(0 0 20px rgba(45,140,116,0.3))"
      default: return "grayscale(100%) brightness(40%)"
    }
  }

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.8 }}
        className="h-screen w-full relative overflow-hidden flex flex-col"
      >
        <img 
          src={smartCitySuccessImg} 
          alt="Smart City Success" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/20 to-transparent"></div>
        
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto mt-[-10vh]">
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.3, duration: 0.6 }}
            className="w-20 h-20 rounded-full bg-[#2D8C74] flex items-center justify-center shadow-[0_0_40px_rgba(45,140,116,0.4)] mb-8"
          >
            <Check strokeWidth={3} className="text-white w-10 h-10" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-[42px] font-extrabold text-[#0F172A] mb-2 tracking-tight flex items-center gap-3"
          >
            Welcome to Civora <span className="text-[#2D8C74]">🌱</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-[22px] text-slate-700 font-medium mb-8"
          >
            Together, let's build a better city.
          </motion.p>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-[15px] text-slate-500 font-medium leading-relaxed max-w-md mx-auto mb-10"
          >
            Your account has been created successfully.<br/>
            Let's make our city smarter, cleaner and stronger - together.
          </motion.p>
          
          <motion.button 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            onClick={onContinueToDashboard}
            className="h-12 px-8 rounded-full bg-[#2D8C74] text-white font-bold text-[15px] hover:bg-[#23705C] active:scale-[0.98] transition-all flex items-center gap-3 shadow-[0_10px_20px_rgba(45,140,116,0.3)]"
          >
            Continue to Dashboard
            <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row font-sans bg-[#F8FAFC]">
      
      {/* Left Side - Form */}
      <div className="w-full lg:w-[45%] flex flex-col p-5 sm:p-8 relative z-20 overflow-y-auto min-h-screen lg:min-h-0">
        <div className="shrink-0">
          <Logo />
        </div>
        
        <div className="flex-1 flex items-center justify-center w-full mt-6 lg:mt-0 py-6 lg:py-0">
          <div className="w-full max-w-[420px] mx-auto">
            
            {/* Form Card */}
            <div className="w-full bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_15px_35px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center">
              
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-[20px] font-bold text-[#0F172A] mb-2 tracking-tight">Create Your Account</h2>
                  <p className="text-[12px] text-slate-500 font-medium leading-relaxed max-w-[220px]">
                    Join thousands of citizens building a better city together.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full shrink-0">
                  <span className="text-[11px] font-bold text-[#2D8C74]">{completedStepsCount}</span>
                  <span className="text-[11px] font-bold text-slate-400"> / 5</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                
                <InputField 
                  label="Full Name" 
                  type="text" 
                  icon={User} 
                  placeholder="Enter your full name"
                  isDone={isNameDone}
                  registerProps={register("fullName", { required: true, minLength: 3 })}
                />

                <InputField 
                  label="Email Address" 
                  type="email" 
                  icon={Mail} 
                  placeholder="Enter your email address"
                  isDone={isEmailDone}
                  registerProps={register("email", { required: true, pattern: /^\S+@\S+\.\S+$/ })}
                />

                <InputField 
                  label="City" 
                  type="text" 
                  icon={Building2} 
                  placeholder="Enter your city"
                  isDone={isCityDone}
                  registerProps={register("city", { required: true, minLength: 3 })}
                />

                <div>
                  <InputField 
                    label="Password" 
                    type={showPassword ? "text" : "password"}
                    icon={Lock} 
                    placeholder="Password"
                    isDone={isPasswordDone}
                    showEye={true}
                    isEyeOpen={showPassword}
                    onEyeClick={() => setShowPassword(!showPassword)}
                    registerProps={register("password", { required: true, minLength: 6 })}
                  />
                  <div className="flex items-center justify-between mt-2 pt-1 px-1">
                    <div className="flex gap-1.5 flex-1 mr-4">
                      <div className={`h-[3px] flex-1 rounded-full ${passwordValue?.length > 0 ? 'bg-[#E15241]' : 'bg-slate-100'}`}></div>
                      <div className={`h-[3px] flex-1 rounded-full ${passwordValue?.length > 4 ? 'bg-[#F59E0B]' : 'bg-slate-100'}`}></div>
                      <div className={`h-[3px] flex-1 rounded-full ${passwordValue?.length > 7 ? 'bg-[#2D8C74]' : 'bg-slate-100'}`}></div>
                      <div className={`h-[3px] flex-1 rounded-full ${passwordValue?.length > 10 ? 'bg-[#2D8C74]' : 'bg-slate-100'}`}></div>
                    </div>
                    <span className="text-[10px] font-bold text-[#2D8C74]">
                      {passwordValue?.length > 10 ? 'Strong' : passwordValue?.length > 4 ? 'Fair' : 'Weak'}
                    </span>
                  </div>
                </div>

                <InputField 
                  label="Confirm Password" 
                  type={showConfirmPassword ? "text" : "password"}
                  icon={Lock} 
                  placeholder="Confirm Password"
                  isDone={isConfirmDone}
                  showEye={true}
                  isEyeOpen={showConfirmPassword}
                  onEyeClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  registerProps={register("confirmPassword", { 
                    required: true,
                    validate: value => value === passwordValue || "Passwords do not match"
                  })}
                  onPaste={(e: any) => {
                    e.preventDefault();
                    setErrorMsg("Pasting passwords is not allowed.");
                  }}
                />

                {errorMsg && (
                  <div className="text-center p-2 rounded-lg bg-rose-50 border border-rose-100">
                    <span className="text-xs font-semibold text-rose-600">{errorMsg}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={completedStepsCount < 5 || isSubmitting}
                  className={`w-full h-[46px] mt-1 rounded-[10px] font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${
                    (completedStepsCount === 5 && !isSubmitting)
                      ? 'bg-[#2D8C74] text-white hover:bg-[#23705C] shadow-[0_6px_15px_rgba(45,140,116,0.25)] active:scale-[0.98] cursor-pointer' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" strokeWidth={3} />
                </button>
              </form>

              <div className="flex items-center gap-3 my-4">
                <div className="h-px bg-slate-100 flex-1"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">or continue with</span>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={handleGoogleLogin}
                  className="flex-1 flex items-center justify-center h-[42px] rounded-[10px] border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all gap-2 shadow-sm bg-white"
                >
                  <GoogleIcon />
                  <span className="text-[12px] font-bold text-slate-700">Google</span>
                </button>
              </div>

              <p className="text-center mt-5 text-[11px] text-slate-500 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-[#2D8C74] font-bold hover:underline">
                  Login
                </Link>
              </p>

            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Animated City Panel */}
      <div className="hidden lg:flex w-[55%] h-full p-4 lg:p-6 relative z-10 sticky top-0">
        <div className="w-full h-full relative rounded-[24px] lg:rounded-[32px] overflow-hidden shadow-2xl bg-[#0B1B3D]">
          
          {/* Base Background (Always dark) */}
          <div className="absolute inset-0 bg-[#0B1B3D] z-0"></div>

          {/* The City Image with dynamic CSS filters */}
          <div className="absolute inset-0 z-10 transition-all duration-1000 ease-in-out" style={{ filter: getCityFilter() }}>
            <img 
              src={smartCityRightImg} 
              alt="Smart City Dynamic" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 z-20"></div>
          
          {/* Top Horizontal Timeline Overlay */}
          <div className="absolute top-0 left-0 w-full pt-12 pb-8 px-10 z-30 flex flex-col items-center">
            <h2 className="text-[32px] font-extrabold text-white mb-10 tracking-tight drop-shadow-md">
              Watch your city come alive ✨
            </h2>
            
            <div className="w-full max-w-[550px] flex items-start justify-between relative">
              {steps.map((step, index) => {
                const isLast = index === steps.length - 1;
                const Icon = step.icon;
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center group w-1/5">
                    <motion.div 
                      initial={false}
                      animate={{
                        scale: step.isDone ? 1.1 : 1,
                        borderColor: step.isDone ? '#2D8C74' : 'rgba(255,255,255,0.4)',
                        backgroundColor: step.isDone ? '#ffffff' : 'rgba(255,255,255,0.1)',
                      }}
                      className="w-12 h-12 rounded-full flex items-center justify-center border-[2px] transition-colors duration-300 shadow-lg relative z-20 backdrop-blur-sm"
                    >
                      <Icon size={20} className={step.isDone ? "text-[#2D8C74]" : "text-white"} strokeWidth={2.5} />
                      {step.isDone && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 size={16} className="text-[#2D8C74] fill-white" />
                        </div>
                      )}
                    </motion.div>
                    
                    <div className="mt-4 text-center w-full">
                      <p className={`text-[12px] font-bold ${step.isDone ? 'text-white' : 'text-white/80'} drop-shadow-md`}>
                        {step.title}
                      </p>
                      <p className="text-[10px] text-white/60 font-semibold mt-1">
                        {step.subtitle}
                      </p>
                    </div>
                    
                    {!isLast && (
                      <div className="absolute top-[24px] left-[50%] w-full h-[2px] z-10">
                        <div className={`w-full h-full border-t-[2.5px] border-dashed transition-colors duration-500 ${step.isDone ? 'border-[#2D8C74]' : 'border-white/30'} mt-[-1px]`} style={{ width: 'calc(100% - 20px)', marginLeft: '20px' }}></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="absolute bottom-10 right-10 bg-[#0F3A30]/80 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/30 shadow-2xl max-w-[220px] z-30">
             <p className="text-white text-xl font-bold leading-[1.3]">
               Together,<br/>we create<br/>better cities.
             </p>
          </div>
        </div>
      </div>

    </div>
  )
}
