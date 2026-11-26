## 2026-11-26 10:55 — Built ABD demo (static SPA)
- Goal: pitch ABD (abdindia.com) the same SAP -> data lake -> custom app pattern as EEP client (superlative-zabaione-322500.netlify.app). Core job: pick the fitting solution + mock data + demo.
- EEP super app has 9 nav items: Home, Executive, Finance, Projects, Warehouse, EAM, HR, EHSM, AI Control Center; "Go to app" SAP link per app, DEMO DATA badge, AI insights banner, sites map.
- Built: Home, Sales&Brand, Finance, Capex&Projects, Supply, Plant Ops (+maintenance), Distribution&Excise, Quality&EHS, People, AI Center, Data lake, Solution fit. Vanilla JS, no build, mock data in data.js.
- Assumption: "Allied Brewery" = Allied Blenders & Distillers (spirits, not beer) per the website.
- Initially only looked at 2 of 9 EEP tabs; user asked "did you look at all tabs" -> reviewed all and added HR, Projects, AI Center, map, insights, export.
- Hosting: GitHub Pages works (static, public); Vercel if private. NOT pushed yet.
