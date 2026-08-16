# Screenshots

Images referenced by the root `README.md`. Capture replacements at 1440x900 in
light mode with the browser chrome cropped out.

| File               | Route                  | What it should show                                     |
| ------------------ | ---------------------- | ------------------------------------------------------- |
| `banner.png`       | README hero            | 1200×300 (4:1). Wordmark plus tagline.                  |
| `match-center.png` | `/match-center`        | Day scoreboard with several games and the date picker   |
| `replay.gif`       | `/historic-games/[id]` | A replay mid-playback: clock ticking, feed scrolling    |
| `shot-heatmap.png` | `/players/[id]`        | Shot heatmap tab, hex mode, with the zone table visible |
| `standings.png`    | `/standings`           | Both conferences with playoff/play-in seeding markers   |

Keep `replay.gif` under ~5 MB so it renders inline on GitHub; 10-15 seconds at
10 fps is enough to show the play-by-play advancing.
