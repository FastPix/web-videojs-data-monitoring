// Video.js has no advertisement concept of its own: a player with no ad plugin
// has no ads, and different plugins model them differently. This module tracks
// against videojs-contrib-ads, the shared ad state layer that videojs-ima and
// most other plugins build on, so one integration covers the ecosystem rather
// than a single plugin.
//
// contrib-ads carries the lifecycle but no metadata about the advertisement
// itself. Where videojs-ima is present its IMA ad object is read for identity,
// duration and position; where it is not, those fields are absent and the
// lifecycle is still reported.

type AdDispatcher = {
  fp: { dispatch: (eventName: string, eventData: any) => any };
  on: (event: string, callback: (event?: any) => void) => void;
  off?: (event: string, callback: (event?: any) => void) => void;
  ima?: {
    getAdsManager?: () => {
      getCurrentAd?: () => ImaAd | undefined;
    };
    // The integrator gives the ad tag to the IMA plugin rather than to the
    // monitor, so the plugin's own settings are the only place it exists at
    // runtime. Read defensively: a rename costs the tag hostname and nothing
    // else.
    settings?: { adTagUrl?: string };
    controller?: { settings?: { adTagUrl?: string } };
  };
};

type ImaAdPodInfo = {
  getAdPosition?: () => number;
  getTotalAds?: () => number;
  getPodIndex?: () => number;
  getTimeOffset?: () => number;
};

type ImaAd = {
  getAdId?: () => string;
  getCreativeId?: () => string;
  getAdvertiserName?: () => string;
  getDuration?: () => number;
  getMediaUrl?: () => string;
  getSkipTimeOffset?: () => number;
  getAdPodInfo?: () => ImaAdPodInfo | undefined;
};

type UtilityMethods = {
  convertSecToMs: (seconds: number) => number;
  fetchHost: (url: string) => string | undefined;
};

// IMA reports a preroll as pod index 0 and a postroll as a negative offset,
// which is a sentinel rather than a position - a postroll is not at second
// minus one.
function describeBreakPosition(timeOffset?: number): string {
  if (timeOffset === undefined || timeOffset === 0) {
    return "preroll";
  }

  return timeOffset < 0 ? "postroll" : "midroll";
}

// Only a real, non-negative offset belongs on the content timeline. The
// postroll sentinel is dropped rather than reported as a negative time.
function describeTimeOffset(
  utilityMethods: UtilityMethods,
  timeOffset?: number,
): number | undefined {
  if (timeOffset === undefined || timeOffset < 0) {
    return undefined;
  }

  return utilityMethods.convertSecToMs(timeOffset);
}

function toMilliseconds(
  utilityMethods: UtilityMethods,
  seconds?: number,
): number | undefined {
  if (
    typeof seconds !== "number" ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return undefined;
  }

  return utilityMethods.convertSecToMs(seconds);
}

// IMA returns "" rather than null for metadata an ad does not carry. Passed
// through as-is those would send empty strings for fields that are simply not
// knowable, which reads downstream as "measured and blank" rather than
// "not reported".
function orAbsent(value?: string | null): string | undefined {
  return value || undefined;
}

// Every handler runs inside this. A plugin state the adapter did not
// anticipate costs the ad fields for that event and nothing else - content
// metrics, and the rest of the break, carry on.
function guard(handler: (event?: any) => void): (event?: any) => void {
  return (event?: any) => {
    try {
      handler(event);
    } catch {
      // Deliberately silent. An ad payload the adapter cannot read is not
      // worth interrupting playback monitoring over.
    }
  };
}

