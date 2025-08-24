# IZ HAIR TREND — Soft Hair Edition (RU/EN)

Ready-to-upload GitHub package (Vite + React + TypeScript + Tailwind + Three.js + drei + postprocessing).

## Run locally
```
npm i
npm run dev
```

## Build
```
npm run build
```

## Deploy (Vercel)
1) Create a GitHub repo and upload the **contents** of this folder (not the folder itself).
2) On Vercel: Add Project → Import your repo.
   - Build: `npm run build`
   - Output: `dist`
3) Add your domain `izhairtrend.shop` in Settings → Domains.

## Logo
Export your PDF logo to **SVG** and place it as `public/iz-logo.svg`.
The code already points to it via `const logoUrl = "/iz-logo.svg"` in `src/App.tsx`.
