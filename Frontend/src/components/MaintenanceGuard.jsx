import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import MaintenanceScreen from "./MaintenanceScreen";

const MaintenanceGuard = ({ children }) => {
  const { user, isLoaded } = useUser();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkMaintenance = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setIsMaintenanceMode(data.maintenance_mode);
        }
      } catch (err) {
        console.error("Failed to check maintenance mode:", err);
      } finally {
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

  if (!isLoaded || checkingMaintenance) return null;

  const isAdmin = user?.primaryEmailAddress?.emailAddress === import.meta.env.VITE_ADMIN_EMAIL;

  if (isMaintenanceMode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
};

export default MaintenanceGuard;