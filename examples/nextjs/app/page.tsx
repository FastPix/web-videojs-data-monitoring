import Player from "./Player";

export default function Home() {
  return (
    <main style={{ maxWidth: 960, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>Video.js + FastPix Data — Next.js (App Router)</h1>
      <Player
        src="https://stream.fastpix.com/7c8d5087-edf7-462f-a1b3-e2fbd30747fa.m3u8"
        type="application/x-mpegURL"
        metadata={{
          // Get your key from https://dashboard.fastpix.com
          workspace_id: "YOUR_WORKSPACE_KEY",
          player_name: "nextjs-demo",
          video_title: "FastPix sample — HLS",
          video_id: "nextjs-hls",
        }}
      />
    </main>
  );
}
