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
    // If already logged in, redirect to dashboard
    if (admin) {
      navigate("/", { replace: true });
    }
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
    <div className="min-h-screen bg-[#0f0f1a] text-white flex items-center justify-center p-4">
      {/* Background blur decorative element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#e94560]/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md glass rounded-2xl border border-white/5 p-8 relative z-10 shadow-2xl">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-3.5 rounded-full bg-[#e94560]/10 border border-[#e94560]/20 text-[#e94560] mb-2">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="font-playfair text-3xl font-bold tracking-widest text-[#e94560]">AURENZA</h2>
          <p className="text-text-secondary text-xs uppercase tracking-wider">Admin Console Sign In</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl mb-6 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aurenzashop.in"
              className="w-full bg-[#16213e]/40 border border-white/5 text-sm p-3.5 rounded-xl focus:outline-none focus:border-[#e94560]/40 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#16213e]/40 border border-white/5 text-sm p-3.5 rounded-xl focus:outline-none focus:border-[#e94560]/40 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#e94560] to-red-500 hover:opacity-95 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-[#e94560]/15 cursor-pointer mt-4 h-12 text-sm"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
