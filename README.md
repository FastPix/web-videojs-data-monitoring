# Introduction:

This SDK simplifies integration steps with [Video.js](https://videojs.com/), enabling the collection of player analytics. It enables automatic tracking of video performance metrics, making the data readily available on the [FastPix dashboard](https://dashboard.fastpix.io) for monitoring and analysis. While the SDK is developed in TypeScript, the published npm package currently includes only the JavaScript output. TypeScript support, including type definitions, will be released in a future version.

# Key Features:

- **Track Viewer Engagement:** Gain insights into how users interact with your videos.
- **Monitor Playback Quality:** Ensure video streaming by monitoring real-time metrics, including bitrate, buffering, startup performance, render quality, and playback failure errors.
- **Error Management:** Identify and resolve playback failures quickly with detailed error reports.
- **Customizable Tracking:** Flexible configuration to match your specific monitoring needs.
- **Centralized Dashboard:** Visualize and compare metrics on the [FastPix dashboard](https://dashboard.fastpix.io) to make data-driven decisions.

# Prerequisites:

## Getting started with FastPix:

To track and analyze video performance, initialize the FastPix Data SDK with your Workspace key (learn more about [Workspaces here](https://docs.fastpix.io/docs/workspaces)):

1. **[Access the FastPix Dashboard](https://dashboard.fastpix.io)**: Log in and navigate to the Workspaces section.
2. **Locate Your Workspace Key**: Copy the Workspace Key for client-side monitoring.

# Step 1: Installation and Setup:

To get started with the SDK, install using npm or your favourite node package manager 😉:

```bash
npm i @fastpix/videojs-monitor
```

# Step 2: Import

```javascript
import initVideoJsTracking from "@fastpix/videojs-monitor";
```

# Step 3: Basic Integration

The `workspace_id` is a mandatory field that must be provided. Begin by installing the `video.js` package and attach it to your HTML5 video element. Pass the `videojs` function (imported from the video.js library) along with your custom metadata to the `initVideoJsTracking` function.

Tracking analytics begins once the player successfully loads the URL and starts playback.

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
  workspace_id: 'WORKSPACE_KEY',        // Unique key to identify your workspace (replace with your actual workspace key)
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

After successfully completing Step 3, you can track viewer metrics in the FastPix dashboard once playback ends. Steps 4, 5, and 6 are optional and can be utilized as needed to enhance your integration.

# Step 4: Enhance Tracking with User Passable Metadata

Check out the [user-passable metadata](https://docs.fastpix.io/docs/user-passable-metadata) documentation to see the metadata supported by FastPix. You can use custom metadata fields like `custom_1` to `custom_10` for your business logic, giving you the flexibility to pass any required values. Named attributes, such as `video_title` and `video_id`, can be passed directly as they are.

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
  workspace_id: "WORKSPACE_KEY", // Unique key to identify your workspace (replace with your actual workspace key)
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

### Note:

Keep metadata consistent across different video loads to make comparison easier in your analytics dashboard.

# Step 5: Advanced Customization with FastPix Data SDK

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
    workspace_id: "WORKSPACE_KEY", // Replace with your actual workspace key

    // ... add other metadata as needed
  },
};

// Initialize video.js tracking with custom configuration
initVideoJsTracking(videojsInstance, trackingData);
```

# Step 6: Emit Custom Events

### Advanced Error Reporting and Contextual Tracking 

By default, FastPix tracks errors that occur during playback failures. However, you can also emit a custom error event for non-severe issues that arise outside of these failures, allowing you to provide additional context for tracking purposes.

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

### Changing video streams in player

When your application plays multiple videos back-to-back in the same player, it’s essential to notify the FastPix SDK whenever a new video starts; possibly in scenarios like playlist content/ video series or any other video that user wants to play.

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

# Detailed Usage:

For more detailed steps and advanced usage, please refer to the official [FastPix Documentation](https://docs.fastpix.io/docs/monitor-videojs).
