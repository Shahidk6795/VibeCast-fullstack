import mysql from 'mysql2/promise';
import 'dotenv/config'; // Ensures process.env works if running as a standalone script

const artistIdRanges = [
  { min: 1, max: 11, name: "Arijit Singh" },
  { min: 12, max: 24, name: "Anuv Jain" },
  { min: 25, max: 38, name: "Ariana Grande" },
  { min: 39, max: 52, name: "Atif Aslam" },
  { min: 53, max: 67, name: "Billie Eilish" },
  { min: 96, max: 109, name: "Bruno Mars" },
  { min: 110, max: 120, name: "Bad Bunny" },
  { min: 121, max: 130, name: "Drake" },
  { min: 131, max: 145, name: "Ed Sheeran" },
  { min: 146, max: 160, name: "Eminem" },
  { min: 161, max: 175, name: "Emiway Bantai" },
  { min: 191, max: 205, name: "Guru Randhawa" },
  { min: 206, max: 218, name: "Himesh Reshammiya" },
  { min: 219, max: 232, name: "Karan Aujla" },
  { min: 233, max: 248, name: "Krsna" },
  { min: 249, max: 263, name: "Pritam" },
  { min: 264, max: 279, name: "Shreya Ghoshal" },
  { min: 280, max: 294, name: "Travis Scott" },
  { min: 295, max: 309, name: "The Weeknd" },
  { min: 310, max: 322, name: "Yo Yo Honey Singh" }
];

async function recoverLinks() {
  const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // 🟢 FIX: Moved console.log outside the setup object
  console.log("Connected to database. Starting ID-based recovery...");

  try {
    const [tracks] = await db.query("SELECT id, title FROM tracks");
    const [artists] = await db.query("SELECT id, name FROM artists");

    await db.query("DELETE FROM track_artists");

    let linkedCount = 0;

    for (const track of tracks) {
      // Find which ID range this track falls into
      const matchedRange = artistIdRanges.find(r => track.id >= r.min && track.id <= r.max);
      
      if (matchedRange) {
        // Find the corresponding artist ID in the database
        const dbArtist = artists.find(a => a.name.toLowerCase() === matchedRange.name.toLowerCase());
        
        if (dbArtist) {
          await db.query(
            "INSERT IGNORE INTO track_artists (track_id, artist_id) VALUES (?, ?)",
            [track.id, dbArtist.id]
          );
          linkedCount++;
        } else {
          console.log(`⚠️ Database missing artist profile for: "${matchedRange.name}"`);
        }
      } else {
        console.log(`⚠️ Track ID ${track.id} ("${track.title}") did not fall into any known range.`);
      }
    }

    console.log(`\n🎉 Done! Successfully matched and linked ${linkedCount}/${tracks.length} tracks.`);

  } catch (error) {
    console.error("Recovery failed:", error);
  } finally {
    await db.end(); // 🟢 FIX: This now matches the 'db' variable
  }
}

recoverLinks();