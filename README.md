# Real-time analytics for Video.js

[![npm version](https://img.shields.io/npm/v/@fastpix/videojs-monitor)](https://www.npmjs.com/package/@fastpix/videojs-monitor)
[![npm downloads](https://img.shields.io/npm/dm/@fastpix/videojs-monitor)](https://www.npmjs.com/package/@fastpix/videojs-monitor)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@fastpix/videojs-monitor)](https://bundlephobia.com/package/@fastpix/videojs-monitor)
[![License](https://img.shields.io/github/license/FastPix/web-videojs-data-monitoring)](./LICENSE)
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)

The FastPix Video.js Monitoring SDK automatically collects playback metrics such as startup time, buffering, bitrate changes, playback errors, viewer engagement, and Quality of Experience (QoE). These metrics are sent to the [FastPix dashboard](https://dashboard.fastpix.com) where you can monitor playback health and analyze viewer behavior.

The SDK integrates directly with any Video.js player and requires only a few lines of code to start collecting analytics.

**Works with:** Video.js · JavaScript (any framework)

📖 **Docs:** https://fastpix.com/docs/video-data/monitors/videojs &nbsp;·&nbsp; 🚀 **Free account:** https://dashboard.fastpix.com

<br />

## Why FastPix?

- **Automatic instrumentation** - one integration call, no manual event wiring.
- **Playback quality monitoring** - real-time bitrate, buffering, startup performance, render quality and playback failures.
- **Error management** - detailed error reports to find and fix playback failures quickly.
- **Customizable tracking** - flexible configuration to match your monitoring needs.
- **Centralized dashboard** - visualize and compare metrics on the FastPix dashboard to make data-driven decisions.

<br />

## What you can track with Video.js analytics

- Viewer engagement and watch behavior
- Startup performance and video-start time
- Rebuffering and buffering events
- Bitrate and adaptive-bitrate changes
- Render quality
- Playback failures and error codes
- Custom metadata (`custom_1` to `custom_10`)
- Privacy controls: cookie-free tracking and Do Not Track

<br />

## Before you begin

Before integrating the SDK, make sure you have:

- Node.js 18 or later.
- npm (included with Node.js).
- A FastPix account.
- A FastPix [Workspace Key](https://fastpix.com/docs/getting-started/set-up-a-workspace#creating-new-workspace).
- A Video.js player or a new JavaScript project.

If you already have a Video.js application, skip to **Install the SDK**.

If you're creating a new project, follow the steps below.

> **NOTE:** \
> This SDK is distributed as an npm package and uses ES modules. Your application must support ES module imports. If you're creating a new project, use a JavaScript build tool or framework such as Vite, Webpack, Parcel, React, Vue, or Angular.

<br />

### Create a project

Create a new directory for your project and initialize a Node.js project.

```bash
mkdir videojs-demo
cd videojs-demo

npm init -y
```

The `npm init -y` command creates a `package.json` file. This file stores your project's metadata, dependencies, and npm scripts.

Your project should now look like this:

```text
videojs-demo/
└── package.json
```

<br />

### Install the dependencies

Install **Video.js** and the **FastPix Video.js Monitoring SDK.**

```bash
npm install video.js
npm install @fastpix/videojs-monitor
npm install --save-dev vite
```

These packages serve different purposes:

- `video.js` provides the video player.
- `@fastpix/videojs-monitor` collects playback analytics from the Video.js player and sends them to the FastPix dashboard.
- `vite` provides a local development server for running the application.

After the installation completes, your project should contain:

```text
videojs-demo/
├── node_modules/
├── package-lock.json
└── package.json
```

<br />

### Create a Video.js player

Create an `index.html` file and add a Video.js player.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Video.js Demo</title>

  <link
    href="https://vjs.zencdn.net/8.23.4/video-js.css"
    rel="stylesheet"
  />
</head>

<body>

<video
  id="video-player"
  class="video-js"
  controls
  width="800"
  height="450"
>
  <source
    src="http://content.jwplatform.com/manifests/vM7nH0Kl.m3u8"
    type="video/mp4"
  />
</video>

<script type="module" src="/main.js"></script>

</body>
</html>
```

The FastPix SDK monitors an existing Video.js player. It does not create or initialize the player.

Create a `main.js` file in your project root. You'll initialize the Video.js player and integrate the FastPix SDK in the next section.

The `main.js` file is the application's JavaScript entry point. You'll initialize the Video.js player and integrate the FastPix SDK in this file.

```text
videojs-demo/
├── index.html
├── main.js
├── node_modules/
├── package-lock.json
└── package.json
```
<br />


## Monitor Video.js playback

Import the SDK:

```javascript
import initVideoJsTracking from "@fastpix/videojs-monitor";
```

The [`workspace_id`](https://fastpix.com/docs/getting-started/set-up-a-workspace#creating-new-workspace) is a mandatory field that must be provided. Install the `video.js` package and attach it to your HTML5 video element, then pass the `videojs` function (imported from the video.js library) along with your custom metadata to the `initVideoJsTracking` function. Tracking begins once the player loads the URL and starts playback.

```javascript
// Import the Video.js library for video streaming
import videojs from 'video.js';
import initVideoJsTracking from '@fastpix/videojs-monitor';

// Reference to the video element
const videoPlayerElement = document.getElementById('video-player');

// Record the player initialization time
const initializationTime = initVideoJsTracking.utilityMethods.now();

// Create a new Video.js instance for the player
const videojsInstance = videojs(videoPlayerElement);

// Custom metadata for tracking purposes
const trackingData = {
  workspace_id: 'WORKSPACE_KEY',        // Your Workspace Key (create one: https://fastpix.com/docs/getting-started/set-up-a-workspace#creating-new-workspace)
  player_name: 'PLAYER_NAME',    // A custom name or identifier for this video player instance
  player_init_time: initializationTime, // Timestamp of when the player was initialized (useful for performance tracking)
  video_title: 'VIDEO_TITLE',          // Title of the video being played for analytics
  video_id: 'VIDEO_ID',                // Unique identifier for the video
  viewer_id: 'VIEWER_ID',              // Unique identifier for the viewer

  // Add any additional metadata if needed
};

// Initialize video.js tracking with custom configuration
initVideoJsTracking(videojsInstance, {
  debug: false,       // Set to true to enable debug logs in the console
  videojs: videojs,   // Pass the imported videojs function
  data: trackingData, // Attach custom metadata for analytics and tracking
});

// Call this method to stop the monitoring.
// videojsInstance.fp.destroy();
```

**Where these values come from:** only `workspace_id` comes from FastPix - it's your [Workspace Key](https://fastpix.com/docs/getting-started/set-up-a-workspace#creating-new-workspace) from the dashboard. The other fields describe your content and viewer, so populate them from your own application: `video_title` and `video_id` from your CMS or database, `viewer_id` from your auth or session layer (use an internal ID, not personal data), and `player_name` a label you choose for this player. `player_init_time` is set automatically by `initVideoJsTracking.utilityMethods.now()` - leave it as-is. If you're just trying the SDK out, any placeholder values work; they'll simply appear as-is on the dashboard.

After completing the steps above, you can track viewer metrics in the FastPix dashboard once playback ends. The sections below are optional and can be used as needed to enhance your integration.

<br />

### Verify the integration

After completing the integration, verify that the SDK is sending analytics to FastPix.

1. Start your application.

2. Play a video in the Video.js player.

3. Open your browser's Developer Tools.

4. Open the **Network** tab and verify that analytics requests return an HTTP `200` status.

5. Let the video play until playback finishes.

6. Sign in to the FastPix Dashboard.

7. Navigate to **Video Data** → **Views**.

A new playback session should appear with metrics such as watch time, playback quality, operating system, browser, and Quality of Experience (QoE).

<Image alt="FastPix Video Data dashboard showing a successful Video.js playback session" border={false} src="https://static.fastpix.com/video.js-playback-session.png" />

<br />

## Track custom metadata and video metrics

Check out the [user-passable metadata](https://fastpix.com/docs/working-with-video-data/pass-custom-metadata-to-metrics) documentation to see the metadata supported by FastPix. You can use custom metadata fields like `custom_1` to `custom_10` for your business logic, giving you the flexibility to pass any required values. Named attributes, such as `video_title` and `video_id`, can be passed directly as they are.

```javascript
// Import the Video.js library for video streaming
import videojs from 'video.js';
import initVideoJsTracking from '@fastpix/videojs-monitor';

// Reference to the video element
const videoPlayerElement = document.getElementById('video-player');

// Record the player initialization time
const initializationTime = initVideoJsTracking.utilityMethods.now();

// Create a new Video.js instance for the player
const videojsInstance = videojs(videoPlayerElement);

// Custom metadata for tracking
const trackingData = {
  workspace_id: "WORKSPACE_KEY", // Your Workspace Key (create one: https://fastpix.com/docs/getting-started/set-up-a-workspace#creating-new-workspace)
  player_name: "PLAYER_NAME", // A custom name or identifier for this video player instance
  player_init_time: initializationTime, // Timestamp of when the player was initialized (useful for tracking performance metrics)
  video_title: "VIDEO_TITLE", // Title of the video being played (replace with the actual title of your video)
  video_id: "VIDEO_ID", // A unique identifier for the video (replace with your actual video ID for tracking purposes)
  viewer_id: "user12345", // A unique identifier for the viewer (e.g., user ID, session ID, or any other unique value)
  video_content_type: "series", // Type of content being played (e.g., series, movie, etc.)
  video_stream_type: "on-demand", // Type of streaming (e.g., live, on-demand)

  // Custom fields for additional business logic
  custom_1: "", // Use this field to pass any additional data needed for your specific business logic
  custom_2: "", // Use this field to pass any additional data needed for your specific business logic

  // Add any additional metadata
};

// Initialize video.js tracking with custom configuration
initVideoJsTracking(videojsInstance, {
  debug: false,       // Set to true to enable debug logs in the console
  videojs: videojs,   // Pass the imported videojs function
  data: trackingData, // Attach custom metadata for analytics and tracking
});

// Call this method to stop the monitoring.
// videojsInstance.fp.destroy();
```

Keep metadata consistent across different video loads to make comparison easier in your analytics dashboard.

<br />

## Configure privacy, cookies and error tracking

| Attribute                | Description                                                                                                                                                                                                                                                                                                                                                  | Type    | Example Usage                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------------------------------- |
| `disableCookies`         | FastPix Data SDK uses cookies by default to track playback across page views and to identify unique viewers. If your application is not intended to collect cookies, you can disable this feature by setting `disableCookies: true`. This ensures that no cookies are set during the user's session, enhancing privacy and compliance with user preferences. | Boolean | `disableCookies: true`          |
| `respectDoNotTrack`      | Set to true to honor users' privacy preferences regarding the 'Do Not Track' setting.                                                                                                                                                                                                                                                                        | Boolean | `respectDoNotTrack: true`       |
| `automaticErrorTracking` | FastPix automatically tracks errors that occur during playback failures. To disable this feature, set `automaticErrorTracking` to false. This allows you to have more control over errors which are considered fatal and helps you manage error reporting according to your application's needs.                                                             | Boolean | `automaticErrorTracking: false` |
| `debug`                  | Set to true to enable debug logs in the console for troubleshooting purposes.                                                                                                                                                                                                                                                                                | Boolean | `debug: true`                   |

```javascript
// Import the Video.js library for video streaming
import videojs from 'video.js';
import initVideoJsTracking from '@fastpix/videojs-monitor';

// Reference to the video element
const videoPlayerElement = document.getElementById("video-player");

// Create a new Video.js instance for the player
const videojsInstance = videojs(videoPlayerElement);

const trackingData = {
  debug: true, // Set to true to enable debug logs in the console
  videojs: videojs,
  disableCookies: true, // Set to true to disable cookies for tracking sessions and unique viewers
  respectDoNotTrack: true, // Set to true to honor users' 'Do Not Track' preferences
  automaticErrorTracking: false, // Set to false to disable automatic tracking of fatal errors
  data: {
    workspace_id: "WORKSPACE_KEY", // Your Workspace Key (create one: https://fastpix.com/docs/getting-started/set-up-a-workspace#creating-new-workspace)

    // ... add other metadata as needed
  },
};

// Initialize video.js tracking with custom configuration
initVideoJsTracking(videojsInstance, trackingData);
```

<br />

## Track errors and stream changes

By default, FastPix tracks errors that occur during playback failures. You can also emit a custom error event for non-severe issues that arise outside of these failures, to provide additional context for tracking purposes.

```javascript
// Import the Video.js library for video streaming
import videojs from 'video.js';
import initVideoJsTracking from '@fastpix/videojs-monitor';

// Reference to the video element
const videoPlayerElement = document.getElementById("video-player");

// Create a new Video.js instance for the player
const videojsInstance = videojs(videoPlayerElement);

videojsInstance.fp.dispatch("error", {
	player_error_code: 1024, // Custom error code 
	player_error_message: "Description of error", // Generalized error message 
	player_error_context: "Additional context for the error", // Instance-specific information 
});
```

When your application plays multiple videos back-to-back in the same player, notify the FastPix SDK whenever a new video starts - for example with playlist content, a video series, or any other video the user plays next.

```javascript
// Import the Video.js library for video streaming
import videojs from 'video.js';
import initVideoJsTracking from '@fastpix/videojs-monitor';

// Reference to the video element
const videoPlayerElement = document.getElementById("video-player");

// Create a new Video.js instance for the player
const videojsInstance = videojs(videoPlayerElement);

videojsInstance.fp.dispatch("videoChange", {
	video_id: "abc345", // Unique identifier for the new video 
	video_title: "My Other Great Video", // Title of the new video 
	video_series: "Weekly Great Videos", // Series name if applicable 

	// Additional metadata can be included here 
});
```

<br />

## Which FastPix analytics SDK for which player

Using a different player? FastPix has an analytics SDK for each. (Only repositories confirmed to exist are linked here.)

| Player / framework | FastPix analytics SDK |
|---|---|
| Video.js | **This repo** |
| Shaka Player | [web-video-data-shakaplayer-sdk](https://github.com/FastPix/web-video-data-shakaplayer-sdk) |
| dash.js | [dash.js](https://github.com/FastPix/web-video-data-core-sdk) |
| hls.js | [hls.js](https://github.com/FastPix/web-video-data-core-sdk) |
| Android (ExoPlayer) | [android-data-exoplayer-sdk](https://github.com/FastPix/android-data-exoplayer-sdk) |
| Android (Media3) | [android-data-androidXmedia3](https://github.com/FastPix/android-data-androidXmedia3) |
| iOS (AVPlayer) | [iOS-data-avplayer-sdk](https://github.com/FastPix/iOS-data-avplayer-sdk) |

More SDKs are available in the [FastPix organization](https://github.com/orgs/FastPix/repositories).

<br />

## FAQ

**How do I track rebuffering and QoE in Video.js?**

Install `@fastpix/videojs-monitor` and pass your Video.js instance to `initVideoJsTracking` with your `workspace_id`, as shown in ["How to monitor Video.js playback"](#monitor-videojs-playback). Rebuffering, startup time, bitrate and other quality metrics are then collected automatically and shown on the FastPix dashboard.

**How do I collect playback analytics from Video.js?**

The SDK instruments the player for you. After the integration call and playback start, metrics flow to the dashboard.

**Does it work with HLS and DASH?**

Yes. It tracks playback regardless of the streaming format Video.js is playing.

**Does it work with React, Vue or other frameworks?**

Yes. It’s a JavaScript SDK, so it works with React, Vue, and other JavaScript frameworks or libraries. You can initialize it wherever you create your Video.js instance.

**Does it support TypeScript?**

The SDK is written in TypeScript. The published package currently ships JavaScript output; type definitions are planned for a future release.

**Can I send custom metadata?**

Yes - use the named fields plus `custom_1` to `custom_10`. See ["Track custom metadata and video metrics."](#track-custom-metadata-and-video-metrics)

**How do I stop tracking?**

Call `videojsInstance.fp.destroy()` on the player instance.

<br />

## Troubleshooting Video.js analytics

- **No data on the dashboard?** 

  Confirm your `workspace_id` is set and correct, and that playback actually started.

- **Need to debug?** 

  Set `debug: true` to see SDK logs in the console.

- **Metrics look merged across videos?** 
  
  Emit a `videoChange` event when a new video starts in the same player, as shown above.

- **Want to disable automatic error tracking?** 

  Set `automaticErrorTracking: false`.

<br />

## Documentation

For more detailed steps and advanced usage, see the official [FastPix documentation](https://fastpix.com/docs/video-data/monitors/videojs).

## Support

Questions or issues? Open a [GitHub issue](https://github.com/FastPix/web-videojs-data-monitoring/issues) or check the [documentation](https://fastpix.com/docs/video-data/monitors/videojs).

## License

[MIT](https://github.com/FastPix/web-videojs-data-monitoring/blob/main/LICENSE)
