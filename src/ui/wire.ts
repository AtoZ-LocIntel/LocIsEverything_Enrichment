// src/ui/wire.ts (or wherever you assemble the adapters)
import { CompositeGeocoder } from "../lib/composite";
import { NominatimAdapter } from "../adapters/nominatim";
import { GeoNamesAdapter } from "../adapters/geonames";
import { PlutoAdapter } from "../adapters/pluto";

export const geocoder = new CompositeGeocoder([
  NominatimAdapter,
  GeoNamesAdapter,
  PlutoAdapter,   // ← add here
  // ...any other adapters
]);
