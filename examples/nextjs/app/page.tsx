import Player from "./Player";

export default function Home() {
  return (
    <main style={{ maxWidth: 960, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>Video.js + FastPix Data — Next.js (App Router)</h1>
      <Player
        metadata={{
          // Get your key from https://dashboard.fastpix.com
          workspace_id: "YOUR_WORKSPACE_KEY",
          player_name: "nextjs-demo",
        }}
      />
    </main>
  );
}
