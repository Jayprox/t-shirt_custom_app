# T-Shirt Designer

Drag-and-drop t-shirt / tote bag designer. Images uploaded by any visitor are
stored on the server and shown to everyone (a shared gallery), instead of
being stuck in one browser's local storage.

## Run it locally

```
npm install
npm start
```

Then open http://localhost:3000

## Deploy to Railway (GitHub method)

### 1. Push this project to GitHub

```
git init
git add .
git commit -m "Initial commit"
```

Create a new empty repo on GitHub (no README/license), then:

```
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

### 2. Create the Railway project

1. Go to https://railway.app and log in (GitHub login is easiest).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select the repo you just pushed.
4. Railway will detect this is a Node app (via `package.json`) and automatically
   run `npm install` then `npm start`. No extra build config needed.

### 3. Add a persistent Volume (so uploads survive redeploys)

By default, anything written to disk on Railway disappears on the next deploy
or restart. To keep uploaded images permanently:

1. In your Railway project, open the service, then go to the **Volumes** tab.
2. Click **New Volume**.
3. Set the **mount path** to `/app/uploads`.
4. Go to the **Variables** tab and add an environment variable:
   - `UPLOAD_DIR` = `/app/uploads`
5. Redeploy the service (Railway usually does this automatically after you
   add a volume/variable — if not, trigger a redeploy from the Deployments tab).

That's it — `server.js` already reads `UPLOAD_DIR` from the environment, so
once the Volume is attached, all uploaded images and the shared gallery list
(`images.json`) live on that persistent disk.

### 4. Get a public URL

1. In the service, go to **Settings** → **Networking**.
2. Click **Generate Domain**.
3. Share that URL — anyone who visits it will see the same shared image
   gallery and can upload/remove images for everyone.

## Notes / limits

- Uploads are capped at 5MB per file and 300 total images, as a basic guard
  since this app has no login — anyone with the link can upload or delete
  images. If you want to lock it down later, the easiest next step is adding
  a simple shared password check in `server.js` before the `/api/upload` and
  `/api/images/:id` (DELETE) routes.
- The gallery auto-refreshes every 15 seconds so uploads from other visitors
  show up without a manual page reload. There's also a "Refresh" link above
  the upload button for an on-demand check.
