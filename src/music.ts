import { Howl } from "howler";
import songs from "./songs/songs.json";

let sound: Howl;
let songInfo = "";

const playlist = songs
  .map((song) => ({ song, order: Math.random() }))
  .sort((a, b) => a.order - b.order)
  .map(({ song }) => song);

export function toggleSong(
  updateSongInfoCallback: (info: string) => void,
  setIsMuted: (value: boolean) => void,
  setLoading: (value: boolean) => void
) {
  if (sound && sound.playing()) {
    stopSong(updateSongInfoCallback, setIsMuted);
  } else {
    playNextSong(updateSongInfoCallback, setIsMuted, setLoading);
  }
}

export function stopSong(
  updateSongInfoCallback: (info: string) => void,
  setIsMuted: (value: boolean) => void
) {
  // Stop existing sound.
  if (sound) {
    sound.stop();
  }

  // Update song info
  songInfo = "";
  if (updateSongInfoCallback) {
    updateSongInfoCallback(songInfo);
  }

  setIsMuted(true);
}

export function playNextSong(
  updateSongInfoCallback: (info: string) => void,
  setIsMuted: (value: boolean) => void,
  setLoading: (value: boolean) => void
) {

  // Set loading state.
  setLoading(true);

  // Stop existing sound.
  stopSong(() => {}, setIsMuted);

  // Pick next song.
  const songUrl = playlist.shift();

  // Map song to song info.
  const songMap: { [key: string]: string } = {
    "song1.mp3": 'Brogletroll - "Falling Forever"',
    "song2.mp3": 'DickLaFlame - "Untitled"',
    "song3.mp3": 'AlgoFotos - "Bork Me, Bork Please"',
    "song4.mp3": 'love, rumi - "funfun"',
    "song5.mp3": 'love, rumi - "quartz"',
    "song6.mp3": 'love, rumi - "mac attack (RIP)"',
    "song7.mp3": 'love, rumi - "and I reply"',
    "song8.mp3": 'love, rumi - "ask"',
    "song9.mp3": 'love, rumi - "fur coat"',
    "song10.mp3": 'Kraken - "Echoes of Yesterday"',
    "song11.mp3": 'J(X) - "Short Circuit"',
    "song12.mp3": 'The Devil Zerker - "Light Rider"',
    "song13.mp3": 'Young Margni - "Jerkk"',
    "song14.mp3": 'Young Margni - "Island"',
    "song15.mp3": 'The Devil Zerker - "Double Dagger"',
  };
  const songKey = Object.keys(songMap).find((key) => songUrl.includes(key));
  songInfo = songKey ? songMap[songKey] : "";

  //console.log("Playing song:", songInfo);

  // Update song info callback
  if (updateSongInfoCallback) {
    updateSongInfoCallback(songInfo);
  }

  // Moves song to back of playlist.
  playlist.push(songUrl!);

  // Play song.
  sound = new Howl({
    loop: false,
    src: [songUrl],
    volume: 0.75,
    onload: () => {
      setLoading(false);
    },
    onend: () => playNextSong(updateSongInfoCallback, setIsMuted, setLoading),
    onplay: () => {
      setIsMuted(false);
    },
    onstop: () => {
      setIsMuted(true);
    },
  });
  sound.play();
}

// mute all sounds when tab is not focused
export function muteOnBackground() {
  const handleVisibility = () => {
    if (document.hidden) {
      Howler.mute(true);  
    } else {
      Howler.mute(false);
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);

  return () => document.removeEventListener("visibilitychange", handleVisibility);
}
