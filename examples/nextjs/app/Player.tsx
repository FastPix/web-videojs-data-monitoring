"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import initVideoJsTracking from "@fastpix/videojs-monitor";
import "video.js/dist/video-js.css";

type Props = {
  src: string;
  type: string;
  metadata: Record<string, unknown>;
};

// Video.js is browser-only, so the player is created inside useEffect on the
// client. The FastPix SDK import itself is SSR-safe (it only touches `window`
// inside a guarded block), so no next/dynamic { ssr: false } workaround is needed.
export default function Player({ src, type, metadata }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const player = videojs(el, {
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

    // player.dispose() triggers the SDK's own fp.destroy() via its dispose listener.
    return () => {
      if (!player.isDisposed()) player.dispose();
    };
  }, [src, type]);

  return (
    <div data-vjs-player key={src}>
      <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline />
    </div>
  );
}
