import React, { useContext, useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Home from "./pages/Home";
import Navbar from "./components/NavBar";
import SearchResults from "./pages/SearchResults";
import MoodPlaylist from "./components/MoodPlaylist";
import Artists from "./components/Artist";
import Trending from "./components/Trending";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";

import ArtistPage from "./components/ArtistPage";
import GlobalMiniPlayer from "./components/GlobalMiniPlayer";
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Admin from "./Admin";
import Profile from "./pages/Profile";
import LikedSongsPage from "./components/LikedSongsPage";
import CustomPlaylistPage from "./pages/CustomPlaylistPage";
import MaintenanceGuard from "./components/MaintenanceGuard";
import AlbumPage from "./components/AlbumPage";
import ErrorBoundary from "./components/ErrorBoundary";
import ServerWakeBanner from "./components/ServerWakeBanner";

const RequireAuth = ({ children, loadingText = "Loading..." }) => {
  const { isLoaded, isSignedIn } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [isLoaded, isSignedIn, navigate, location.pathname]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-[#1db954] font-semibold">
        {loadingText}
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { isLoaded, isSignedIn, isAdmin } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [isLoaded, isSignedIn, navigate, location.pathname]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-[#1db954] font-semibold">
        Loading Studio...
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (!isAdmin) {
    return <NotFound />;
  }

  return children;
};

function AppShell() {
  const { authModalOpen, closeAuthModal } = useContext(AuthContext) || {};
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === "/login";

  useEffect(() => {
    if (authModalOpen) {
      closeAuthModal?.();
      if (!isAuthPage) {
        navigate("/login", { state: { from: location.pathname } });
      }
    }
  }, [authModalOpen, closeAuthModal, isAuthPage, navigate, location.pathname]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <ServerWakeBanner />
      {!isAuthPage && <Navbar />}

      <main className={isAuthPage ? "" : "pb-24 sm:pb-28"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/mood/:id" element={<MoodPlaylist />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/artist/:artistName" element={<ArtistPage />} />
          <Route path="/liked-songs" element={<LikedSongsPage />} />
          <Route path="/playlist/:id" element={<CustomPlaylistPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />

          {/* Catch-all 404 page at the bottom */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAuthPage && <GlobalMiniPlayer />}
    </div>
  );
}

function MainApp() {
  return (
    <MaintenanceGuard>
      <PlayerProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
        </BrowserRouter>
      </PlayerProvider>
    </MaintenanceGuard>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;