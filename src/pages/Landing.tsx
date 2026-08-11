import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { 
  Sparkles, Play, MapPin, Scale, Trash2, Droplet, 
  ClipboardList, Clock, Bell, ShieldCheck, Star, 
  User, UserPlus, Megaphone, FileText, CheckCircle2, Settings, BarChart3
} from "lucide-react"

export function Landing() {
  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm h-[80px] px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            {/* Logo Icon Mock */}
            <div className="relative flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-full">
               <BarChart3 className="text-emerald-600 w-6 h-6" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-slate-800 leading-none">CIVORA</span>
            <span className="text-[10px] font-medium text-slate-500">Building Smarter Cities, Together.</span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
          <div className="relative">
            <Link to="/" className="text-[15px] font-semibold text-emerald-600 transition-colors">Home</Link>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-emerald-600 rounded-full"></div>
          </div>
          <Link to="/services" className="text-[15px] font-semibold text-slate-700 hover:text-emerald-600 transition-colors">Services</Link>
          <Link to="/track-complaint" className="text-[15px] font-semibold text-slate-700 hover:text-emerald-600 transition-colors">Track Complaint</Link>
          <Link to="/about" className="text-[15px] font-semibold text-slate-700 hover:text-emerald-600 transition-colors">About Us</Link>
          <Link to="/contact" className="text-[15px] font-semibold text-slate-700 hover:text-emerald-600 transition-colors">Contact</Link>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <Link to="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-emerald-600 text-emerald-600 font-semibold text-sm hover:bg-emerald-50 transition-colors">
            <User size={18} />
            Login
          </Link>
          <Link to="/register" className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm">
            <UserPlus size={18} />
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-[80px] min-h-[90vh] flex items-center bg-white">
        {/* Right side background image overlay */}
        <div className="absolute top-0 right-0 w-[60%] h-full z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10 w-[40%]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-full"></div>
          <img src="/city_bg.png" alt="City Background" className="w-full h-full object-cover object-right" />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center pt-12 pb-32">
          
          {/* Left Content */}
          <div className="w-full lg:w-[50%] flex flex-col items-start space-y-7">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm">
              <Sparkles size={16} className="text-emerald-500" />
              AI-Powered Civic Management
            </div>

            <h1 className="text-[56px] lg:text-[72px] font-bold text-slate-900 leading-[1.1] tracking-tight">
              Building Smarter Cities,<br />
              <span className="text-emerald-600">Together.</span>
            </h1>

            <p className="text-lg text-slate-500 max-w-[500px] leading-relaxed font-medium">
              Civora empowers citizens to report issues, track real-time progress, and contribute to cleaner, safer, and smarter communities.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link to="/raise-complaint" className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-emerald-600 text-white font-semibold text-base hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 w-full sm:w-auto">
                <FileText size={20} />
                Raise a Complaint
              </Link>
              <Link to="/how-it-works" className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-base hover:bg-slate-50 transition-colors w-full sm:w-auto bg-white">
                <Play size={20} className="text-emerald-600" />
                See How It Works
              </Link>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 pt-8">
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-emerald-600">
                  <div className="p-1.5 bg-emerald-50 rounded-md">
                     <ClipboardList size={16} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">12,458+</div>
                <div className="text-[13px] font-medium text-slate-500">Complaints Resolved</div>
              </div>

              <div className="w-[1px] h-12 bg-slate-200"></div>

              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-emerald-600">
                  <div className="p-1.5 bg-emerald-50 rounded-md">
                     <User size={16} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">8,932+</div>
                <div className="text-[13px] font-medium text-slate-500">Active Citizens</div>
              </div>

              <div className="w-[1px] h-12 bg-slate-200"></div>

              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-emerald-600">
                  <div className="p-1.5 bg-emerald-50 rounded-md">
                     <Settings size={16} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">24+</div>
                <div className="text-[13px] font-medium text-slate-500">Departments</div>
              </div>
              
              <div className="w-[1px] h-12 bg-slate-200"></div>

              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-emerald-600">
                  <div className="p-1.5 bg-emerald-50 rounded-md">
                     <ShieldCheck size={16} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">98.6%</div>
                <div className="text-[13px] font-medium text-slate-500">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Right Content - Floating Cards */}
          <div className="w-full lg:w-[50%] h-[600px] relative mt-16 lg:mt-0 hidden lg:block">
            
            {/* Dotted Line Connection (simplified via SVG) */}
            <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}>
               <path d="M 280 150 Q 350 250 200 320 T 260 480" fill="transparent" stroke="#10b981" strokeWidth="2" strokeDasharray="6 6" className="opacity-60" />
               <path d="M 280 150 L 500 100" fill="transparent" stroke="#10b981" strokeWidth="2" strokeDasharray="6 6" className="opacity-60" />
            </svg>

            {/* Location Pin 1 */}
            <div className="absolute top-[80px] right-[100px] z-10 flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40 text-white">
               <MapPin size={20} />
            </div>

            {/* Location Pin 2 */}
            <div className="absolute top-[350px] right-[280px] z-10 flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full shadow-lg shadow-blue-500/40 text-white border-2 border-white">
            </div>

            {/* Card 1 */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-[120px] left-[150px] z-20 bg-white rounded-xl shadow-xl shadow-slate-200/50 p-4 pr-12 flex items-center gap-4 border border-slate-100"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Scale size={24} />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-slate-800">Street Light Not Working</h4>
                <div className="flex items-center text-[12px] text-slate-500 mt-1 gap-1">
                  <MapPin size={12} /> Gondal Road, Rajkot
                </div>
                <div className="text-[12px] font-bold text-amber-500 mt-1">In Progress</div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute top-[280px] left-[50px] z-20 bg-white rounded-xl shadow-xl shadow-slate-200/50 p-4 pr-12 flex items-center gap-4 border border-slate-100"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-slate-800">Garbage Overflow</h4>
                <div className="flex items-center text-[12px] text-slate-500 mt-1 gap-1">
                  <MapPin size={12} /> Madhapar, Rajkot
                </div>
                <div className="text-[12px] font-bold text-emerald-500 mt-1">Completed</div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 2 }}
              className="absolute top-[420px] left-[100px] z-20 bg-white rounded-xl shadow-xl shadow-slate-200/50 p-4 pr-12 flex items-center gap-4 border border-slate-100"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <Droplet size={24} />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-slate-800">Water Leakage</h4>
                <div className="flex items-center text-[12px] text-slate-500 mt-1 gap-1">
                  <MapPin size={12} /> Yagnik Road, Rajkot
                </div>
                <div className="text-[12px] font-bold text-blue-500 mt-1">Assigned</div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Floating Features Bar */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[95%] max-w-[1400px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 z-30 translate-y-1/2 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="flex flex-row items-center justify-between divide-x divide-slate-100 min-w-[1000px] lg:min-w-full p-4 lg:p-6">
              
              <div className="flex items-start gap-4 px-4 lg:px-6 py-2 w-full">
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 shrink-0">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900 whitespace-nowrap">Easy Reporting</h4>
                  <p className="text-[13px] text-slate-500 leading-snug mt-1">Report issues in just a few taps.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 px-4 lg:px-6 py-2 w-full">
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900 whitespace-nowrap">Live Tracking</h4>
                  <p className="text-[13px] text-slate-500 leading-snug mt-1">Track real-time status of your complaint.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 px-4 lg:px-6 py-2 w-full">
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 shrink-0">
                  <Bell size={24} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900 whitespace-nowrap">Instant Updates</h4>
                  <p className="text-[13px] text-slate-500 leading-snug mt-1">Get notified at every step.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 px-4 lg:px-6 py-2 w-full">
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900 whitespace-nowrap">Transparency</h4>
                  <p className="text-[13px] text-slate-500 leading-snug mt-1">Open and transparent system for everyone.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 px-4 lg:px-6 py-2 w-full">
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 shrink-0">
                  <Star size={24} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900 whitespace-nowrap">Better Community</h4>
                  <p className="text-[13px] text-slate-500 leading-snug mt-1">Together we build better tomorrow.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="pt-40 pb-24 bg-[#fafbfc] px-6 lg:px-12 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="flex flex-col items-center text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm">
              <Settings size={14} className="text-emerald-500" />
              Simple Process
            </div>
            <h2 className="text-4xl font-bold text-slate-900">
              How <span className="text-emerald-600">Civora</span> Works
            </h2>
            <p className="text-slate-500 text-base max-w-md">
              A simple 4-step process to make your city better
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-full flex justify-between items-start mb-6">
                <span className="text-xl font-bold text-emerald-600 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">1</span>
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ClipboardList size={28} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Report Issue</h3>
              <p className="text-sm text-slate-500">Capture a photo and submit the details of the civic issue through our easy-to-use app.</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-full flex justify-between items-start mb-6">
                <span className="text-xl font-bold text-emerald-600 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">2</span>
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <MapPin size={28} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Auto-Locate</h3>
              <p className="text-sm text-slate-500">Our system automatically tags the exact location to route the complaint to the right department.</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-full flex justify-between items-start mb-6">
                <span className="text-xl font-bold text-emerald-600 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">3</span>
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Settings size={28} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Resolution</h3>
              <p className="text-sm text-slate-500">City officials review the issue and assign workers to fix the problem promptly.</p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-full flex justify-between items-start mb-6">
                <span className="text-xl font-bold text-emerald-600 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">4</span>
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={28} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Completion</h3>
              <p className="text-sm text-slate-500">Receive a notification with the 'after' photo once the issue is successfully resolved.</p>
            </div>

          </div>

        </div>
      </section>

    </div>
  )
}
