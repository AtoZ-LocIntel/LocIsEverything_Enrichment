import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Map as LeafletMap } from 'leaflet';

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function fileTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/** Collect MapLibre GL map instances from Leaflet layers (maplibre-gl-leaflet). */
function collectMaplibreMaps(leafletMap: LeafletMap | null): any[] {
  if (!leafletMap) return [];
  const out: any[] = [];
  leafletMap.eachLayer((layer: any) => {
    if (typeof layer.getMaplibreMap === 'function') {
      const ml = layer.getMaplibreMap();
      if (ml) out.push(ml);
    }
  });
  return out;
}

function hasMaplibreLayer(leafletMap: LeafletMap | null): boolean {
  return collectMaplibreMaps(leafletMap).length > 0;
}

/** Wait for vector maps to finish painting (needed before reading WebGL canvas). */
function waitForMaplibreIdle(leafletMap: LeafletMap | null): Promise<void> {
  const maps = collectMaplibreMaps(leafletMap);
  if (maps.length === 0) return Promise.resolve();
  return Promise.all(
    maps.map(
      (ml) =>
        new Promise<void>((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            resolve();
          };
          ml.once('idle', finish);
          try {
            ml.triggerRepaint?.();
          } catch {
            /* ignore */
          }
          setTimeout(finish, 2500);
        })
    )
  ).then(() => undefined);
}

/** Load image from data URL (WebGL readback path). */
function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode map image'));
    img.src = dataUrl;
  });
}

async function drawMaplibreCanvases(
  outCtx: CanvasRenderingContext2D,
  element: HTMLElement,
  leafletMap: LeafletMap | null,
  scale: number
): Promise<void> {
  if (!leafletMap) return;
  const elRect = element.getBoundingClientRect();
  const layers: any[] = [];
  leafletMap.eachLayer((layer: any) => {
    if (typeof layer.getMaplibreMap === 'function') layers.push(layer);
  });

  for (const layer of layers) {
    const ml = layer.getMaplibreMap?.();
    if (!ml) continue;
    const glCanvas = ml.getCanvas?.() ?? ml._canvas;
    if (!glCanvas || !(glCanvas instanceof HTMLCanvasElement)) continue;

    const container = typeof layer.getContainer === 'function' ? layer.getContainer() : null;
    let opacity = 1;
    if (container instanceof HTMLElement) {
      const o = parseFloat(getComputedStyle(container).opacity || '1');
      if (!Number.isNaN(o)) opacity = Math.min(1, Math.max(0, o));
    }

    const r = glCanvas.getBoundingClientRect();
    const dx = (r.left - elRect.left) * scale;
    const dy = (r.top - elRect.top) * scale;
    const dw = r.width * scale;
    const dh = r.height * scale;

    try {
      const dataUrl = glCanvas.toDataURL('image/png');
      const img = await loadImageFromDataUrl(dataUrl);
      outCtx.save();
      outCtx.globalAlpha = opacity;
      outCtx.drawImage(img, dx, dy, dw, dh);
      outCtx.restore();
    } catch (e) {
      console.warn('[map export] MapLibre snapshot failed:', e);
      try {
        outCtx.save();
        outCtx.globalAlpha = opacity;
        outCtx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, dx, dy, dw, dh);
        outCtx.restore();
      } catch (e2) {
        console.warn('[map export] drawImage fallback failed:', e2);
      }
    }
  }
}

function transparentLeafletClone(cloned: HTMLElement) {
  const selectors = [
    '.leaflet-container',
    '.leaflet-map-pane',
    '.leaflet-tile-pane',
    '.leaflet-overlay-pane',
    '.leaflet-shadow-pane',
    '.leaflet-marker-pane',
    '.leaflet-tooltip-pane',
    '.leaflet-popup-pane',
  ];
  for (const sel of selectors) {
    cloned.querySelectorAll(sel).forEach((n) => {
      if (n instanceof HTMLElement) {
        n.style.setProperty('background-color', 'transparent', 'important');
        n.style.setProperty('background-image', 'none', 'important');
      }
    });
  }
  cloned.querySelectorAll('.leaflet-control').forEach((n) => {
    if (n instanceof HTMLElement) {
      n.style.setProperty('background-color', 'transparent', 'important');
    }
  });
}

/** Fallback: html2canvas + MapLibre composite (WebGL often incomplete). */
async function captureMapComposite(
  element: HTMLElement,
  leafletMap: LeafletMap | null
): Promise<HTMLCanvasElement> {
  const scale = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2);
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const w = Math.max(1, Math.ceil(width * scale));
  const h = Math.max(1, Math.ceil(height * scale));

  await waitForMaplibreIdle(leafletMap);

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const outCtx = out.getContext('2d');
  if (!outCtx) {
    throw new Error('Could not create export canvas');
  }

  outCtx.clearRect(0, 0, w, h);

  await drawMaplibreCanvases(outCtx, element, leafletMap, scale);

  const maplibreBasemap = hasMaplibreLayer(leafletMap);

  const overlayCanvas = await html2canvas(element, {
    useCORS: true,
    scale,
    logging: false,
    backgroundColor: 'rgba(0,0,0,0)',
    allowTaint: false,
    foreignObjectRendering: false,
    ignoreElements: (node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (node.closest?.('.leaflet-gl-layer')) return true;
      if (maplibreBasemap && node.closest?.('.leaflet-tile-pane')) return true;
      return false;
    },
    onclone: (_doc, cloned) => {
      if (cloned instanceof HTMLElement) {
        transparentLeafletClone(cloned);
      }
    },
  });

  outCtx.drawImage(overlayCanvas, 0, 0);
  return out;
}

