# Record a real POV video (optional)

The site uses an **animated demo** in the “How to” section (browser + cursor).  
To replace it with a **screen-recorded MP4**:

## With OBS (recommended)

1. Install [OBS Studio](https://obsproject.com/).
2. Load the CineCoop extension locally: `chrome://extensions` → Developer mode → Load `cinepulse-duo`.
3. Scene: 1920×1080 screen capture, cursor visible.
4. Record these actions (30–60 s per step, or one 2 min video):
   - Chrome Web Store → **Add to Chrome**
   - Open Netflix/YouTube → start a video
   - Click CineCoop icon → **Start session**
   - **Copy link** in the popup
   - Show synced playback + chat
5. Export as MP4 → place in `assets/how-tutorial.mp4`.
6. In `index.html`, replace the `#how-pov` block with:

```html
<video class="how-tutorial-video" src="assets/how-tutorial.mp4" autoplay muted loop playsinline></video>
```

## Suggested filename

`assets/how-tutorial.mp4`
