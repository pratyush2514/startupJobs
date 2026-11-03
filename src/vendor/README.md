# Vendored: leaflet.markercluster 1.5.3

`leaflet.markercluster.js` is the minified dist from the
[leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) 1.5.3
npm tarball (integrity sha512-vPTw/Bndq7eQHjLBVlWpnGeLa3t+3zGiuM7fJwCkiMFq+nmRuG3RI3f7f4N4TDX7T4NpbAXpR2+NTRSEGfCSeA==).

Vendored (not a package.json dep) because the sandbox has no pnpm/corepack and
npm refuses the repo's `workspace:*` protocol — hand-editing pnpm-lock.yaml
risked breaking deploys. The file is a UMD that reads the bare global `L`,
so MapView sets `globalThis.L` before dynamically importing it.

Cluster visuals are custom (monochrome, in src/index.css) — the plugin's
default green/blue CSS is intentionally not used.