/**
 * Capture real pixels (including WebGL) via tab share + Region Capture (CropTarget).
 * Chrome/Edge 121+ with secure context. User must allow when the browser prompts.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CropTarget/fromElement_static
 */
async function captureMapViaDisplayMedia(element: HTMLElement): Promise<HTMLCanvasElement> {
  const md = navigator.mediaDevices;
  if (!md?.getDisplayMedia) {
    throw new Error('getDisplayMedia not supported');
  }

  const stream = await md.getDisplayMedia({
    video: {
      displaySurface: 'browser',
      preferCurrentTab: true,
    } as MediaTrackConstraints,
    audio: false,
  });

  const track = stream.getVideoTracks()[0];
  if (!track) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('No video track from display capture');
  }

  let usedCropTo = false;
  const CropTargetCtor = (window as unknown as { CropTarget?: { fromElement: (el: Element) => Promise<unknown> } })
    .CropTarget;
  try {
    if (CropTargetCtor?.fromElement && typeof (track as MediaStreamTrack & { cropTo?: (c: unknown) => Promise<void> }).cropTo === 'function') {
      const cropTarget = await CropTargetCtor.fromElement(element);
      await (track as MediaStreamTrack & { cropTo: (c: unknown) => Promise<void> }).cropTo(cropTarget);
      usedCropTo = true;
    }
  } catch (e) {
    console.warn('[map export] CropTarget.cropTo failed, using manual viewport crop', e);
  }

  const video = document.createElement('video');
  video.playsInline = true;
  video.muted = true;
  video.srcObject = stream;
  await video.play();
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => setTimeout(r, 200));

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('Could not create canvas context');
  }

  if (usedCropTo && vw > 0 && vh > 0) {
    canvas.width = vw;
    canvas.height = vh;
    ctx.drawImage(video, 0, 0);
  } else {
    const rect = element.getBoundingClientRect();
    const iw = Math.max(window.innerWidth, 1);
    const ih = Math.max(window.innerHeight, 1);
    const scaleX = vw / iw;
    const scaleY = vh / ih;
    const sx = Math.max(0, Math.round(rect.left * scaleX));
    const sy = Math.max(0, Math.round(rect.top * scaleY));
    const sw = Math.min(vw - sx, Math.round(rect.width * scaleX));
    const sh = Math.min(vh - sy, Math.round(rect.height * scaleY));
    canvas.width = Math.max(1, sw);
    canvas.height = Math.max(1, sh);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }

  stream.getTracks().forEach((t) => t.stop());
  return canvas;
}

async function captureMapForExport(
  element: HTMLElement,
  leafletMap: LeafletMap | null,
  preferDisplayCapture: boolean
): Promise<HTMLCanvasElement> {
  if (preferDisplayCapture && typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
    try {
      return await captureMapViaDisplayMedia(element);
    } catch (e: unknown) {
      const name = e && typeof e === 'object' && 'name' in e ? (e as { name: string }).name : '';
      if (name === 'NotAllowedError') {
        throw e;
      }
      console.warn('[map export] Tab capture failed, falling back to in-page render:', e);
    }
  }
  return captureMapComposite(element, leafletMap);
}

export async function exportMapElementAsImage(
  element: HTMLElement,
  format: 'png' | 'jpeg',
  leafletMap?: LeafletMap | null,
  options?: { useDisplayCapture?: boolean }
): Promise<void> {
  const useCap = options?.useDisplayCapture !== false;
  const canvas = await captureMapForExport(element, leafletMap ?? null, useCap);
  const ts = fileTimestamp();
  if (format === 'png') {
    triggerDownload(canvas.toDataURL('image/png'), `map-export-${ts}.png`);
    return;
  }
  triggerDownload(canvas.toDataURL('image/jpeg', 0.92), `map-export-${ts}.jpg`);
}

export async function exportMapElementAsPdf(
  element: HTMLElement,
  leafletMap?: LeafletMap | null,
  options?: { useDisplayCapture?: boolean }
): Promise<void> {
  const useCap = options?.useDisplayCapture !== false;
  const canvas = await captureMapForExport(element, leafletMap ?? null, useCap);
  const imgData = canvas.toDataURL('image/png');
  const imgW = canvas.width;
  const imgH = canvas.height;

  const pdf = new jsPDF({
    orientation: imgW >= imgH ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = imgW / imgH;
  let drawW = maxW;
  let drawH = maxW / ratio;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = maxH * ratio;
  }
  const x = margin + (maxW - drawW) / 2;
  const y = margin + (maxH - drawH) / 2;

  pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);
  pdf.save(`map-export-${fileTimestamp()}.pdf`);
}
