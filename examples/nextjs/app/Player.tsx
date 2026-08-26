"use client";

import { useEffect, useRef, useState } from "react";
import "video.js/dist/video-js.css";

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

type Props = { metadata: Record<string, unknown> };

// video.js touches `window` at import, so load it (and the SDK) inside the
// client-only effect to avoid SSR "window is not defined".
export default function Player({ metadata }: Props) {
  const [kind, setKind] = useState<keyof typeof SOURCES>("hls");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { src, type } = SOURCES[kind];

  useEffect(() => {
    let player: any;
    let cancelled = false;

    (async () => {
      const videojs = (await import("video.js")).default;
      const initVideoJsTracking = (await import("@fastpix/videojs-monitor"))
        .default;
      const container = containerRef.current;
      if (cancelled || !container) return;

      // Create the element imperatively so video.js — not React — owns it.
      const videoEl = document.createElement("video-js");
      videoEl.classList.add("vjs-big-play-centered");
      container.appendChild(videoEl);

      player = videojs(videoEl, {
        controls: true,
        fluid: true,
        responsive: true,
        sources: [{ src, type }],
      });

      initVideoJsTracking(player, {
        videojs,
        data: {
          player_init_time: initVideoJsTracking.utilityMethods.now(),
          video_title: `FastPix sample — ${kind.toUpperCase()}`,
          video_id: `nextjs-${kind}`,
          ...metadata,
        },
      });
    })();

    // dispose() also runs the SDK's fp.destroy() via its "dispose" listener.
    return () => {
      cancelled = true;
      if (player && !player.isDisposed()) player.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, type]);

  return (
    <>
      <div style={{ margin: "1rem 0", display: "flex", gap: ".5rem" }}>
        <button onClick={() => setKind("hls")} disabled={kind === "hls"}>HLS</button>
        <button onClick={() => setKind("dash")} disabled={kind === "dash"}>DASH</button>
      </div>
      <div ref={containerRef} data-vjs-player />
    </>
  );
}
