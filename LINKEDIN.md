# LinkedIn post

**Video:** `build/monsters-changed-video.mp4` (1080 x 1528, 15 s, three loops of the 5 s scene, H.264, no audio). Upload as a native video, not a link. LinkedIn shows uploaded GIFs as a still image, so do not use the .gif there; it is for Slack, Teams, GitHub README or a blog.

**GIF:** `build/monsters-changed.gif` (640 wide, one 5 s loop).

**Gallery post:** [The Monsters Changed — Fabric Community](https://community.fabric.microsoft.com/discussions/pbi_contestsgallery/the-monsters-changed-the-fear-didnt-/5375310)
**LinkedIn post:** [linkedin.com/…/7517247410939801601](https://www.linkedin.com/feed/update/urn:li:activity:7517247410939801601/)
**GitHub repo:** [oii-nasif/the-monsters-changed-powerbi](https://github.com/oii-nasif/the-monsters-changed-powerbi)

## Caption

The monsters changed. The fear didn’t. 🎃

This is my first Power BI poster. The Fabric Community asked 105 people what scared them as kids and what scares them now, and turned the answers into a Halloween DataViz Contest. I could not resist.

The thing that stuck with me: we did not stop being afraid, we just changed monsters. Fears of the dark, ghosts and the unknown fall from 46% of people in childhood to 13% today. Fears about performance and the future go the other way, from 10% to 40%. War is now the single most common adult fear. And some monsters never leave: 6 of the 11 people who feared snakes as children still do.

So the page walks from a child’s bedroom to an adult’s office, and the scene moves. The ghost drifts, the lamp flickers, the city windows switch on and off, and a light travels from one life to the other. It is all native Power BI on the organiser’s starter model: every number is a live measure, the illustration is my own SVG, and the motion is a handful of looping GIFs sitting in image visuals. No custom visuals, no typed-in numbers.

These are real, self-reported answers from a small, self-selected group. A snapshot of the people who answered, not a verdict on everyone.

Thanks to Karin Szilágyi and the Fabric Community team for putting the survey and the contest together.

Full page and the .pbix are in the Contests Gallery: https://community.fabric.microsoft.com/discussions/pbi_contestsgallery/the-monsters-changed-the-fear-didnt-/5375310
Source code and build pipeline: https://github.com/oii-nasif/the-monsters-changed-powerbi

#PowerBI #MicrosoftFabric #DataViz #HalloweenDataViz #DataStorytelling

## Regenerate the video

The data visuals only exist inside Power BI, so the video is a composite: the PDF export supplies the text and charts, the animated SVG supplies the moving scene, and a mask keeps the two apart.

```
# 1. PDF export of the Live file (Desktop in front), then a 1:1 raster of it
powershell -ExecutionPolicy Bypass -File scripts/export_pdf_live.ps1
powershell -ExecutionPolicy Bypass -File scripts/pdf2png.ps1 -Pdf "build/The Monsters Changed - Live.pdf" -Out build/video/pdf_native.png
ffmpeg -i build/video/pdf_native.png -vf "scale=1405:1968,crop=1357:1920:24:24,format=rgb24" build/video/poster1x.png

# 2. mask = where the PDF differs from the t=0 background, limited to the visual rectangles
#    (see the drawbox list in the session notes; rects.png covers the hero visuals and everything below y=790)
ffmpeg -i build/video/poster1x.png -i build/live/poster_bg.png -filter_complex "[1:v]format=rgb24[b];[0:v][b]blend=all_mode=difference,format=gray,lutyuv=y='if(gt(val,28),255,0)'" build/video/mask_raw.png
ffmpeg -i build/video/mask_raw.png -i build/video/rects.png -filter_complex "blend=all_mode=multiply,format=gray" build/video/mask.png

# 3. scene frames, composite, encode
node scripts/render_page_frames.js art/poster_live.html build/video/scene 10
ffmpeg -framerate 10 -i build/video/scene/f%04d.png -loop 1 -i build/video/poster1x.png -loop 1 -i build/video/mask.png -filter_complex "[0:v]format=rgb24[s];[1:v]format=rgb24[p];[2:v]format=gray[m];[s][p][m]maskedmerge" -shortest build/video/comp/f%04d.png
ffmpeg -stream_loop 2 -framerate 10 -i build/video/comp/f%04d.png -vf "scale=1080:1528,format=yuv420p" -r 30 -c:v libx264 -crf 18 -movflags +faststart "build/monsters-changed-video.mp4"
```

ffmpeg lives in `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin`. puppeteer-core is installed in `%TEMP%\anim` (`NODE_PATH="$TEMP/anim/node_modules"`).
