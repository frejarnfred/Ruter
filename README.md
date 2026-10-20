# Club Routes

A map of all the club's cycling routes, drawn on top of each other with Leaflet. The site is hosted free on GitHub Pages.

The page is view-only. Only the repository owner can add, rename or delete routes, by changing files in the `routes/` folder on GitHub. Visitors can view and download routes, nothing else.

## How it works

```
owner adds GPX to routes/ on github.com ─► GitHub Action rebuilds ─► everyone sees it
```

- Every `.gpx` file in `routes/` is part of the map.
- On each commit, a GitHub Action runs `scripts/build.mjs`. It merges all GPX files into one compact `data/routes.json` (tracks simplified to about 8 m) and publishes the site.
- The site has no server and no upload form, so there is nothing on the page a visitor can use to change the map.

## Features

- All routes overlaid. In "Overlap view" each line is semi-transparent, so roads used by many routes look darker.
- "Distinct colours" gives each route its own colour.
- Click a line or a list item to highlight it and see distance, climbing and a GPX download link.
- Search, sort by name, distance or climbing, and show or hide individual routes.
- Three base maps: Light, OpenStreetMap, CyclOSM.

## One-time setup

1. On github.com, create a new **public** repository, e.g. `club-routes`. Free GitHub Pages needs a public repository.
2. Push this folder to it:
   ```
   cd cycling-routes
   git init -b main
   git add .
   git commit -m "Club routes map"
   git remote add origin https://github.com/<your-user>/club-routes.git
   git push -u origin main
   ```
3. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Open **Actions → Build and publish map → Run workflow**. This is only needed the first time.
5. The site is at `https://<your-user>.github.io/club-routes/` after about a minute.

## Adding routes (owner only)

1. On github.com, open the `routes` folder.
2. **Add file → Upload files**, drop in the GPX files and click **Commit changes**.
3. The map updates by itself after a minute or two (progress is visible under **Actions**).

The github.com uploader takes a limited number of files per commit, so the first 150 routes may need a few rounds. With git on your computer, copy the files into `routes/` and push them all at once instead.

- **Removing or renaming a route:** delete or rename the file in `routes/` on github.com.
- **Example routes:** delete the three `example-*.gpx` files before the club starts using the map.

### Who can upload

On a personal repository only the owner can write to it. Others can't change files, but they can open pull requests (suggested changes) that do nothing until the owner accepts them. Keep it that way:

- Don't add anyone under **Settings → Collaborators**.
- If the repository is created under a GitHub organisation instead of your personal account, check that organisation members don't have write access.

## Limitations

- The repository is public, so all GPX files can be downloaded by anyone who finds the site or the repository.
- Climbing is calculated from GPX elevation with a 3 m noise filter, so figures will differ somewhat from Strava or Garmin.
- Route names come from the `<name>` in the GPX file, falling back to the file name.

## Preview locally

```
node scripts/build.mjs
python3 -m http.server
```
Then open http://localhost:8000.
