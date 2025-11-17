---
name: Question/Support
about: Ask questions or get help with the FastPix Video Data SDK for Video.js
title: '[QUESTION] '
labels: ['question', 'needs-triage']
assignees: ''
---

# Question/Support

Thank you for reaching out! We're here to help you with the FastPix Video Data SDK for Video.js. Please provide the following information:

## Question Type
- [ ] How to use a specific feature
- [ ] Integration help
- [ ] Configuration question
- [ ] Performance question
- [ ] Troubleshooting help
- [ ] Other: _______________

## Question
**What would you like to know?**
```
<!-- Please provide a clear, specific question -->
```
## What You've Tried
**What have you already attempted to solve this?**

```javascript
// Please share any code you've tried
import videojs from "video.js";
import initVideoJsTracking from "@fastpix/videojs-monitor";

// Your attempted code here
```

## Current Setup
**Describe your current setup:**

### Environment
- **Operating System:** [e.g., Windows 10, macOS 14.0, Ubuntu 22.04, iOS 17, Android 13, etc.]
- **Browser:** [e.g., Chrome 120, Firefox 121, Safari 17, Edge 120, etc.]
- **Browser Version:** [e.g., 120.0.6099.109, etc.]
- **FastPix Video Data SDK Version:** [e.g., 1.0.4, 1.0.3, etc.]
- **Video.js Version:** [e.g., 8.8.0, 8.7.0, etc.]
- **Framework/Library:** [e.g., React, Vue, Angular, Vanilla JS, Next.js, etc.] (if applicable)
- **Package Manager:** [e.g., npm, yarn, pnpm, bun] (if applicable)

### Configuration
```javascript
// Your current SDK configuration (remove sensitive information)
// Note: initializationTime and videojsInstance should be defined before this
const trackingData = {
  workspace_id: "***", // Your workspace key (redacted)
  player_name: "MyVideoPlayer",
  player_init_time: initializationTime, // const initializationTime = initVideoJsTracking.utilityMethods.now();
  video_title: "Test Video",
  video_id: "video-123",
  viewer_id: "viewer-456",
  // Additional metadata
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

## Expected Outcome
**What are you trying to achieve?**
```
<!-- Describe your end goal -->
```
## Error Messages (if any)
```
<!-- If you're getting errors, paste them here -->
```

## Additional Context

### Use Case
**What are you building?**

- [ ] Web application (Single Page App, Multi-page, etc.)
- [ ] Progressive Web App (PWA)
- [ ] Mobile app (web-based)
- [ ] Video streaming platform
- [ ] Content Management System (CMS)
- [ ] Other: _______________

### Timeline
**When do you need this resolved?**

- [ ] ASAP (blocking development)
- [ ] This week
- [ ] This month
- [ ] No rush

### Resources Checked
**What resources have you already checked?**

- [ ] README.md
- [ ] Documentation
- [ ] Examples
- [ ] Stack Overflow
- [ ] GitHub Issues
- [ ] Other: _______________

## Priority
Please indicate the urgency:

- [ ] Critical (Blocking production deployment)
- [ ] High (Blocking development)
- [ ] Medium (Would like to know soon)
- [ ] Low (Just curious)

## Checklist
Before submitting, please ensure:

- [ ] I have provided a clear question
- [ ] I have described what I've tried
- [ ] I have included my current setup
- [ ] I have checked existing documentation
- [ ] I have provided sufficient context
- [ ] I have removed any sensitive information

---

**We'll do our best to help you get unstuck! 🚀**

**For urgent issues, please also consider:**
- [FastPix Documentation - Video.js](https://docs.fastpix.io/docs/monitor-videojs)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/fastpix)
- [GitHub Discussions](https://github.com/FastPix/web-videojs-data-monitoring/discussions)

