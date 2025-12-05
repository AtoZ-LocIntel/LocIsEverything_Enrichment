# Mobile UI Debugging Steps

## Current Situation
- Checkbox should be 50px × 50px square on mobile
- Text should be larger and full width
- Distance selection should be full width
- **NOTHING IS CHANGING** despite multiple code updates

## Possible Causes

### 1. CSS Not Loading
**Test:** Check browser DevTools → Network tab → Look for `mobile-fixes.css`
- If file is NOT loading: Check import in `src/main.tsx`
- If file IS loading but styles not applying: See #2

### 2. Media Query Not Matching
**Test:** Add this to `mobile-fixes.css`:
```css
@media (max-width: 767px) {
  .fixed.inset-0.bg-white {
    background-color: yellow !important; /* TEST - should make modal yellow on mobile */
  }
}
```
- If modal turns yellow: Media query works, but selectors are wrong
- If modal stays white: Media query not matching (check viewport width)

### 3. Selectors Not Matching
**Test:** In browser DevTools:
1. Inspect the checkbox button
2. Check if it has `data-enrichment-checkbox="true"` attribute
3. Check computed styles - are our CSS rules showing up?
4. Check if any styles are crossed out (overridden)

### 4. isMobile State Issue
**Test:** Add console.log in component:
```tsx
console.log('🔍 isMobile state:', isMobile, 'window width:', window.innerWidth);
```
- If `isMobile` is `false` when it should be `true`: State detection issue
- If `isMobile` is `true` but styles not applying: See #2 or #3

### 5. Build/Cache Issue
**Test:**
1. Stop dev server (Ctrl+C)
2. Delete `node_modules/.vite` folder
3. Clear browser cache completely
4. Restart: `npm run dev`
5. Hard refresh: Ctrl+F5

### 6. Tailwind Overriding
**Test:** Remove ALL Tailwind width/height classes from button:
- Remove `w-4 h-4` completely
- Use ONLY inline styles

## Current Code Locations

### Checkbox Button
- File: `src/components/EnrichmentConfig.tsx`
- Line: ~2059-2078
- Has: `data-enrichment-checkbox="true"` attribute
- Inline styles: Applied when `isMobile === true`

### CSS File
- File: `src/mobile-fixes.css`
- Media query: `@media (max-width: 767px)`
- Selectors: Multiple combinations targeting `button[data-enrichment-checkbox="true"]`

### Import Order
- File: `src/main.tsx`
- Order: `index.css` then `mobile-fixes.css` (mobile-fixes loads last)

## Next Steps to Diagnose

1. **Open browser DevTools on mobile/emulator**
2. **Inspect the checkbox button element**
3. **Check:**
   - Does it have `data-enrichment-checkbox="true"`? ✅/❌
   - What are the computed styles? (Check Styles panel)
   - Are our CSS rules present but crossed out? (Overridden)
   - What is the actual width/height in computed styles?
   - Is `isMobile` state true? (Check console logs)

4. **Test media query:**
   - Add yellow background test (see #2 above)
   - If yellow appears: CSS is loading, but selectors wrong
   - If no yellow: Media query not matching or CSS not loading

5. **Check viewport:**
   - What is `window.innerWidth` on mobile?
   - Is it < 768? If not, media query won't match

## Most Likely Issue
Based on the symptoms, the most likely issue is:
- **Tailwind utility classes** (`w-4 h-4` or similar) are being applied and have higher specificity
- **OR** the `isMobile` state is `false` when it should be `true`
- **OR** the media query breakpoint (767px) doesn't match the actual mobile viewport

## Quick Fix to Test
Add this directly to the button's inline style (remove the conditional):
```tsx
style={{ 
  width: window.innerWidth < 768 ? '50px' : '16px',
  height: window.innerWidth < 768 ? '50px' : '16px',
  minWidth: window.innerWidth < 768 ? '50px' : '16px',
  minHeight: window.innerWidth < 768 ? '50px' : '16px',
  aspectRatio: window.innerWidth < 768 ? '1' : undefined,
}}
```
This bypasses the `isMobile` state entirely and checks window width directly.

