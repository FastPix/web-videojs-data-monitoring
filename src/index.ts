import fastpixMetrix from "@fastpix/video-data-core";
import { attachAdTracking } from "./AdTracking/index";

type Request = {
  readyState: number;
  responseURL: string;
  responseType: string;
  response: any;
  status: number;
  getAllResponseHeaders: () => string;
  onreadystatechange: Function | null;
};

interface RequestHandler {
  xhr: (callback: (request: Request) => void) => void;
}

interface VideoPlayer {
  isDisposed(): boolean;
  off: any;
  addClass: any;
  ready: any;
  one(arg0: string, callback: () => void): unknown;
  fp: {
    dispatch: (eventName: string, eventData: any) => any;
    destroy: () => void;
  };
  on(event: string, callback: () => void): void;
  paused(): boolean;
  isFullscreen(): boolean;
  autoplay(): boolean;
  width(): number;
  height(): number;
  language(): string;
  preload(): string;
  poster(): string;
  currentSrc(): string;
  currentType(): string;
  duration(): number;
  videoHeight(): number;
  videoWidth(): number;
  el(): HTMLElement;
  currentTime(): number;
  error(): { code: number; message: string; status?: string } | null;
  tech(options?: { IWillNotUseThisInPlugins: boolean }): {
    vhs?: any;
    hls?: any;
    el?: () => HTMLVideoElement;
  };
  muted(): boolean;
  defaultMuted(): boolean;
  volume(): number;
  playbackRate(): number;
  loop(): boolean;
  controls(): boolean;
  isInPictureInPicture?: () => boolean;
  textTracks(): TextTrackList;
  audioTracks?: () => {
    length: number;
    [index: number]: { enabled: boolean; language?: string };
  };
}

interface Config {
  automaticErrorTracking?: boolean;
  fetchStateData?: () => Record<string, any>;
  fetchPlayheadTime?: () => number;
  data?: Record<string, any>;
  videojs?: {
    VERSION?: string;
    getTech?: (tech: string) => any;
    Vhs?: any;
    Hls?: any;
  };
}

const browserEvents: string[] = [
  "loadstart",
  "pause",
  "play",
  "playing",
  "seeking",
  "seeked",
  "timeupdate",
  "waiting",
  "error",
  "ended",
];

const headerRequests: string[] = [
  "x-cdn",
  "content-type",
  "content-length",
  "last-modified",
  "server",
  "x-request-id",
  "cf-ray",
  "x-amz-cf-id",
  "x-akamai-request-id",
];

function filterHeadersByAllowedList(
  headerString: string,
): Record<string, string> {
  const filteredHeaders: Record<string, string> = {};
  const allowedHeaders = new Set(
    headerRequests.map((header) => header.toLowerCase()),
  );

  if (!headerString || typeof headerString !== "string") {
    return {};
  }

  headerString
    .trim()
    .split(/[\r\n]+/)
    .forEach((headerLine) => {
      const [headerName, ...headerValueParts] = headerLine.split(": ");
      const headerValue = headerValueParts.join(": ");
      if (headerName && allowedHeaders.has(headerName.toLowerCase())) {
        filteredHeaders[headerName] = headerValue;
      }
    });

  return filteredHeaders;
}

// Function to get the key based on content type
let getContentTypeKey = function (headers: any): string {
  let contentType = headers["content-type"];

  if (!contentType) {
    return "unknown";
  }

  if (isManifestType(contentType)) {
    return "manifest";
  } else if (isAudioType(contentType)) {
    return "audio";
  } else if (isVideoType(contentType)) {
    return "video";
  } else {
    return "unknown";
  }
};

// Function to check if the content type is a manifest type
function isManifestType(contentType: string) {
  return (
    /^application\/x-mpegurl/i.exec(contentType) ||
    /^application\/vnd.apple.mpegurl/i.exec(contentType) ||
    /^application\/dash+xml/i.exec(contentType) ||
    /^audio\/mpegurl/i.exec(contentType)
  );
}

function isAudioType(contentType: string) {
  return /^audio.*/i.exec(contentType);
}

function isVideoType(contentType: string) {
  return /^video.*/i.exec(contentType);
}

function determinePreloadType(data: string): boolean {
  return ["auto", "metadata"].includes(data);
}

function defaultOnReadyStateChange() {
  /* noop */
}

