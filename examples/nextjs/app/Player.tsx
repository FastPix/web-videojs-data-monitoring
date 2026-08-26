"use client";

import { useEffect, useRef } from "react";
import "video.js/dist/video-js.css";

type Props = {
  src: string;
  type: string;
  metadata: Record<string, unknown>;
};

// video.js touches `window` at import, so load it (and the SDK) inside the
// client-only effect to avoid SSR "window is not defined".
export default function Player({ src, type, metadata }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  return <div ref={containerRef} data-vjs-player />;
}
