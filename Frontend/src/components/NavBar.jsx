import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Home, Disc, Flame, Search, Upload, LayoutDashboard } from "lucide-react"; 
import { useUser } from "@clerk/clerk-react";
import logo from "../assets/logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  const { user, isSignedIn } = useUser();
  
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL; 
  const isAdmin = isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Search", path: "/search", icon: Search },
    { name: "Artists", path: "/artists", icon: Disc }, 
    { name: "Trending", path: "/trending", icon: Flame }, 
    ...(isAdmin ? [{ name: "Studio", path: "/admin", icon: Upload }] : []),
    ...(isSignedIn && !isAdmin ? [{ name: "Profile", path: "/profile", icon: LayoutDashboard }] : [])
  ];

  const getDesktopClass = (path) =>
    location.pathname === path
      ? "text-white after:w-full font-bold drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" 
      : "text-gray-400 after:w-0 hover:text-white";

  const getMobileClass = (path) => 
    location.pathname === path
      ? "text-pink-500 scale-110 drop-shadow-[0_0_10px_rgba(236,72,153,0.6)]"
      : "text-gray-500 hover:text-white";

  return (
    <>
      <header 
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled 
            ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg py-2" 
            : "bg-transparent py-4"
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50"></div>

        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          
          <div
            className="flex items-center cursor-pointer gap-3 group"
            onClick={() => navigate("/")}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
              <img
                src={logo}
                alt="VibeCast"
                className="relative h-10 w-auto transform group-hover:rotate-12 transition-transform duration-500"
              />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`relative flex items-center gap-2 text-sm uppercase tracking-wide transition-all duration-300 group ${getDesktopClass(item.path)}`}
              >
                <item.icon className={`w-4 h-4 transition-colors duration-300 ${location.pathname === item.path ? "text-pink-500" : "text-gray-500 group-hover:text-pink-400"}`} />
                {item.name}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 flex-1 justify-end md:flex-none">
            <button
              onClick={() => navigate("/profile")}
              className="relative group focus:outline-none"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full opacity-70 group-hover:opacity-100 blur transition duration-300"></div>
              <div className="relative w-9 h-9 bg-[#121212] rounded-full flex items-center justify-center border border-white/10 overflow-hidden">
                {isSignedIn ? (
                    <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <User className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex justify-between items-center pb-safe safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1 p-2"
          >
            <item.icon className={`w-6 h-6 transition-all duration-300 ${getMobileClass(item.path)}`} />
            <span className={`text-[10px] font-medium transition-colors ${location.pathname === item.path ? "text-white" : "text-gray-500"}`}>
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </>
  );
};

export default Navbar;