const initVideoJsTracking = (videoPlayer: VideoPlayer, config: Config) => {
  const videojsInstance =
    config?.videojs || (globalThis.window as any)?.videojs;
  let playerToken = "";

  // Error tracking configuration
  const errorTrackingConfig: {
    automaticErrorTracking: boolean;
  } = {
    automaticErrorTracking: config?.automaticErrorTracking ?? true,
  };

  // Validate if the player instance is a valid Video.js player
  if (typeof videoPlayer !== "object" || !videoPlayer?.on) {
    return console.warn(
      "A valid Video.js player instance must be provided to enable data analytics tracking.",
    );
  }

  // Validate if the videojsInstance is a valid Video.js instance
  if (
    !videojsInstance ||
    typeof videojsInstance !== "function" ||
    !videojsInstance.VERSION
  ) {
    return console.warn(
      "A valid Video.js instance (either imported from the package or provided via CDN) must be provided to enable data analytics tracking.",
    );
  }

  if (videoPlayer?.fp) {
    videoPlayer.fp.destroy();
    delete (videoPlayer as any)?.fp;
  }

  // Retrieve the current playhead time in milliseconds
  function getPlayheadTimeInMs(): number {
    if (!videoPlayer || videoPlayer?.isDisposed()) return 0;

    const playheadTimeInSeconds = videoPlayer.currentTime();
    return playheadTimeInSeconds ? Math.floor(playheadTimeInSeconds * 1000) : 0;
  }

  // Video.js delegates playback to a tech, so the viewer's own settings - mute,
  // volume, speed - live on the media element the tech drives rather than on
  // the player. The player API mirrors most of them, but the element is the
  // single source both the core and this adapter read, so it is asked directly.
  function getMediaElement(): HTMLVideoElement | null {
    if (!videoPlayer || videoPlayer.isDisposed()) return null;

    try {
      const techEl = videoPlayer
        .tech({ IWillNotUseThisInPlugins: true })
        ?.el?.();
      if (techEl?.nodeName?.toUpperCase() === "VIDEO") return techEl;
    } catch {}

    const el = videoPlayer.el()?.querySelector("video");
    return el instanceof HTMLVideoElement ? el : null;
  }

  // Read once, at first sight of the element. Chrome's native speed control
  // writes defaultPlaybackRate alongside playbackRate, so re-reading it on
  // every beacon would report the viewer's choice as the application's default
  // and the two fields could never disagree. Left absent until the element
  // exists, rather than defaulted to 1, so a missing element is not reported
  // as a real value.
  let configuredPlaybackRate: number | undefined;

  function readDefaultPlaybackRate(
    mediaElement: HTMLVideoElement | null,
  ): number | undefined {
    if (configuredPlaybackRate === undefined && mediaElement) {
      configuredPlaybackRate = mediaElement.defaultPlaybackRate;
    }

    return configuredPlaybackRate;
  }

  // The tech attaches asynchronously, so the observer is created on the first
  // read that finds an element rather than at setup.
  let viewability: { readState: () => Record<string, any> } | undefined;

  function readViewability(mediaElement: HTMLVideoElement | null) {
    if (!viewability && mediaElement) {
      viewability =
        fastpixMetrix.utilityMethods.observeViewability(mediaElement);
    }

    return (
      viewability?.readState() ?? {
        player_viewable_on: undefined,
        player_viewable_percentage: undefined,
      }
    );
  }

  // Latched for the view. Observed through the element's own events rather than
  // sampled when a beacon is built: picture-in-picture is usually entered and
  // left between two beacons, so a sampled read would miss it entirely.
  let usedPip = false;
  let pipObservedOn: HTMLVideoElement | undefined;

  // Safari implements picture-in-picture as a presentation mode rather than
  // through the standard interface, and reports fullscreen through that same
  // event - which is not picture-in-picture and must not latch.
  function observePictureInPicture(
    mediaElement: HTMLVideoElement | null,
  ): void {
    if (!mediaElement || pipObservedOn === mediaElement) return;

    pipObservedOn = mediaElement;

    mediaElement.addEventListener("enterpictureinpicture", () => {
      usedPip = true;
    });

    mediaElement.addEventListener("webkitpresentationmodechanged", () => {
      if (
        (mediaElement as any).webkitPresentationMode === "picture-in-picture"
      ) {
        usedPip = true;
      }
    });
  }

  // Video.js puts its own tracks in the same list as the media element's, and
  // the VHS segment-metadata track lives there too. Only a subtitle or caption
  // track means subtitles are on; a metadata track is not a caption.
  function findActiveTextTrack(): TextTrack | undefined {
    const tracks = videoPlayer.textTracks?.();
    if (!tracks) return undefined;

    // Video.js's track list is its own array-like rather than the DOM's, and
    // implements no iterator, so it is copied before being searched.
    return Array.from(tracks).find(
      (track) =>
        track.mode === "showing" &&
        (track.kind === "subtitles" || track.kind === "captions"),
    );
  }

  function readAudioLanguage(): string | undefined {
    const tracks = videoPlayer.audioTracks?.();
    if (!tracks) return undefined;

    const activeTrack = Array.from(tracks).find((track) => track.enabled);
    if (!activeTrack) return undefined;

    // A manifest that declares no audio language carries the "und"
    // placeholder. Sent as empty rather than passing it through, which
    // downstream would read as a real language code.
    return activeTrack.language === "und" ? "" : activeTrack.language;
  }

  const getPlayerState = () => {
    if (!videoPlayer || videoPlayer?.isDisposed()) return {};
    const videoPlayerEl = videoPlayer.el();
    const computedStyle = globalThis.window?.getComputedStyle(videoPlayerEl);
    const duration = videoPlayer.duration();
    const playerWidth = computedStyle
      ? Number.parseInt(computedStyle.width, 10)
      : videoPlayer.width();
    const playerHeight = computedStyle
      ? Number.parseInt(computedStyle.height, 10)
      : videoPlayer.height();
    let videoHeight = videoPlayer?.videoHeight();
    let videoWidth = videoPlayer?.videoWidth();

    if (videoHeight === undefined || videoWidth === undefined) {
      const videoElement = videoPlayer.el().firstChild;
      if (videoElement?.nodeName.toUpperCase() === "VIDEO") {
        videoHeight = (videoElement as HTMLVideoElement).videoHeight;
        videoWidth = (videoElement as HTMLVideoElement).videoWidth;
      }
    }

    const mediaElement = getMediaElement();
    observePictureInPicture(mediaElement);
    const activeTextTrack = findActiveTextTrack();
    const sourceUrl = videoPlayer.currentSrc();

    return {
      player_is_paused: videoPlayer.paused(),
      player_is_fullscreen: videoPlayer.isFullscreen() ?? false,
      player_autoplay_on: videoPlayer.autoplay() ?? false,
      player_width: playerWidth,
      player_height: playerHeight,
      player_language_code: videoPlayer.language() ?? "",
      player_preload_on: determinePreloadType(videoPlayer.preload()),
      video_poster_url: videoPlayer.poster(),
      video_source_url: sourceUrl,
      video_source_mime_type: videoPlayer.currentType().toLowerCase(),
      video_source_duration: duration ? Math.floor(duration * 1000) : null,
      video_source_is_live: duration === Infinity,
      video_source_height: videoHeight,
      video_source_width: videoWidth,

      // ── Viewer-controlled player state ──────────────────────────────
      player_muted: videoPlayer.muted(),
      // The initial value, not the current one - it must not follow the mute
      // button, or the pair says nothing.
      player_default_muted_on: videoPlayer.defaultMuted(),
      // 0 to 1, not 0 to 100
      player_volume_level: videoPlayer.volume(),
      player_playback_rate: videoPlayer.playbackRate(),
      player_default_playback_rate: readDefaultPlaybackRate(mediaElement),
      player_loop_on: videoPlayer.loop(),
      player_controls_on: videoPlayer.controls(),

      // ── Tracks ──────────────────────────────────────────────────────
      player_subtitles_on: !!activeTextTrack,
      // Empty rather than absent when nothing is showing. An absent field is
      // dropped on the way out, so the last language the view ever reported
      // would stand while the flag beside it said subtitles were off - the two
      // read from the same track and must never contradict each other.
      player_subtitles_language_code: activeTextTrack?.language ?? "",
      player_audio_language_code: readAudioLanguage(),

      // ── Presentation ────────────────────────────────────────────────
      player_is_pip: usedPip,

      // ── Delivery ────────────────────────────────────────────────────
      // Taken from the player's source rather than the element: on a streaming
      // source the tech drives the element through MSE, so its currentSrc is a
      // blob: URL that names nothing.
      video_source_stream_protocol:
        fastpixMetrix.utilityMethods.identifyStreamingProtocol(sourceUrl),
      video_source_buffer_length: mediaElement
        ? fastpixMetrix.utilityMethods.measureBufferLength(mediaElement)
        : undefined,

      // Dropped frames come from the element; Video.js exposes no equivalent.
      view_dropped_frame_count:
        mediaElement?.getVideoPlaybackQuality?.()?.droppedVideoFrames,

      ...readViewability(mediaElement),
    };
  };

  // Merge error tracking config with provided config
  config = { ...errorTrackingConfig, ...config };
  config.fetchStateData = () => getPlayerState();
  config.fetchPlayheadTime = () => getPlayheadTimeInMs();
  config.data = {
    ...config.data,
    player_software_name: "Video.js Player",
    player_software_version: videojsInstance.VERSION ?? "",
    player_fastpix_sdk_name: "fastpix-videojs-monitoring",
    player_fastpix_sdk_version: "1.0.3",
  };
  videoPlayer.fp = videoPlayer.fp || {};

  // Assign FP methods for dispatching events and handling player destruction
  videoPlayer.fp = {
    dispatch: (eventName: string, eventData: any) =>
      fastpixMetrix.dispatch(playerToken, eventName, eventData),
    destroy: () => {
      browserEvents.forEach((each) => videoPlayer.off(each, false));
      detachAdTracking();
      fastpixMetrix.dispatch(playerToken, "destroy", {});
      isPlayerReady = false;
      isEventHandled = false;
      playerToken = "";
    },
  };

  // Attached unconditionally. A player with no ad plugin never raises these
  // events, so there is no plugin to detect and nothing to report.
  const detachAdTracking = attachAdTracking(
    videoPlayer as any,
    fastpixMetrix.utilityMethods as any,
  );
  playerToken = fastpixMetrix.utilityMethods.buildUUID();
  fastpixMetrix.configure(playerToken, config);
  let isPlayerReady = false;
  let dispatchPlayerReady = function () {
    if (!isPlayerReady) {
      videoPlayer.fp.dispatch("playerReady", {});
      isPlayerReady = true;
    }
  };

  videoPlayer.ready(function () {
    videoPlayer.addClass("fpvjs");
    setTimeout(dispatchPlayerReady, 0);
  });

  videoPlayer.one("play", dispatchPlayerReady);

  // A new source is a new view, and picture-in-picture use belongs to the view
  // that saw it. The element and its listeners survive the source change, so
  // only the latch is cleared.
  videoPlayer.on("loadstart", () => {
    usedPip = false;
  });

  let isEventHandled = false;
  browserEvents.forEach((eventName) => {
    if (eventName !== "error" || errorTrackingConfig?.automaticErrorTracking) {
      videoPlayer.on(eventName, () => {
        if (!isEventHandled) {
          let eventAttributes: Record<string, any> = {};

          // Handle error events
          if (eventName === "error") {
            const errorDetails = videoPlayer.error();

            if (errorDetails && errorDetails.code !== 1) {
              eventAttributes = {
                player_error_code: errorDetails.code,
                player_error_message: errorDetails.message,
                player_error_context: errorDetails.status,
              };
            }
          }

          videoPlayer.fp.dispatch(eventName, eventAttributes);
        }
      });
    }
  });

  if (videoPlayer) {
    videoPlayer.on("dispose", function () {
      if (videoPlayer.fp) {
        videoPlayer.fp.destroy();
        delete (videoPlayer as any)?.fp;
      }
    });
  }

  function handleChunkRequest(
    req: {
      readyState?: any;
      responseURL?: any;
      responseType?: string;
      response?: any;
      status?: any;
      getAllResponseHeaders?: any;
      onreadystatechange?: Function | null;
      byteLength?: number;
      responseText?: string | any[];
    },
    event: number,
  ) {
    return function () {
      const readyState = req.readyState;

      if (readyState >= 2) {
        const requestEventStartTime =
          (req as any)?.requestTime ?? fastpixMetrix.utilityMethods.now();
        if (readyState !== 4) {
          return;
        }
        const hostname = fastpixMetrix.utilityMethods.fetchHost(
          req.responseURL,
        );
        const bytesLoaded =
          "arraybuffer" === req.responseType
            ? req.response.byteLength
            : (req as any)?.responseText.length;
        const requestResponseEnd = fastpixMetrix.utilityMethods.now();
        const responseHeaders = req.getAllResponseHeaders();
        const filteredHeaders = filterHeadersByAllowedList(responseHeaders);

        // Check for a successful response
        if (req.status >= 200 && req.status < 300) {
          const requestAttributes = {
            request_start: event,
            request_bytes_loaded: bytesLoaded,
            request_hostname: hostname,
            request_url: req.responseURL,
            request_response_headers: filteredHeaders,
            request_type: getContentTypeKey(filteredHeaders),
            request_response_start: requestEventStartTime,
            request_response_end: requestResponseEnd,
          };

          if (bytesLoaded > 0) {
            dispatchRequestCompleted(requestAttributes);
          }
        } else {
          const failedRequestAttributes = {
            request_hostname: hostname,
            request_url: req.responseURL,
            request_type: getContentTypeKey(filteredHeaders),
          };

          dispatchRequestFailed(failedRequestAttributes);
        }
      }
    };
  }

  function dispatchRequestCompleted(attributes: {
    request_start: number;
    request_response_start: number;
    request_response_end: number;
    request_bytes_loaded: number;
    request_hostname: string;
    request_url: string;
    request_response_headers: Record<string, string>;
    request_type: string;
  }) {
    videoPlayer.fp.dispatch("requestCompleted", attributes);
  }

  function dispatchRequestFailed(attributes: {
    request_hostname: string;
    request_url: string;
    request_type: string;
  }) {
    videoPlayer.fp?.dispatch("requestFailed", attributes);
  }

  function handleOnRequestStateChange(
    request: Request,
    restoreScriptTime: number,
    callbackReq: () => void,
  ) {
    return () => {
      try {
        handleChunkRequest(request, restoreScriptTime)();
      } catch {
        /* intentionally empty */
      }

      try {
        callbackReq();
      } catch {
        /* intentionally empty */
      }
    };
  }

  function createCallback(success: (request: Request) => void) {
    return (request: Request) => {
      const restoreScriptTime = fastpixMetrix.utilityMethods.now();

      try {
        success(request);
      } catch {
        /* intentionally empty */
      }

      try {
        request.onreadystatechange = handleOnRequestStateChange(
          request,
          restoreScriptTime,
          (request.onreadystatechange as () => void) ||
            defaultOnReadyStateChange,
        );
      } catch {
        /* intentionally empty */
      }
    };
  }

  function execute(_ctx: any, settings: any): void {
    function setRequestSettings() {
      if (typeof settings.onRequest === "function") {
        settings.onRequest((s: { beforeSend: (request: Request) => void }) => {
          s.beforeSend = createCallback(
            s.beforeSend ?? defaultOnReadyStateChange,
          );
          return s;
        });
      } else {
        settings.beforeRequest = createBeforeRequestCallback(
          settings.beforeRequest,
        );
      }
    }

    setRequestSettings();
  }

  function createBeforeRequestCallback(
    beforeRequest: (value: unknown) => unknown = (child: unknown) => child,
  ) {
    return (value: unknown) => {
      const iterator = beforeRequest(value);
      if (iterator) {
        (iterator as { beforeSend?: (request: Request) => void }).beforeSend =
          createCallback(
            (iterator as { beforeSend?: (request: Request) => void })
              .beforeSend ?? defaultOnReadyStateChange,
          );
      }
      return iterator ?? value;
    };
  }

  // A CODECS attribute lists the variant's codecs together, video first by
  // convention but not by rule, so each entry is classified by its own prefix
  // rather than by position. An unrecognised prefix is left out rather than
  // guessed at: a codec reported in the wrong field is worse than an absent one.
  const VIDEO_CODEC_PREFIXES = [
    "avc1",
    "avc3",
    "hev1",
    "hvc1",
    "av01",
    "vp08",
    "vp09",
    "vp8",
    "vp9",
  ];
  const AUDIO_CODEC_PREFIXES = [
    "mp4a",
    "ac-3",
    "ec-3",
    "opus",
    "alac",
    "flac",
    "vorbis",
  ];

  function splitCodecs(codecs?: string): {
    video?: string;
    audio?: string;
  } {
    if (!codecs) return {};

    const result: { video?: string; audio?: string } = {};

    for (const codec of codecs.split(",")) {
      const trimmed = codec.trim();
      if (!trimmed) continue;

      const lower = trimmed.toLowerCase();
      if (VIDEO_CODEC_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
        result.video = result.video ?? trimmed;
      } else if (
        AUDIO_CODEC_PREFIXES.some((prefix) => lower.startsWith(prefix))
      ) {
        result.audio = result.audio ?? trimmed;
      }
    }

    return result;
  }

  // Handles the variant change in the video player by reporting the rendition
  // the tech has selected.
  let handleVariantChanged = function (options: any) {
    let previousAttributes: Record<string, any> | undefined;

    // Retrieve the segment-metadata track from the video player options
    const getSegmentMetadataTrack = (options: any) => {
      let findTracks;
      const textTracks = options.textTracks();
      let i = 0;
      for (; i < textTracks.length; i++) {
        if ("segment-metadata" === textTracks[i].label) {
          findTracks = textTracks[i];
        }
      }
      return findTracks;
    };
    const segmentMetadataTrack = getSegmentMetadataTrack(options);

    if (segmentMetadataTrack?.on) {
      segmentMetadataTrack.on("cuechange", () => {
        try {
          const hlsTech = options.tech({ IWillNotUseThisInPlugins: true });
          // Every field below is read off the one playlist object the tech
          // reports as active, in a single pass, so one beacon can never pair
          // one rendition's bitrate with another's resolution.
          const attributes = (hlsTech.vhs ?? hlsTech.hls).playlists.media()
            ?.attributes;

          if (!attributes) return;

          const codecs = splitCodecs(attributes.CODECS);
          const resolution = attributes.RESOLUTION;

          const currentAttributes = {
            // HLS BANDWIDTH describes the whole variant, audio included.
            // Adding an audio rate to it would count that audio twice.
            video_source_bitrate: attributes.BANDWIDTH,
            video_source_codec: codecs.video,
            video_source_fps: attributes["FRAME-RATE"],
            video_source_width: resolution?.width,
            video_source_height: resolution?.height,
            video_source_audio_codec: codecs.audio,
            // HLS carries no BANDWIDTH on EXT-X-MEDIA, so an audio rendition
            // group declares no rate of its own and the tech has none to
            // report. Left absent rather than derived from the variant rate.
            video_source_audio_bitrate: undefined,
            // VIDEO-RANGE uses the same vocabulary the core expects, so it is
            // passed through unmapped.
            video_source_dynamic_range_type: attributes["VIDEO-RANGE"],
            video_source_rendition_name:
              fastpixMetrix.utilityMethods.buildRenditionName(
                resolution?.width,
                resolution?.height,
                attributes["VIDEO-RANGE"],
              ),
          };

          // Compared whole rather than by bitrate alone: two renditions can
          // declare the same BANDWIDTH at different resolutions, and that
          // switch is a real one.
          if (
            JSON.stringify(currentAttributes) ===
            JSON.stringify(previousAttributes)
          ) {
            return;
          }

          previousAttributes = currentAttributes;
          videoPlayer.fp.dispatch("variantChanged", currentAttributes);
        } catch {}
      });
    }
  };
  let htmlInstance = videojsInstance.getTech("Html5")?.sourceHandlers;
  let requestHandler = videojsInstance.Vhs ?? videojsInstance.Hls;

  function processRequest(
    requestHandler: RequestHandler | undefined,
    opt: any,
  ): void {
    if (requestHandler?.xhr) {
      execute(() => videojsInstance(opt.el()), requestHandler.xhr);
    }
  }

  function handleSourceLoading(index: number): void {
    const videoInstance = htmlInstance[index];
    const originalHandleSource = videoInstance.handleSource;

    videoInstance.handleSource = function (
      deepDataAndEvents: any,
      opt: any,
      argv: any = {},
    ): any {
      processRequest(requestHandler, opt);
      const options = originalHandleSource(deepDataAndEvents, opt, argv);

      if (options && typeof options.xhr === "function") {
        try {
          const [mode, digit] = videojsInstance.VERSION.split(".");
          const playerId =
            mode >= 7 && digit >= 4
              ? options.player().id()
              : options.player_.el_.parentNode.id;
          handleVariantChanged(videojsInstance(playerId));
        } catch {}
      }

      return options;
    };
  }

  htmlInstance.length &&
    htmlInstance.forEach((_: any, index: number) => handleSourceLoading(index));

  return {
    dispatch: videoPlayer.fp.dispatch,
  };
};

initVideoJsTracking.utilityMethods = fastpixMetrix.utilityMethods;

export default initVideoJsTracking;

if (globalThis.window !== undefined) {
  (globalThis.window as any).initVideoJsTracking = initVideoJsTracking;
}
