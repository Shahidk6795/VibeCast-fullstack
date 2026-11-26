import React, { useState, useContext, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/logo.png";

const AuthModal = () => {
  const { authModalOpen, closeAuthModal, login, register, googleLogin } = useContext(AuthContext) || {};
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authModalOpen) {
      setError("");
      setPassword("");
      setShowPassword(false);
    }
  }, [authModalOpen, mode]);

  if (!authModalOpen) return null;

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
      setName("");
      setEmail("");
      setPassword("");
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
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#111111]/95 border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top neon accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-[#1db954]" />

        {/* Ambient background glows */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-pink-500/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-[#1db954]/15 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8">
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <img src={logo} alt="VibeCast" className="h-10 w-auto mb-3 drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]" />
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {mode === "login" ? "Welcome back" : "Join VibeCast"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {mode === "login"
                ? "Sign in to sync your liked songs & playlists."
                : "Create an account to build your personal library."}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-1.5 bg-black/60 p-1 rounded-full mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-white text-black shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                mode === "register"
                  ? "bg-white text-black shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Google Sign-In First */}
          <div className="flex justify-center mb-5">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google sign-in failed")}
              theme="filled_black"
              shape="pill"
              text="continue_with"
              width="340"
            />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">
              or with email
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div className="relative flex items-center bg-white/5 hover:bg-white/[0.07] rounded-xl px-4 py-3 border border-white/10 focus-within:border-[#1db954] transition">
                <User className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
                />
              </div>
            )}

            <div className="relative flex items-center bg-white/5 hover:bg-white/[0.07] rounded-xl px-4 py-3 border border-white/10 focus-within:border-[#1db954] transition">
              <Mail className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
              />
            </div>

            <div className="relative flex items-center bg-white/5 hover:bg-white/[0.07] rounded-xl px-4 py-3 border border-white/10 focus-within:border-[#1db954] transition">
              <Lock className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500 pr-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-gray-400 hover:text-white transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-[#1db954] hover:bg-[#1ed760] active:scale-[0.99] text-black font-extrabold py-3.5 rounded-full shadow-[0_0_20px_rgba(29,185,84,0.3)] transition-all disabled:opacity-50 cursor-pointer"
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

export default AuthModal;