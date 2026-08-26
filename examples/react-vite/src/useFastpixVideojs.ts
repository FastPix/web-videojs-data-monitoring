import { useEffect, useRef } from "react";
import videojs from "video.js";
import initVideoJsTracking from "@fastpix/videojs-monitor";

type Source = { src: string; type: string };

type Options = {
  source: Source;
  metadata: Record<string, unknown>;
};

// Video.js owns/destroys its own element, so create it imperatively rather than
// handing it a React-rendered <video> (survives StrictMode remounts).
export function useFastpixVideojs({ source, metadata }: Options) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const videoEl = document.createElement("video-js");
    videoEl.classList.add("vjs-big-play-centered");
    container.appendChild(videoEl);

    const player = videojs(videoEl, {
      controls: true,
      fluid: true,
      responsive: true,
      sources: [source],
    });

    initVideoJsTracking(player, {
      videojs,
      data: {
        player_init_time: initVideoJsTracking.utilityMethods.now(),
        ...metadata,
      },
    });

    // dispose() also runs the SDK's fp.destroy() via its "dispose" listener.
    return () => {
      if (!player.isDisposed()) player.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.src, source.type]);

  return containerRef;
}
