---
name: Bug Report
about: Report a bug or unexpected behavior in the FastPix Video Data SDK for Video.js
title: '[BUG] '
labels: ['bug', 'needs-triage']
assignees: ''
---

# Bug Report

Thank you for taking the time to report a bug with the FastPix Video Data SDK for Video.js. To help us resolve your issue quickly and efficiently, please provide the following information:

## Description
**Clear and concise description of the bug:**
```
<!-- Please provide a detailed description of what you're experiencing -->
```
## Environment Information

### System Details
- **Operating System:** [e.g., Windows 10, macOS 14.0, Ubuntu 22.04, iOS 17, Android 13, etc.]
- **Browser:** [e.g., Chrome 120, Firefox 121, Safari 17, Edge 120, etc.]
- **Browser Version:** [e.g., 120.0.6099.109, etc.]
- **Device Type:** [e.g., Desktop, Mobile, Tablet, Smart TV, etc.] (if applicable)

### SDK Information
- **FastPix Video Data SDK Version:** [e.g., 1.0.4, 1.0.3, etc.]
- **Video.js Version:** [e.g., 8.8.0, 8.7.0, etc.]
- **Package Manager:** [e.g., npm, yarn, pnpm, bun]
- **TypeScript Version:** [e.g., 5.7.3, 5.1.6, etc.] (if applicable)
- **Framework/Library:** [e.g., React, Vue, Angular, Vanilla JS, Next.js, etc.] (if applicable)

## Reproduction Steps

1. **Setup Environment:**
   ```bash
   npm install @fastpix/videojs-monitor@latest
   npm install video.js
   ```

2. **Code to Reproduce:**
   ```javascript
   // Please provide a minimal, reproducible example
   import videojs from "video.js";
   import initVideoJsTracking from "@fastpix/videojs-monitor";
   
   // Reference to the video element
   const videoPlayerElement = document.getElementById("video-player");
   
   // Record the player initialization time
   const initializationTime = initVideoJsTracking.utilityMethods.now();
   
   // Create a new Video.js instance for the player
   const videojsInstance = videojs(videoPlayerElement);
   
   // Custom metadata for tracking purposes
   const trackingData = {
     workspace_id: "YOUR_WORKSPACE_KEY", // Mandatory field
     player_name: "MyVideoPlayer",
     player_init_time: initializationTime,
     video_title: "Test Video",
     video_id: "video-123",
     viewer_id: "viewer-456",
   };
   
   // Initialize video.js tracking with custom configuration
   initVideoJsTracking(videojsInstance, {
     debug: true, // Recommended for bug reporting to capture detailed logs
     videojs: videojs,
     data: trackingData,
   });
   
   // Your code here that causes the issue
   ```

3. **Expected Behavior:**

    ```
    <!-- Describe what you expected to happen -->
    ```

4. **Actual Behavior:**

    ```
    <!-- Describe what actually happened -->
    ```

5. **Error Messages/Logs:**
   ```
   <!-- Paste any error messages, stack traces, or logs here -->
   ```

## Debugging Information

### Console Output
```
<!-- Paste the complete console output here -->
```

### Error Stack Traces
```javascript
// Complete stack trace for JavaScript/TypeScript errors
// Example: Video.js error
Error: Video.js error occurred
    at videojs (video.js:1234)
    ...

// Example: FastPix SDK error
Error: A valid Video.js player instance must be provided to enable data analytics tracking.
    at initVideoJsTracking (.../node_modules/@fastpix/videojs-monitor/dist/index.mjs:162:22)
    at initializePlayer (.../src/player.js:45:8)
```

### Network Requests
```http
# Raw HTTP request (remove sensitive headers)
POST https://data.fastpix.io/v1/events HTTP/1.1
Host: data.fastpix.io
Content-Type: application/json

{
  "workspace_id": "***",
  "event_type": "playerReady",
  "timestamp": 1234567890
}
```

### Screenshots
```
<!-- If applicable, please attach screenshots that help explain your issue -->
```
## Additional Context

### Configuration
```javascript
// Please share your SDK configuration (remove sensitive information)
const trackingData = {
  workspace_id: "***",
  player_name: "MyVideoPlayer",
  player_init_time: initializationTime,
  video_title: "Test Video",
  video_id: "video-123",
  viewer_id: "viewer-456",
};

initVideoJsTracking(videojsInstance, {
  debug: false,
  videojs: videojs,
  disableCookies: false,
  respectDoNotTrack: false,
  automaticErrorTracking: true,
  data: trackingData,
});
```

### Workarounds
```
<!-- If you've found any workarounds, please describe them here -->
```
## Priority
Please indicate the priority of this bug:

- [ ] Critical (Blocks production use)
- [ ] High (Significant impact on functionality)
- [ ] Medium (Minor impact)
- [ ] Low (Nice to have)

## Checklist
Before submitting, please ensure:

- [ ] I have searched existing issues to avoid duplicates
- [ ] I have provided all required information
- [ ] I have tested with the latest SDK version
- [ ] I have removed any sensitive information
- [ ] I have provided a minimal reproduction case
- [ ] I have checked the documentation

---

**Thank you for helping improve the FastPix Video Data SDK for Video.js! 🚀**

