import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";

import Home from "./pages/Home";
import Navbar from "./components/NavBar";
import SearchResults from "./pages/SearchResults"; 
import MoodPlaylist from "./components/MoodPlaylist"; 
import Artists from "./components/Artist";
import Trending from "./components/Trending";

import ArtistPage from "./components/ArtistPage"; 
import GlobalMiniPlayer from "./components/GlobalMiniPlayer";
import { PlayerProvider } from "./context/PlayerContext";
import Admin from './Admin';
import Profile from "./pages/Profile";
import LikedSongsPage from "./components/LikedSongsPage";
import CustomPlaylistPage from "./pages/CustomPlaylistPage";
import MaintenanceGuard from './components/MaintenanceGuard';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error("Missing Publishable Key. Did you create the .env file?");
}

const AdminRoute = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

  if (!isLoaded) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-[#1db954]">Loading Studio...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function MainApp() {
  return (
    <MaintenanceGuard>
      <PlayerProvider>
        <BrowserRouter>
          <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
            
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

              </Routes>
            </main>
            
            <GlobalMiniPlayer />
            
          </div>
        </BrowserRouter>
      </PlayerProvider>
    </MaintenanceGuard>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <MainApp />
    </ClerkProvider>
  );
}

export default App;