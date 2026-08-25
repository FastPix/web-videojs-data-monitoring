import { useState } from "react";
import "video.js/dist/video-js.css";
import { useFastpixVideojs } from "./useFastpixVideojs";

const SOURCES = {
  hls: {
    src: "https://stream.fastpix.com/7c8d5087-edf7-462f-a1b3-e2fbd30747fa.m3u8",
    type: "application/x-mpegURL",
  },
  dash: {
    // FastPix sample is HLS-only; public DASH stream used as a stand-in.
    src: "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd",
    type: "application/dash+xml",
  },
};

export default function App() {
  const [kind, setKind] = useState<keyof typeof SOURCES>("hls");

  // key={kind} in the <video> forces a full remount when switching streams,
  // so the player is disposed and re-attached cleanly.
  const videoRef = useFastpixVideojs({
    source: SOURCES[kind],
    metadata: {
      // Get your key from https://dashboard.fastpix.com
      workspace_id: "YOUR_WORKSPACE_KEY",
      player_name: "react-vite-demo",
      video_title: `FastPix sample — ${kind.toUpperCase()}`,
      video_id: `react-vite-${kind}`,
    },
  });

  return (
    <main style={{ maxWidth: 960, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>Video.js + FastPix Data — React + Vite</h1>
      <div style={{ margin: "1rem 0", display: "flex", gap: ".5rem" }}>
        <button onClick={() => setKind("hls")} disabled={kind === "hls"}>HLS</button>
        <button onClick={() => setKind("dash")} disabled={kind === "dash"}>DASH</button>
      </div>
      <div data-vjs-player key={kind}>
        <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline />
      </div>
    </main>
  );
}
