import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";

import Home from "./pages/Home";
import Navbar from "./components/NavBar";
import SearchResults from "./pages/SearchResults";
import MoodPlaylist from "./components/MoodPlaylist";
import Artists from "./components/Artist";
import Trending from "./components/Trending";
import NotFound from "./pages/NotFound";

import ArtistPage from "./components/ArtistPage";
import GlobalMiniPlayer from "./components/GlobalMiniPlayer";
import { PlayerProvider } from "./context/PlayerContext";
import Admin from './Admin';
import Profile from "./pages/Profile";
import LikedSongsPage from "./components/LikedSongsPage";
import CustomPlaylistPage from "./pages/CustomPlaylistPage";
import MaintenanceGuard from './components/MaintenanceGuard';
import AlbumPage from './components/AlbumPage';
import ErrorBoundary from './components/ErrorBoundary';
import ServerWakeBanner from './components/ServerWakeBanner';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const AdminRoute = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();
  const userEmail = (user?.primaryEmailAddress?.emailAddress || "").trim().toLowerCase();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-[#1db954] font-semibold">
        Loading Studio...
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const isAdmin = Boolean(adminEmail && userEmail === adminEmail);

  if (!isAdmin) {
    return <NotFound />;
  }

  return children;
};

function MainApp() {
  return (
    <MaintenanceGuard>
      <BrowserRouter>
        <PlayerProvider>
          <ErrorBoundary>
            <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
              <ServerWakeBanner />
              <Navbar />

              <main className="pb-24 sm:pb-28">
                <Routes>
                  <Route path="/" element={<Home />} />
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
                      <>
                        <SignedIn>
                          <Profile />
                        </SignedIn>
                        <SignedOut>
                          <RedirectToSignIn />
                        </SignedOut>
                      </>
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

              <GlobalMiniPlayer />
            </div>
          </ErrorBoundary>
        </PlayerProvider>
      </BrowserRouter>
    </MaintenanceGuard>
  );
}

function App() {
  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Configuration Error</h1>
        <p className="text-gray-400 max-w-md">
          Missing authentication key. Check that <code className="text-white">VITE_CLERK_PUBLISHABLE_KEY</code> is set in your environment variables.
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <MainApp />
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;