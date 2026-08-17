import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Lock, Globe, ChevronDown, Mail, EyeOff, Eye, ArrowRight, User, ShieldCheck, Users, HardHat, Leaf, BarChart3, Smile } from "lucide-react"
import { useState } from "react"
import { signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "../lib/firebase"
import { useAuth } from "../context/AuthContext"
import { useEffect } from "react"

const heroImage = "/assets/civora-smart-city-worker.png";

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
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1E9D74] to-[#147B5A] flex items-center justify-center text-white relative shadow-lg">
      <Leaf className="w-7 h-7 absolute top-2 left-2 opacity-40" />
      <span className="font-bold text-3xl relative z-10 font-sans tracking-tight">C</span>
    </div>
    <div className="flex flex-col">
      <div className="flex text-[36px] font-bold leading-none tracking-wide">
        <span className="text-white">CIVO</span>
        <span className="text-[#1E9D74]">RA</span>
      </div>
      <span className="text-[10px] text-white/80 tracking-[0.22em] font-medium mt-1 uppercase">Smart City. Better Tomorrow.</span>
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
  const [isLoading, setIsLoading] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('English (IN)')
  const [errorMsg, setErrorMsg] = useState('')

  const languageMapping: Record<string, string> = {
    'العربية': 'ar', 'Čeština': 'cs', 'Dansk': 'da', 'Nederlands': 'nl', 
    'English (IN)': 'en', 'Français': 'fr', 'Deutsch': 'de', 'Ελληνικά': 'el', 
    'Magyar': 'hu', 'Italiano': 'it', '日本語': 'ja', '한국어 (KP)': 'ko', 
    'Norsk bokmål': 'no', 'română': 'ro', 'Svenska': 'sv'
  }
  const languages = Object.keys(languageMapping)

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )googtrans=([^;]+)'))
    if (match) {
      const code = match[2].split('/')[2]
      if (code) {
        const name = Object.keys(languageMapping).find(k => languageMapping[k] === code)
        if (name) setSelectedLanguage(name)
      }
    }
  }, [])

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang)
    setIsLanguageOpen(false)
    const code = languageMapping[lang]
    if (code === 'en') {
      // To reset back to English, clear the cookie
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/;`
    } else {
      document.cookie = `googtrans=/en/${code}; path=/`
      document.cookie = `googtrans=/en/${code}; domain=.${window.location.hostname}; path=/`
    }
    window.location.reload()
  }

  const roles: { id: Role; icon: any; label: string }[] = [
    { id: 'Citizen', icon: User, label: 'Citizen' },
    { id: 'Admin', icon: ShieldCheck, label: 'Admin' },
    { id: 'Supervisor', icon: Users, label: 'Supervisor' },
    { id: 'Worker', icon: HardHat, label: 'Worker' },
  ]

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const email = data.loginId.toLowerCase().trim();
      const isAdminLogin = selectedRole === 'Admin';

      // Client-side validation for admin email domain
      if (isAdminLogin && !email.endsWith('@admin.civora.com')) {
        setErrorMsg('Admin email must end with @admin.civora.com');
        setIsLoading(false);
        return;
      }

      // Use admin-specific endpoint when Admin role is selected
      const endpoint = isAdminLogin
        ? 'http://localhost:5000/api/admin-auth/login'
        : 'http://localhost:5000/api/auth/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loginId: email,
          password: data.password
        })
      });

      const result = await response.json();

      if (response.ok) {
        login(result.token, result.user);
        
        const role = result.user.role;
        if (role === 'admin') navigate("/admin/dashboard");
        else if (role === 'supervisor') navigate("/supervisor/dashboard");
        else if (role === 'worker') navigate("/worker/dashboard");
        else navigate("/citizen/dashboard");
      } else {
        setErrorMsg(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMsg('Connection error. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="min-h-screen w-full flex font-sans bg-[#F4F7FC] overflow-hidden">
      
      {/* Left Panel - Image Area */}
      <div className="hidden lg:flex w-[51.2%] flex-col bg-[#071318] hero-visual">
        <style>{`
          .hero-visual {
              position: relative;
              overflow: hidden;
          }
          .hero-image {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              object-position: center center;
              z-index: 0;
              animation: heroZoom 12s ease-in-out infinite alternate;
          }
          .hero-overlay {
              position: absolute;
              inset: 0;
              z-index: 1;
              pointer-events: none;
          }
          .hero-content {
              position: relative;
              z-index: 2;
          }
          @keyframes heroZoom {
              from {
                  transform: scale(1);
              }
              to {
                  transform: scale(1.05);
              }
          }
        `}</style>

        {/* Background Image */}
        <img 
          src={heroImage} 
          alt="Smart City Environment" 
          className="hero-image opacity-85"
        />
        
        {/* Dark Teal Gradient Overlays */}
        <div className="hero-overlay bg-gradient-to-r from-[#071318]/90 via-[#071318]/40 to-transparent"></div>
        <div className="hero-overlay bg-gradient-to-br from-[#0A1F1C]/60 to-transparent mix-blend-multiply"></div>
        
        {/* Left Content */}
        <div className="hero-content flex flex-col h-full p-12 xl:p-16">
          <Logo />
          
          <div className="w-10 h-1 bg-[#1E9D74] mt-10 mb-8 rounded-full"></div>
          
          <div className="mb-12">
            <h1 className="text-[48px] xl:text-[54px] font-bold text-white leading-[1.15] tracking-tight">
              Empowering Cities.<br />
              <span className="text-[#1E9D74]">Improving</span> Lives.
            </h1>
            <p className="mt-6 text-white/80 text-[15px] max-w-[380px] leading-relaxed font-light">
              Report issues, track progress, and make<br />your city cleaner, safer, and smarter.
            </p>
          </div>

          {/* Floating Badges exactly like the mockup */}
          <div className="absolute top-[38%] left-[20%] flex flex-col items-center gap-1.5">
            <div className="w-[38px] h-[38px] rounded-full border border-[#1E9D74]/30 bg-[#1E9D74]/10 backdrop-blur-md flex items-center justify-center">
              <Leaf className="w-4 h-4 text-[#1E9D74]" />
            </div>
            <span className="text-[9px] text-white/90 font-medium tracking-wide">Clean Roads</span>
          </div>

          <div className="absolute top-[28%] right-[25%] flex flex-col items-center gap-1.5">
            <div className="w-[38px] h-[38px] rounded-full border border-[#1E9D74]/30 bg-[#1E9D74]/10 backdrop-blur-md flex items-center justify-center">
              <Leaf className="w-4 h-4 text-[#1E9D74]" />
            </div>
            <span className="text-[9px] text-white/90 font-medium tracking-wide">Better Services</span>
          </div>

          <div className="absolute top-[48%] right-[10%] flex flex-col items-center gap-1.5">
            <div className="w-[38px] h-[38px] rounded-full border border-[#1E9D74]/30 bg-[#1E9D74]/10 backdrop-blur-md flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-[#1E9D74]" />
            </div>
            <span className="text-[9px] text-white/90 font-medium tracking-wide">Smart Tracking</span>
          </div>

          <div className="absolute bottom-[35%] right-[15%] flex flex-col items-center gap-1.5">
            <div className="w-[38px] h-[38px] rounded-full border border-[#1E9D74]/30 bg-[#1E9D74]/10 backdrop-blur-md flex items-center justify-center">
              <Smile className="w-4 h-4 text-[#1E9D74]" />
            </div>
            <span className="text-[9px] text-white/90 font-medium tracking-wide">Happy Communities</span>
          </div>
          
          {/* Bottom Left Notification Card */}
          <div className="absolute bottom-12 left-12 bg-[#0A1F1C]/80 backdrop-blur-xl border border-[#1E9D74]/20 rounded-2xl p-5 flex items-center gap-4 w-[280px] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
             <div className="w-9 h-9 rounded-full border border-[#1E9D74]/40 text-[#1E9D74] flex items-center justify-center shrink-0">
                <Leaf className="w-[18px] h-[18px]" strokeWidth={2.5} />
             </div>
             <p className="text-white/90 text-[13px] font-medium leading-[1.4]">
                Every small action<br />
                today creates a<br />
                <span className="text-[#1E9D74] font-bold">better tomorrow.</span>
             </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Authentication */}
      <div className="w-full lg:w-[48.8%] bg-transparent relative flex items-center justify-center">
        
        {/* Massive S-Curve Overlay reproducing the reference image exactly */}
        <div className="absolute inset-0 bg-[#F4F7FC] hidden lg:block" style={{ borderTopLeftRadius: '86px', borderBottomLeftRadius: '150px' }}>
            {/* The sweeping bottom cut */}
            <svg className="absolute bottom-0 left-0 w-[120px] h-[300px] -translate-x-[99%] text-[#F4F7FC] fill-current pointer-events-none" viewBox="0 0 100 300" preserveAspectRatio="none">
               <path d="M100 0 C 100 150, 0 150, 0 300 L 100 300 Z" />
            </svg>
        </div>

        {/* Mobile Background */}
        <div className="absolute inset-0 bg-[#F4F7FC] lg:hidden"></div>
        
        {/* Top EN selector */}
        <div className="absolute top-8 right-8 z-50">
          <div className="relative">
            <button 
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-2 border border-gray-200 px-3.5 py-1.5 rounded-full hover:bg-gray-50 transition-colors text-[13px] font-semibold text-[#1F2937] bg-white shadow-sm"
            >
              <Globe className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
              {selectedLanguage === 'English (IN)' ? 'EN' : selectedLanguage.substring(0, 2).toUpperCase()}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1">
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {languages.map((lang, index) => (
                    <button
                      key={index}
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full text-left px-4 py-2.5 text-[14px] hover:bg-blue-600 hover:text-white transition-colors ${
                        selectedLanguage === lang ? 'bg-blue-600 text-white' : 'text-blue-600'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* The White Card containing the form */}
        <div className="w-full max-w-[462px] bg-white rounded-[30px] p-8 sm:p-[30px] shadow-[0_8px_30px_rgba(30,45,70,0.05)] border border-white relative z-10 mx-6 lg:mx-auto">
          
          <div className="text-center mb-8">
            <h2 className="text-[30px] font-bold text-[#142532] mb-2 tracking-tight">
              Welcome <span className="text-[#1E9D74]">Back!</span>
            </h2>
            <p className="text-[#6B7280] font-medium text-[15px]">
              Sign in to continue to <span className="text-[#1E9D74]">Civora</span>
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex p-2 bg-[#F7F8FC] rounded-[20px] mb-7">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[18px] gap-1 transition-all duration-300 ${
                  selectedRole === r.id 
                    ? 'bg-[#1E9D74] text-white shadow-md shadow-[#1E9D74]/20' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <r.icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[12px] font-medium">{r.label}</span>
              </button>
            ))}
          </div>

          <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium px-4 py-3 rounded-[14px] flex items-center gap-2 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {errorMsg}
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-[18px] w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input
                type="text"
                {...register("loginId", { required: true })}
                className="w-full h-[56px] pl-[44px] pr-4 rounded-[16px] border border-gray-200 bg-white text-[#1F2937] placeholder-gray-400 focus:outline-none focus:border-[#1E9D74] focus:ring-1 focus:ring-[#1E9D74] transition-all text-[14px]"
                placeholder={selectedRole === 'Admin' ? 'admin@admin.civora.com' : 'Email or Mobile Number'}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-[18px] w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password", { required: true })}
                className="w-full h-[56px] pl-[44px] pr-12 rounded-[16px] border border-gray-200 bg-white text-[#1F2937] placeholder-gray-400 focus:outline-none focus:border-[#1E9D74] focus:ring-1 focus:ring-[#1E9D74] transition-all text-[14px]"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[18px] text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                {showPassword ? <Eye className="w-5 h-5" strokeWidth={1.5} /> : <EyeOff className="w-5 h-5" strokeWidth={1.5} />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 pb-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    className="peer appearance-none w-4 h-4 rounded-[4px] border border-gray-300 bg-white checked:bg-[#1E9D74] checked:border-[#1E9D74] focus:outline-none focus:ring-2 focus:ring-[#1E9D74]/20 transition-all cursor-pointer"
                  />
                  <svg className="absolute w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5.5L6 10.5L16 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-gray-600">Remember Me</span>
              </label>
              <Link to="/forgot-password" className="text-[13px] font-medium text-[#1E9D74] hover:text-[#168562] transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              form="login-form"
              type="submit"
              disabled={isLoading}
              className="relative w-full h-[56px] rounded-[16px] bg-[#1E9D74] text-white font-medium text-[15px] hover:bg-[#168562] active:scale-[0.99] transition-all flex items-center justify-center disabled:opacity-80 disabled:cursor-not-allowed group overflow-hidden"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <div className="absolute left-6">
                    <Lock className="w-[18px] h-[18px] text-white/90" strokeWidth={2} />
                  </div>
                  <span>Login to Civora</span>
                  <div className="absolute right-6">
                    <ArrowRight className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                  </div>
                </>
              )}
            </button>
          </form>

          {/* Hide Google login for Admin role */}
          {selectedRole !== 'Admin' && (
            <>
              <div className="flex items-center gap-4 my-8">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">OR CONTINUE WITH</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="flex gap-4 flex-col sm:flex-row">
                <button 
                  type="button" 
                  onClick={handleGoogleLogin}
                  className="flex-1 flex items-center justify-center h-[52px] rounded-[16px] border border-gray-200 hover:bg-gray-50 transition-all gap-2 bg-white text-[13px] font-semibold text-[#1F2937]"
                >
                  <GoogleIcon />
                  Google
                </button>
              </div>
            </>
          )}

          {selectedRole !== 'Admin' && (
            <p className="text-center mt-8 text-[13px] text-gray-500 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#1E9D74] font-semibold hover:text-[#168562] transition-colors ml-1">
                Register Now
              </Link>
            </p>
          )}
          {selectedRole === 'Admin' && (
            <p className="text-center mt-8 text-[12px] text-gray-400 font-medium">
              Admin accounts are managed internally. Contact your system administrator.
            </p>
          )}

        </div>
      </div>
    </div>
  )
}
