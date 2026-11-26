# ABD Enterprise Platform (demo)

Static demo of a unified analytics app for Allied Blenders & Distillers, built on the same idea as the EEP demo:
SAP S/4HANA stays the system of record, non-real-time data is synced to a data lake, a custom app reads the lake.

All data is mock (deterministic, generated in `data.js`). Brand and plant names come from abdindia.com; every number is invented.

No build step: `index.html` + `style.css` + `data.js` + `app.js`.

## Run locally
    python -m http.server 8099   # then open http://localhost:8099

## Host on GitHub Pages (free; the site is public)
1. Create a repo, push these files to `main`.
2. Settings > Pages > Deploy from a branch > `main` / `/ (root)`.
3. Site appears at `https://<user>.github.io/<repo>/`.

## Host on Vercel (use if it must be private)
`vercel --prod` in this folder (framework: Other, no build command, output = root). Password protection needs a paid plan.
