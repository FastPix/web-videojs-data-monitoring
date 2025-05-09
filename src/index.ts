import fastpixMetrix from "@fastpix/video-data-core";

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

const initVideoJsTracking = (videoPlayer: VideoPlayer, config: Config) => {
  const videojsInstance = config?.videojs || (window as any)?.videojs;
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

  const determinePreloadType = function (data: string): boolean {
    return ["auto", "metadata"].includes(data);
  };

  const getPlayerState = () => {
    if (!videoPlayer || videoPlayer?.isDisposed()) return {};
    const videoPlayerEl = videoPlayer.el();
    const computedStyle = window?.getComputedStyle(videoPlayerEl);
    const duration = videoPlayer.duration();
    const playerWidth = computedStyle
      ? parseInt(computedStyle.width, 10)
      : videoPlayer.width();
    const playerHeight = computedStyle
      ? parseInt(computedStyle.height, 10)
      : videoPlayer.height();
    let videoHeight = videoPlayer?.videoHeight();
    let videoWidth = videoPlayer?.videoWidth();

    if (videoHeight === undefined || videoWidth === undefined) {
      const videoElement = videoPlayer.el().firstChild;
      if (videoElement && videoElement.nodeName.toUpperCase() === "VIDEO") {
        videoHeight = (videoElement as HTMLVideoElement).videoHeight;
        videoWidth = (videoElement as HTMLVideoElement).videoWidth;
      }
    }

    return {
      player_is_paused: videoPlayer.paused(),
      player_is_fullscreen: videoPlayer.isFullscreen() ?? false,
      player_autoplay_on: videoPlayer.autoplay() ?? false,
      player_width: playerWidth,
      player_height: playerHeight,
      player_language_code: videoPlayer.language() ?? "",
      player_preload_on: determinePreloadType(videoPlayer.preload()),
      video_poster_url: videoPlayer.poster(),
      video_source_url: videoPlayer.currentSrc(),
      video_source_mime_type: videoPlayer.currentType().toLowerCase(),
      video_source_duration: duration ? Math.floor(duration * 1000) : null,
      video_source_is_live: duration === Infinity,
      video_source_height: videoHeight,
      video_source_width: videoWidth,
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
    player_fastpix_sdk_version: "1.0.2",
  };
  videoPlayer.fp = videoPlayer.fp || {};

  // Assign FP methods for dispatching events and handling player destruction
  videoPlayer.fp = {
    dispatch: (eventName: string, eventData: any) =>
      fastpixMetrix.dispatch(playerToken, eventName, eventData),
    destroy: () => {
      browserEvents.forEach((each) => videoPlayer.off(each, false));
      fastpixMetrix.dispatch(playerToken, "destroy", {});
      isPlayerReady = false;
      isEventHandled = false;
      playerToken = "";
    },
  };
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
    function getFilteredResponseHeaders(headers: string) {
      return filterHeadersByAllowedList(headers);
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
        const filteredHeaders = getFilteredResponseHeaders(responseHeaders);

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

  function execute(_ctx: any, settings: any): void {
    function defaultOnReadyStateChange() {}

    function createCallback(success: Function) {
      return (request: Request) => {
        const restoreScriptTime = fastpixMetrix.utilityMethods.now();

        try {
          success(request);
        } catch {}

        try {
          request.onreadystatechange = handleOnRequestStateChange(
            request,
            restoreScriptTime,
            request.onreadystatechange || defaultOnReadyStateChange,
          );
        } catch {}
      };
    }

    function handleOnRequestStateChange(
      request: Request,
      restoreScriptTime: number,
      callbackReq: Function,
    ) {
      return () => {
        try {
          handleChunkRequest(request, restoreScriptTime)();
        } catch {}

        try {
          callbackReq();
        } catch {}
      };
    }

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

    function createBeforeRequestCallback(
      beforeRequest: Function = (child: any) => child,
    ) {
      return (value: any) => {
        const iterator = beforeRequest(value);
        if (iterator) {
          iterator.beforeSend = createCallback(
            iterator.beforeSend ?? defaultOnReadyStateChange,
          );
        }
        return iterator ?? value;
      };
    }

    setRequestSettings();
  }

  // Handles the variant change in the video player by tracking the current bandwidth.
  let handleVariantChanged = function (options: any) {
    let lastBandwidth: number | undefined;

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
          const currentBandwidth = (
            hlsTech.vhs ?? hlsTech.hls
          ).playlists.media().attributes.BANDWIDTH;

          if (lastBandwidth !== currentBandwidth) {
            videoPlayer.fp.dispatch("variantChanged", {
              video_source_bitrate: currentBandwidth,
            });
          }

          lastBandwidth = currentBandwidth;
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

if (typeof window !== "undefined") {
  (window as any).initVideoJsTracking = initVideoJsTracking;
}
