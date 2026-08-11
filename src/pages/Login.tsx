import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { User, Lock, Globe, ChevronDown, ShieldCheck, Users, HardHat, Mail, EyeOff, Eye, ArrowRight, Sprout } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import workerImg from "../assets/worker.png"

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4CA794] to-[#2B6A5C] flex items-center justify-center text-white font-bold text-2xl leading-none">
      C
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-slate-800 leading-none">Civora</span>
      <span className="text-[11px] text-slate-500 mt-0.5">Smart City, Better Tomorrow</span>
    </div>
  </div>
)

type Role = 'Citizen' | 'Admin' | 'Supervisor' | 'Worker';

export function Login() {
  const { register, handleSubmit } = useForm()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<Role>('Citizen')
  const [showPassword, setShowPassword] = useState(false)

  const roles: { id: Role; icon: any; label: string }[] = [
    { id: 'Citizen', icon: User, label: 'Citizen' },
    { id: 'Admin', icon: ShieldCheck, label: 'Admin' },
    { id: 'Supervisor', icon: Users, label: 'Supervisor' },
    { id: 'Worker', icon: HardHat, label: 'Worker' },
  ]

  const onSubmit = (data: any) => {
    // Simulating backend authentication returning a JWT and User Role
    let role: 'admin' | 'citizen' | 'supervisor' | 'worker' = selectedRole.toLowerCase() as any;
    const email = data.loginId.toLowerCase();
    
    // Explicit credential check as requested
    const tempUsers = JSON.parse(localStorage.getItem('temp_users') || '[]');
    const matchedTempUser = tempUsers.find((u: any) => u.email === email && u.password === data.password);

    if (matchedTempUser) {
      role = matchedTempUser.role;
    } else if (email === 'admin' && data.password === 'admin123') {
      role = 'admin';
    } else if (email.includes('admin')) {
      role = 'admin';
    } else if (email.includes('supervisor')) {
      role = 'supervisor';
    } else if (email.includes('worker')) {
      role = 'worker';
    }

    const token = `jwt_token_${Math.random().toString(36).substring(7)}`;
    login(token, { name: email.split('@')[0] || 'User', role });

    // Role-based routing
    if (role === 'admin') navigate("/admin/dashboard");
    else if (role === 'supervisor') navigate("/supervisor/dashboard");
    else if (role === 'worker') navigate("/worker/dashboard");
    else navigate("/citizen/dashboard");
  }

  return (
    <div className="min-h-screen w-full bg-[#f4f7f6] flex items-center justify-center p-4 sm:p-6 font-sans">
      
      <div className="w-full max-w-[1150px] bg-white rounded-[24px] md:rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[580px] h-auto md:h-[90vh] md:max-h-[680px]">
        
        {/* Left Panel */}
        <div className="hidden md:flex md:w-[45%] lg:w-[45%] relative flex-col p-8 lg:p-10 bg-[#EAF4F4] overflow-hidden">
          
          <div className="relative z-10 flex flex-col h-full">
            <Logo />
            
            <div className="mt-8 lg:mt-12">
              <h1 className="text-3xl lg:text-[40px] font-extrabold text-[#1F2937] leading-[1.15] tracking-tight">
                Together, <br />
                Let's Build a <br />
                <span className="text-[#4CA794]">Better City</span>
              </h1>
              <p className="mt-5 text-[#4B5563] text-[15px] max-w-[90%] leading-relaxed font-medium">
                Civora empowers citizens and authorities to work together for cleaner, smarter and more connected cities.
              </p>
            </div>

            <div className="flex-1 relative mt-6 lg:mt-8 flex items-end justify-center">
              <img 
                src={workerImg} 
                alt="City Worker" 
                className="w-[90%] max-w-[280px] lg:max-w-[300px] max-h-[300px] lg:max-h-[320px] object-contain relative z-10"
              />
              {/* Optional shadow or ground effect */}
              <div className="absolute bottom-0 w-[70%] h-6 bg-black/5 rounded-[100%] blur-md"></div>
            </div>
            
            <div className="relative z-20 flex justify-center mt-6">
              <div className="bg-white/95 backdrop-blur-sm px-5 py-3 rounded-full flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white">
                <div className="bg-[#EAF4F4] p-1.5 rounded-full">
                  <Sprout className="w-5 h-5 text-[#4CA794]" />
                </div>
                <span className="font-semibold text-[13px] text-[#1F2937]">Small Actions, Big Impact</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col p-6 md:p-8 lg:p-12 relative z-10 bg-white overflow-y-auto">
          {/* Subtle curved shape overlaying the left panel */}
          <div className="absolute top-0 bottom-0 -left-[40px] w-[40px] bg-white hidden md:block" style={{ clipPath: 'ellipse(100% 50% at 100% 50%)' }}></div>
          
          {/* Top EN selector */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20">
            <button className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 bg-white shadow-sm">
              <Globe className="w-4 h-4" />
              EN
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#1F2937] mb-2 tracking-tight">Welcome Back!</h2>
              <p className="text-gray-500 font-medium">Login to continue to <span className="text-[#4CA794]">Civora</span></p>
            </div>

            {/* Role Tabs */}
            <div className="flex p-1.5 bg-[#F8FAFC] border border-gray-100 rounded-[20px] mb-8 shadow-sm">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl gap-1.5 transition-all duration-300 ${
                    selectedRole === r.id 
                      ? 'bg-[#4CA794] text-white shadow-md transform scale-[1.02]' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                  }`}
                >
                  <r.icon className="w-[18px] h-[18px]" strokeWidth={selectedRole === r.id ? 2.5 : 2} />
                  <span className="text-[11px] font-bold tracking-wide">{r.label}</span>
                </button>
              ))}
            </div>

            <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#4CA794] transition-colors" />
                  </div>
                  <input
                    type="text"
                    {...register("loginId", { required: true })}
                    className="w-full h-[52px] pl-12 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4CA794] focus:ring-1 focus:ring-[#4CA794] transition-all text-[15px]"
                    placeholder="Email / Mobile Number"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#4CA794] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", { required: true })}
                    className="w-full h-[52px] pl-12 pr-12 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4CA794] focus:ring-1 focus:ring-[#4CA794] transition-all text-[15px]"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 pb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="peer appearance-none w-4 h-4 rounded border border-gray-300 checked:bg-[#4CA794] checked:border-[#4CA794] focus:outline-none focus:ring-2 focus:ring-[#4CA794]/20 transition-all cursor-pointer"
                    />
                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5.5L6 10.5L16 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-gray-600 group-hover:text-gray-800 transition-colors">Remember Me</span>
                </label>
                <Link to="/forgot-password" className="text-[13px] font-semibold text-[#4CA794] hover:text-[#3A8B77] transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <button
                form="login-form"
                type="submit"
                className="w-full h-[52px] rounded-xl bg-[#4CA794] text-white font-semibold text-[15px] hover:bg-[#3A8B77] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(76,167,148,0.25)]"
              >
                Login
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <div className="flex items-center gap-4 my-7">
              <div className="h-px bg-gray-100 flex-1"></div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">or continue with</span>
              <div className="h-px bg-gray-100 flex-1"></div>
            </div>

            <div className="flex gap-4">
              <button type="button" className="flex-1 flex items-center justify-center h-[48px] rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all gap-2.5 shadow-sm bg-white">
                <GoogleIcon />
                <span className="text-[13px] font-bold text-gray-700">Google</span>
              </button>
            </div>

            <p className="text-center mt-8 text-[13.5px] text-gray-500 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#4CA794] font-bold hover:underline">
                Register Now
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
