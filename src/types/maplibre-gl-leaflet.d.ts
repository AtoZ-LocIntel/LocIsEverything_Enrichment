declare module '@maplibre/maplibre-gl-leaflet';

// IMPORTANT:
// Do NOT `declare module 'leaflet' { ... }` here.
// Leaflet uses `export = L` typing, and module augmentation can break the exported shape under
// `moduleResolution: bundler`. We only need to add the plugin function onto the global `L` namespace.
declare namespace L {
  // Added by `@maplibre/maplibre-gl-leaflet` (used as `L.maplibreGL(...)`)
  function maplibreGL(options: { style: string; attribution?: string; interactive?: boolean }): any;
}


