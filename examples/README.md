# FastPix Data SDK + Video.js — integration examples

Copy-pasteable examples showing how to attach the FastPix Video Data SDK
([`@fastpix/videojs-monitor`](https://www.npmjs.com/package/@fastpix/videojs-monitor))
to a [Video.js](https://videojs.com) player.

| Example | Stack | What it shows |
| --- | --- | --- |
| [`html5-demo/`](./html5-demo) | Plain HTML + CDN Video.js | Local IIFE build, `window.initVideoJsTracking` |
| [`react-vite/`](./react-vite) | React 18 + Vite | Reusable `useFastpixVideojs` hook |
| [`nextjs/`](./nextjs) | Next.js 14 (App Router) | Client-component player, SSR-safe import |

## Workspace key

Every example uses the placeholder `YOUR_WORKSPACE_KEY`. Replace it with your own
workspace key from [dashboard.fastpix.com](https://dashboard.fastpix.com) before running.

## HLS / DASH

Video.js plays both HLS and DASH through its built-in VHS engine — no extra
library is required. The FastPix sample asset is HLS-only, so DASH demos point at
a public `.mpd` stream as a stand-in.

## Running

### html5-demo
Build the SDK, then serve the **repo root** (the pages load `../../dist/index.js`):

```bash
npm install && npm run build   # from the repo root
npx serve .                    # then open /examples/html5-demo/
```

### react-vite

```bash
cd examples/react-vite
npm install
npm run dev
```

### nextjs

```bash
cd examples/nextjs
npm install
npm run dev
```
