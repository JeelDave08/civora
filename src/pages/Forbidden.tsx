import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function Forbidden() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center border border-slate-100">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="text-rose-500 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </p>
        <Link 
          to="/login" 
          className="inline-flex items-center justify-center gap-2 w-full h-11 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
          Return to Login
        </Link>
      </div>
    </div>
  );
}
