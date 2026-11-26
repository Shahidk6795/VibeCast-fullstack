import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Disc3, Heart, ListMusic } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/logo.png";

const AuthPage = () => {
  const { isSignedIn, login, register, googleLogin } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from || "/";

  useEffect(() => {
    if (isSignedIn) {
      navigate(redirectTo, { replace: true });
    }
  }, [isSignedIn, navigate, redirectTo]);

  useEffect(() => {
    setError("");
    setPassword("");
    setShowPassword(false);
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError("Google sign-in did not return a credential");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden">
      {/* Left Brand Panel (Desktop) */}
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 relative bg-[#090909] border-r border-white/10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-600/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-96 h-96 bg-[#1db954]/20 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="VibeCast" className="h-11 w-auto" />
          <span className="text-2xl font-black tracking-tight">VibeCast</span>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-5xl font-black leading-[1.08] tracking-tight">
            Your music,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-[#1db954]">
              always in sync.
            </span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            Stream trending albums, explore top artists, and keep your liked tracks and custom playlists wherever you go.
          </p>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#1db954]">
                <Disc3 className="w-4 h-4" />
              </div>
              <span>Unlimited streaming across artists, albums & mood mixes</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-400">
                <Heart className="w-4 h-4" />
              </div>
              <span>Save your favourite tracks to your personal library</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                <ListMusic className="w-4 h-4" />
              </div>
              <span>Create and manage custom playlists in seconds</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-gray-500">
          © {new Date().getFullYear()} VibeCast. Built for music lovers.
        </p>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-col justify-center items-center px-6 py-12 sm:px-10 relative">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-8">
            <img src={logo} alt="VibeCast" className="h-9 w-auto" />
            <span className="text-xl font-black tracking-tight">VibeCast</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight">
              {mode === "login" ? "Sign in to your account" : "Create your account"}
            </h2>
            <p className="text-sm text-gray-400 mt-1.5">
              {mode === "login"
                ? "Welcome back. Enter your details or continue with Google."
                : "Get started with VibeCast in a few seconds."}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-[#121212] p-1 rounded-xl mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google sign-in failed")}
              theme="filled_black"
              shape="pill"
              text="continue_with"
              size="large"
              width="380"
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative flex items-center bg-[#141414] rounded-xl px-4 py-3.5 border border-white/10 focus-within:border-[#1db954] transition">
                  <User className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center bg-[#141414] rounded-xl px-4 py-3.5 border border-white/10 focus-within:border-[#1db954] transition">
                <Mail className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center bg-[#141414] rounded-xl px-4 py-3.5 border border-white/10 focus-within:border-[#1db954] transition">
                <Lock className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500 pr-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-gray-400 hover:text-white transition cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-[#1db954] hover:bg-[#1ed760] active:scale-[0.99] text-black font-extrabold py-3.5 rounded-full shadow-[0_0_24px_rgba(29,185,84,0.28)] transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;