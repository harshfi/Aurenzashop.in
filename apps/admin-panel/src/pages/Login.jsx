import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, Loader2, ArrowRight } from "lucide-react";

export default function Login() {
  const { login, admin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (admin) navigate("/", { replace: true });
  }, [admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(email, password);
    if (res.success) {
      navigate("/", { replace: true });
    } else {
      setError(res.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,#dbeafe,transparent_35%),linear-gradient(to_bottom,#f8fafc,#ffffff)]">
      <div className="w-full max-w-md glass rounded-3xl p-8 relative z-10">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-3.5 rounded-full bg-indigo-100 text-indigo-700 mb-2">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-indigo-950">Aurenza Admin</h2>
          <p className="text-slate-500 text-xs uppercase tracking-[0.18em]">Sign in to manage store</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs py-3 px-4 rounded-xl mb-6 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@aurenzashop.in" className="w-full bg-white border border-slate-200 text-sm p-3.5 rounded-xl focus:outline-none focus:border-indigo-400" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white border border-slate-200 text-sm p-3.5 rounded-xl focus:outline-none focus:border-indigo-400" />
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all cursor-pointer mt-4 h-12 text-sm disabled:opacity-70">
            {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <><span>Sign In</span><ArrowRight className="h-4.5 w-4.5" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
