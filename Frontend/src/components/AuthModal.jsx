import React, { useState, useContext, useEffect } from "react";
import { X, Mail, Lock, User } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { AuthContext } from "../context/AuthContext";

const AuthModal = () => {
  const { authModalOpen, closeAuthModal, login, register, googleLogin } = useContext(AuthContext) || {};
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authModalOpen) {
      setError("");
      setPassword("");
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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={closeAuthModal}
    >
      <div
        className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl text-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-black mb-1">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {mode === "login"
            ? "Sign in to access your playlists and liked songs."
            : "Join VibeCast to save tracks and build playlists."}
        </p>

        <div className="grid grid-cols-2 gap-2 bg-[#121212] p-1 rounded-xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 rounded-lg text-sm font-bold transition ${
              mode === "login" ? "bg-[#282828] text-[#1db954]" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`py-2 rounded-lg text-sm font-bold transition ${
              mode === "register" ? "bg-[#282828] text-[#1db954]" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Name
              </label>
              <div className="relative flex items-center bg-[#282828] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-[#1db954]">
                <User className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
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
              Email
            </label>
            <div className="relative flex items-center bg-[#282828] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-[#1db954]">
              <Mail className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
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
            <div className="relative flex items-center bg-[#282828] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-[#1db954]">
              <Lock className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold py-3.5 rounded-full transition disabled:opacity-50"
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

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google sign-in failed")}
            theme="filled_black"
            shape="pill"
            text="continue_with"
            width="320"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthModal;