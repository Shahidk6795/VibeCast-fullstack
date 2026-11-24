import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import MaintenanceScreen from "./MaintenanceScreen";
import { API_URL } from "../config.js";

const MaintenanceGuard = ({ children }) => {
  const { user, isLoaded } = useUser();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkMaintenance = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch(`${API_URL}/api/settings`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setIsMaintenanceMode(Boolean(data.maintenance_mode));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Failed to check maintenance mode:", err);
        }
        if (isMounted) setIsMaintenanceMode(false);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setCheckingMaintenance(false);
      }
    };

    checkMaintenance();

    const intervalId = setInterval(checkMaintenance, 300000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  if (!isLoaded || checkingMaintenance) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-gray-400">Loading VibeCast...</p>
      </div>
    );
  }

  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
  const userEmail = (user?.primaryEmailAddress?.emailAddress || '').trim().toLowerCase();
  const isAdmin = Boolean(adminEmail && userEmail === adminEmail);

  if (isMaintenanceMode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
};

export default MaintenanceGuard;