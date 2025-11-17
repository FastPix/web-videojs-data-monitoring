# FastPix Video Data SDK for Video.js - Documentation PR

## Documentation Changes

### What Changed
- [ ] New documentation added
- [ ] Existing documentation updated
- [ ] Documentation errors fixed
- [ ] Code examples updated
- [ ] Links and references updated
- [ ] Other

### Files Modified
- [ ] README.md
- [ ] docs/ files
- [ ] USAGE.md
- [ ] CONTRIBUTING.md
- [ ] Other: _______________


### Summary
**Brief description of changes:**
```
<!-- What documentation was added, updated, or fixed? -->
```
### Code Examples (if Applicable)
```javascript
// If you added/updated code examples, include them here
import videojs from "video.js";
import initVideoJsTracking from "@fastpix/videojs-monitor";

const videoPlayerElement = document.getElementById("video-player");
const initializationTime = initVideoJsTracking.utilityMethods.now();
const videojsInstance = videojs(videoPlayerElement);

const trackingData = {
  workspace_id: "YOUR_WORKSPACE_KEY",
  player_name: "MyVideoPlayer",
  player_init_time: initializationTime,
  video_title: "Test Video",
  video_id: "video-123",
  viewer_id: "viewer-456",
};

initVideoJsTracking(videojsInstance, {
  debug: false,
  videojs: videojs,
  data: trackingData,
});
```

### Testing
- [ ] All code examples tested
- [ ] Links verified
- [ ] Grammar checked
- [ ] Formatting consistent

### Review Checklist
- [ ] Content is accurate
- [ ] Code examples work
- [ ] Links are working
- [ ] Grammar is correct
- [ ] Formatting is consistent

---

**Ready for review!**

