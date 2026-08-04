import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Search, X, Sparkles, Music2 } from "lucide-react";

const Artists = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  
  // State for fetching database data
  const [dbArtists, setDbArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [genres, setGenres] = useState(["All"]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/artists');
        if (response.ok) {
          const data = await response.json();
          
          // 🟢 FIXED: Map the database 'image_url' to the React 'image' property
          const formattedArtists = data.map(artist => ({
            name: artist.name,
            image: artist.image_url || artist.image, // Handles both just in case!
            path: `/artist/${encodeURIComponent(artist.name)}`,
            genre: artist.genre || "Artist" 
          }));

          setDbArtists(formattedArtists);
          setFilteredArtists(formattedArtists);

          // Dynamically calculate the genres list based on what we fetched
          const uniqueGenres = ["All", ...new Set(formattedArtists.map(a => a.genre))];
          setGenres(uniqueGenres);
        }
      } catch (error) {
        console.error("Error fetching artists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtists();
  }, []);

  useEffect(() => {
    let result = dbArtists;
    
    if (selectedGenre !== "All") {
      result = result.filter((artist) => artist.genre === selectedGenre);
    }
    
    if (searchTerm) {
      result = result.filter((artist) =>
        artist.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredArtists(result);
  }, [searchTerm, selectedGenre, dbArtists]);

  return (
    <div className="w-full min-h-screen text-white bg-black relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a2a2a_1px,transparent_1px),linear-gradient(to_bottom,#2a2a2a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] top-1/2 transform perspective-500 rotateX(60deg) origin-top h-[150vh] opacity-30"></div>
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-pink-900/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
         </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-32">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2">
              <span className="text-white">Discover</span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">Artists</span>
            </h1>
            <p className="text-gray-400 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              Explore genres from Pop to Sufi.
            </p>
          </div>

          <div className="relative group w-full md:w-80 z-20">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <div className="relative flex items-center bg-[#121212] border border-white/10 rounded-full px-4 py-3">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 ml-3"
              />
              {searchTerm && (
                <X onClick={() => setSearchTerm("")} className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer" />
              )}
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide mask-edges z-20 relative">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                selectedGenre === genre
                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105"
                  : "bg-[#181818] text-gray-400 border-white/10 hover:border-white/30 hover:text-white hover:bg-[#222]"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Artists Display */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-gray-400 mt-4 font-bold tracking-widest uppercase text-sm">Loading Artists...</p>
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
            {filteredArtists.map((artist, idx) => (
              
              <div
                key={artist.name}
                onClick={() => navigate(artist.path, { state: { image: artist.image } })}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="group relative flex flex-col items-center animate-fadeInUp opacity-0 fill-mode-forwards cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-pink-600/0 to-purple-600/0 group-hover:from-pink-600/20 group-hover:to-purple-600/20 rounded-2xl transition-all duration-500 -z-10 blur-xl"></div>

                <div className="relative w-full aspect-square mb-4 rounded-full overflow-hidden shadow-lg ring-4 ring-transparent group-hover:ring-pink-500/30 transition-all duration-300">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <Play className="w-6 h-6 text-black fill-current ml-1" />
                    </div>
                  </div>
                </div>

                <div className="text-center z-10">
                  <h3 className="font-bold text-white text-lg truncate group-hover:text-pink-400 transition-colors">
                    {artist.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Music2 className="w-3 h-3 text-gray-500 group-hover:text-pink-500 transition-colors" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide group-hover:text-white transition-colors">
                      {artist.genre}
                    </p>
                  </div>
                </div>
              </div>

            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
             <Search className="w-16 h-16 mb-4 opacity-20" />
             <p className="text-xl font-bold">No artists found</p>
          </div>
        )}

      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .fill-mode-forwards {
          animation-fill-mode: forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .mask-edges {
            mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>
    </div>
  );
};

export default Artists;