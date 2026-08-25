import { useEffect, useRef } from "react";
import videojs from "video.js";
import initVideoJsTracking from "@fastpix/videojs-monitor";

type Source = { src: string; type: string };

type Options = {
  source: Source;
  metadata: Record<string, unknown>;
};

// Creates a Video.js player inside a <video> ref and attaches FastPix tracking.
// Returns a ref to place on a <video data-vjs-player> element.
export function useFastpixVideojs({ source, metadata }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const player = videojs(el, {
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

    // Disposing the player triggers the SDK's own fp.destroy() via its
    // "dispose" listener — no separate teardown call is needed.
    return () => {
      if (!player.isDisposed()) player.dispose();
    };
    // Re-create on source change; metadata is read once at attach time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.src, source.type]);

  return videoRef;
}