export function attachAdTracking(
  player: AdDispatcher,
  utilityMethods: UtilityMethods,
): () => void {
  // Ads are opt-in. A player with no ad plugin never fires these events, which
  // is the ordinary case rather than a failure, so nothing here needs to
  // detect the plugin's presence up front.
  let openBreakId: string | undefined;
  let openBreakDuration: number | undefined;
  let breakSequence = 0;
  let contentHasPlayed = false;
  // contrib-ads announces a postroll before it holds back the content's own
  // ended event, so this is the only signal that a break opening now sits
  // after the content rather than inside it.
  let contentEnded = false;

  // A retried advertisement is one attempt and one failure, not one of each
  // per retry, so a failure is counted against the ad that raised it once.
  const failedAds = new Set<string>();

  // contrib-ads raises adstart more than once for a single advertisement -
  // its own state machine and the IMA integration each announce the start.
  // Reporting both would count one ad as two attempts and two impressions, so
  // the ad in flight is tracked and only its first start is reported.
  let reportedAdKey: string | undefined;

  function readCurrentAd(): ImaAd | undefined {
    return player.ima?.getAdsManager?.()?.getCurrentAd?.();
  }

  function readAdTagUrl(): string | undefined {
    return (
      player.ima?.settings?.adTagUrl ??
      player.ima?.controller?.settings?.adTagUrl
    );
  }

  function closeOpenBreak() {
    if (openBreakId === undefined) return;

    player.fp.dispatch("adbreakend", {
      view_ad_duration: openBreakDuration,
    });
    openBreakId = undefined;
    openBreakDuration = undefined;
    failedAds.clear();
  }

  // The identity a break would have, derived from the pod the advertisement
  // belongs to. Absent without IMA, where there is no pod to compare against.
  function describeBreakId(podInfo?: ImaAdPodInfo): string | undefined {
    const podIndex = podInfo?.getPodIndex?.();
    if (podIndex === undefined) return undefined;

    return `pod-${podIndex}-at-${podInfo?.getTimeOffset?.() ?? 0}`;
  }

  function openBreak(ad?: ImaAd) {
    const podInfo = ad?.getAdPodInfo?.();
    const timeOffset = podInfo?.getTimeOffset?.();
    const totalAds = podInfo?.getTotalAds?.();
    const adDuration = ad?.getDuration?.();

    // contrib-ads exposes no break identifier of its own, and without IMA
    // there is no pod index either, so a sequence number stands in. It is
    // unique within the view, which is what the identifier is for.
    breakSequence += 1;
    openBreakId = describeBreakId(podInfo) ?? `break-${breakSequence}`;

    // The break's length, not this ad's. Neither plugin declares it, so a pod
    // is estimated from one ad times the pod size. Absent when either is
    // unknown, rather than reporting a single ad's length as the whole break.
    openBreakDuration =
      typeof totalAds === "number" && totalAds > 0
        ? toMilliseconds(utilityMethods, (adDuration ?? 0) * totalAds)
        : toMilliseconds(utilityMethods, adDuration);

    const mediaUrl = ad?.getMediaUrl?.();

    // Classified against the content rather than the manifest's ordering: a
    // break with no content before it is a preroll however it was scheduled.
    // Without IMA there is no declared offset, so what has actually played
    // decides.
    let breakPosition: string;

    if (timeOffset !== undefined) {
      breakPosition = describeBreakPosition(timeOffset);
    } else if (contentEnded) {
      breakPosition = "postroll";
    } else {
      breakPosition = contentHasPlayed ? "midroll" : "preroll";
    }

    player.fp.dispatch("adbreakstart", {
      view_ad_break_id: openBreakId,
      view_ad_break_position: breakPosition,
      view_ad_duration: openBreakDuration,
      view_ad_time_offset: describeTimeOffset(utilityMethods, timeOffset),
      view_ad_asset_hostname: mediaUrl
        ? utilityMethods.fetchHost(mediaUrl)
        : undefined,
    });
  }

  function reportAd(ad?: ImaAd) {
    const podInfo = ad?.getAdPodInfo?.();
    const adId = orAbsent(ad?.getAdId?.());
    const creativeId = orAbsent(ad?.getCreativeId?.());
    const advertiser = orAbsent(ad?.getAdvertiserName?.());
    const skipOffset = ad?.getSkipTimeOffset?.();

    // adplay, not an impression. contrib-ads raises adstart when the ad is
    // attached and begins; nothing is known to have rendered yet, and an ad
    // left paused on its first frame reaches here identically. The impression
    // is derived in the core, from playback actually being reported.
    player.fp.dispatch("adplay", {
      view_ad_break_id: openBreakId,
      view_ad_asset_id: adId,
      // One-based within the pod, which is the order the ads were served in.
      view_ad_asset_index: podInfo?.getAdPosition?.(),
      view_ad_asset_url: ad?.getMediaUrl?.() ?? undefined,
      view_ad_asset_duration: toMilliseconds(
        utilityMethods,
        ad?.getDuration?.(),
      ),

      // IMA parses the VAST response itself, so these arrive without the
      // integrator dispatching anything. A contrib-ads integration with no
      // VAST behind it cannot populate them.
      view_ad_id: adId,
      view_ad_creative_id: creativeId,
      view_ad_advertiser_name: advertiser,
      // A negative offset means the ad is not skippable; it is not a time.
      view_ad_skip_time_offset:
        typeof skipOffset === "number" && skipOffset >= 0
          ? toMilliseconds(utilityMethods, skipOffset)
          : undefined,
    });
  }

  const handlers: Record<string, (event?: any) => void> = {
    // contrib-ads raises adstart once per advertisement, so a break of three
    // raises it three times. The break is opened on the first and left open
    // for the rest, which is what keeps the break count following pods rather
    // than ads.
    adstart: guard(() => {
      const ad = readCurrentAd();
      const podInfo = ad?.getAdPodInfo?.();
      // Identifies the advertisement rather than the event. Falls back to the
      // position in the pod where IMA is absent, which still separates one ad
      // in a break from the next.
      const adKey =
        orAbsent(ad?.getAdId?.()) ?? `index-${podInfo?.getAdPosition?.() ?? 0}`;

      if (adKey === reportedAdKey) return;

      reportedAdKey = adKey;

      // An ad whose pod differs from the open break's belongs to a new break,
      // whether or not the previous one was closed. Relying on the close alone
      // folds a later break into the earlier one and reports it under the
      // earlier one's identity and position - a midroll arriving as a preroll.
      const candidateId = describeBreakId(podInfo);

      if (
        openBreakId !== undefined &&
        candidateId !== undefined &&
        candidateId !== openBreakId
      ) {
        closeOpenBreak();
      }

      if (openBreakId === undefined) {
        openBreak(ad);
      }

      reportAd(ad);
    }),

    // Ends the advertisement, not the break: contrib-ads raises this per ad,
    // and the break stays open until content resumes or the pod completes.
    adend: guard(() => {
      reportedAdKey = undefined;
      player.fp.dispatch("adended", { view_ad_break_id: openBreakId });
    }),

    // An ad the viewer skipped still ended, and still played whatever ran
    // before the skip. Counting it as completed would overstate completion,
    // so it closes the ad without being one.
    "ads-ad-skipped": guard(() => {
      player.fp.dispatch("adended", { view_ad_break_id: openBreakId });
    }),

    // No impression is dispatched here. The core already counts one from
    // playback being reported, and raising a second signal for the same
    // rendered advertisement counts it twice.
    // The pod boundary where the plugin reports one. contrib-ads alone does
    // not, so contentplayback below is the fallback.
    "ads-pod-ended": guard(() => {
      closeOpenBreak();
    }),

    "ads-allpods-completed": guard(() => {
      closeOpenBreak();
    }),

    // contrib-ads returns to content here, which is the only break boundary
    // available when no pod events arrive.
    contentplayback: guard(() => {
      closeOpenBreak();
    }),

    contentresumed: guard(() => {
      closeOpenBreak();
    }),

    // A postroll has no content to resume, so contentplayback never arrives to
    // close its break. contrib-ads holds the content's ended event back until
    // the postroll finishes and then re-emits it, which makes ended the only
    // boundary that always arrives - for the break before it, and for the
    // postroll's own break afterwards.
    ended: guard(() => {
      closeOpenBreak();
    }),

    // Raised before the content's ended is released, so a break opening after
    // this point is a postroll however the plugin ordered it.
    readyforpostroll: guard(() => {
      contentEnded = true;
    }),

    // A new source is a new view, and every value below describes the view
    // rather than the session. Without this a second video inherits the first
    // one's ended state and reports its preroll as a postroll.
    loadstart: guard(() => {
      closeOpenBreak();
      contentHasPlayed = false;
      contentEnded = false;
      reportedAdKey = undefined;
    }),

    // A timeout inside a break is that break's failure. A timeout before any
    // break opened is not: nothing was reached to fail, and reporting it marks
    // whichever break opens next as having errored - a clean midroll inheriting
    // a preroll that never filled. That case is already described by the
    // preroll being requested and not played, so it is left to those fields.
    adtimeout: guard(() => {
      if (openBreakId === undefined) return;

      player.fp.dispatch("aderror", {
        view_ad_break_id: openBreakId,
        view_ad_error_source: "videojs-contrib-ads",
        view_ad_error_message: "Ad request timed out",
      });
      closeOpenBreak();
    }),

    adserror: guard((event?: any) => {
      const ad = readCurrentAd();
      const adId = orAbsent(ad?.getAdId?.());

      // One failure per advertisement however many times the plugin retries
      // it. An error with no identifiable ad behind it is always counted,
      // since there is nothing to deduplicate it against.
      if (adId !== undefined) {
        if (failedAds.has(adId)) return;
        failedAds.add(adId);
      }

      const detail = event?.data?.AdError ?? event?.originalEvent ?? event;
      const errorCode = detail?.getErrorCode?.() ?? detail?.errorCode;

      // A break whose advertisement failed before it rendered still happened,
      // and the core settles the error counts when a break closes. Without a
      // break to settle into they are either lost or land on whichever break
      // opens next - a clean one inheriting an earlier failure. Opening one
      // here is also what makes a startup error reachable at all: the core
      // counts those only for a break that closed without an impression.
      const openedForError = openBreakId === undefined;

      if (openedForError) {
        openBreak(ad);
      }

      player.fp.dispatch("aderror", {
        view_ad_break_id: openBreakId,
        view_ad_asset_id: adId,
        view_ad_error_source: player.ima ? "google-ima" : "videojs-contrib-ads",
        view_ad_error_message:
          detail?.getMessage?.() ?? detail?.message ?? detail?.errorMessage,
        view_ad_error_code:
          errorCode === undefined || errorCode === null
            ? undefined
            : String(errorCode),
      });

      // Settled immediately. The break never played, so nothing else will
      // close it, and leaving it open would swallow the next break.
      if (openedForError) {
        closeOpenBreak();
      }
    }),

    adsready: guard(() => {
      player.fp.dispatch("adrequest", {});
    }),

    // A preroll is scheduled and known before playback reaches it, so it can
    // be reported as requested even where it never fills - which is what makes
    // the played field a fill rate rather than a restatement of the request.
    readyforpreroll: guard(() => {
      player.fp.dispatch("prerollScheduled", {});

      // Separate from the one above: scheduled says a preroll exists, and this
      // says it was asked for. The core stamps the request time from this and
      // derives the tag host - the server that decided which advertisement to
      // serve - from the tag URL, which is distinct from the host the
      // creative's media comes from.
      player.fp.dispatch("prerollRequested", {
        view_ad_tag_url: readAdTagUrl(),
      });
    }),

    // Content playing is what makes a later break a midroll rather than a
    // preroll. Tracked here because contrib-ads alone declares no offset.
    playing: guard(() => {
      if (openBreakId === undefined) {
        contentHasPlayed = true;
      }
    }),
  };

  Object.entries(handlers).forEach(([eventName, handler]) => {
    player.on(eventName, handler);
  });

  return () => {
    Object.entries(handlers).forEach(([eventName, handler]) => {
      player.off?.(eventName, handler);
    });
    // A view ending mid-break would otherwise leave the core's ad flag set,
    // and the break's counters and timings would be discarded rather than
    // reported.
    closeOpenBreak();
  };
}
