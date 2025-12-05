# Mobile Layer Selection UI Code

## Problem Statement
The mobile layer selection UI has three issues:
1. **Checkbox is horizontal/flat** - should be square (50px × 50px)
2. **Layer name and description text is too constrained** - needs full width and larger font sizes
3. **Distance selection box is too constrained** - needs full width

## Current Code Structure

### 1. Component: `src/components/EnrichmentConfig.tsx`

#### Button Rendering (Lines ~2220-2280)
```tsx
<button
  type="button"
  onClick={() => handleEnrichmentToggle(enrichment.id)}
  data-enrichment-checkbox="true"
  className={`enrichment-checkbox flex-shrink-0 border-2 border-gray-300 rounded flex items-center justify-center transition-all duration-200 self-start ${
    isSelected 
      ? 'bg-black border-black' 
      : 'bg-white border-gray-300'
  } ${isMobile ? 'mobile-checkbox' : 'w-4 h-4'}`}
  style={window.innerWidth < 768 ? { 
    width: '50px', 
    height: '50px', 
    minWidth: '50px', 
    minHeight: '50px', 
    maxWidth: '50px', 
    maxHeight: '50px',
    aspectRatio: '1',
    flexShrink: '0',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties : {}}
>
  {isSelected && (
    <Check className={`text-white ${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`} 
      style={window.innerWidth < 768 ? { 
        width: '28px', 
        height: '28px', 
        minWidth: '28px', 
        minHeight: '28px', 
        flexShrink: '0' 
      } as React.CSSProperties : {}} 
    />
  )}
</button>
```

#### Text Container (Lines ~2286-2295)
```tsx
<div className={`flex-1 min-w-0 text-left w-full max-w-full ${isMobile ? 'space-y-3' : 'space-y-1'}`} 
  style={isMobile ? { 
    width: '100%', 
    maxWidth: '100%', 
    padding: '0', 
    margin: '0', 
    flex: '1 1 100%', 
    minWidth: '0' 
  } as React.CSSProperties : {}}>
  <label htmlFor={enrichment.id} 
    className={`font-semibold text-gray-900 cursor-pointer block break-words w-full ${isMobile ? 'text-xl leading-7' : 'text-base sm:text-base leading-relaxed'}`} 
    style={isMobile ? { 
      fontSize: '20px', 
      lineHeight: '1.6', 
      marginBottom: '12px', 
      width: '100%', 
      maxWidth: '100%', 
      display: 'block' 
    } as React.CSSProperties : {}}>
    {enrichment.label}
  </label>
  <p className={`text-gray-700 break-words whitespace-normal w-full ${isMobile ? 'text-lg leading-7' : 'text-sm sm:text-sm leading-relaxed'}`} 
    style={isMobile ? { 
      fontSize: '17px', 
      lineHeight: '1.8', 
      width: '100%', 
      maxWidth: '100%', 
      margin: '0', 
      padding: '0', 
      display: 'block' 
    } as React.CSSProperties : {}}>
    {enrichment.description}
  </p>
</div>
```

#### Distance Selection Box (Lines ~2300-2350)
```tsx
<div className="mt-4 pt-4 border-t border-gray-100" 
  style={isMobile ? { 
    width: '100%', 
    maxWidth: '100%', 
    marginTop: '16px', 
    paddingTop: '16px', 
    paddingLeft: '0', 
    paddingRight: '0', 
    boxSizing: 'border-box' 
  } as React.CSSProperties : {}}>
  <div className="flex flex-col gap-3 mt-4 w-full max-w-full" 
    style={isMobile ? { 
      width: '100%', 
      maxWidth: '100%', 
      boxSizing: 'border-box' 
    } as React.CSSProperties : {}}>
    <label className="text-sm font-medium text-black w-full" 
      style={isMobile ? { 
        width: '100%', 
        maxWidth: '100%', 
        fontSize: '16px', 
        display: 'block' 
      } as React.CSSProperties : {}}>
      Search Radius:
    </label>
    <div className="flex items-center gap-2 w-full max-w-full" 
      style={isMobile ? { 
        width: '100%', 
        maxWidth: '100%', 
        boxSizing: 'border-box' 
      } as React.CSSProperties : {}}>
      <select
        value={currentRadius}
        onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value))}
        className="w-32 sm:w-28 flex-shrink-0 px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
        style={isMobile ? { 
          width: 'calc(100% - 70px)', 
          maxWidth: 'calc(100% - 70px)', 
          minWidth: '120px', 
          boxSizing: 'border-box' 
        } as React.CSSProperties : { maxWidth: 'calc(100% - 60px)' }}
      >
        {/* options */}
      </select>
      <span className="text-sm text-black whitespace-nowrap flex-shrink-0" 
        style={isMobile ? { fontSize: '16px' } as React.CSSProperties : {}}>
        miles
      </span>
    </div>
  </div>
</div>
```

#### useEffect Hook for Direct DOM Manipulation (Lines ~161-220)
```tsx
useEffect(() => {
  if (!activeModal) return;
  
  const applyMobileStyles = () => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;
    
    // Find all checkbox buttons
    const checkboxes = document.querySelectorAll('button[data-enrichment-checkbox="true"]');
    console.log('🔍 Found checkboxes:', checkboxes.length);
    
    checkboxes.forEach((btn) => {
      const button = btn as HTMLElement;
      button.style.width = '50px';
      button.style.height = '50px';
      button.style.minWidth = '50px';
      button.style.minHeight = '50px';
      button.style.maxWidth = '50px';
      button.style.maxHeight = '50px';
      button.style.aspectRatio = '1';
      button.style.flexShrink = '0';
      button.style.boxSizing = 'border-box';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      
      // Style the SVG inside
      const svg = button.querySelector('svg');
      if (svg) {
        svg.style.width = '28px';
        svg.style.height = '28px';
        svg.style.minWidth = '28px';
        svg.style.minHeight = '28px';
      }
    });
    
    // Style text containers, labels, descriptions...
  };
  
  applyMobileStyles();
  const timeout = setTimeout(applyMobileStyles, 100);
  const timeout2 = setTimeout(applyMobileStyles, 500);
  
  window.addEventListener('scroll', applyMobileStyles);
  window.addEventListener('resize', applyMobileStyles);
  
  return () => {
    clearTimeout(timeout);
    clearTimeout(timeout2);
    window.removeEventListener('scroll', applyMobileStyles);
    window.removeEventListener('resize', applyMobileStyles);
  };
}, [activeModal]);
```

#### Inline Style Tag in Modal (Lines ~1824-1823)
```tsx
<style>{`
  @media (max-width: 767px) {
    .fixed.inset-0.bg-white button[data-enrichment-checkbox="true"],
    .fixed.inset-0.bg-white .border.border-gray-200 button.enrichment-checkbox,
    .fixed.inset-0.bg-white .flex button.enrichment-checkbox {
      width: 50px !important;
      height: 50px !important;
      min-width: 50px !important;
      min-height: 50px !important;
      max-width: 50px !important;
      max-height: 50px !important;
      aspect-ratio: 1 !important;
      flex-shrink: 0 !important;
      box-sizing: border-box !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    /* ... more styles ... */
  }
`}</style>
```

### 2. CSS File: `src/mobile-fixes.css`
Contains media query `@media (max-width: 767px)` with styles targeting:
- `.fixed.inset-0.bg-white button[data-enrichment-checkbox="true"]` - 50px × 50px
- Text containers - 100% width
- Labels - 24px font size
- Descriptions - 19px font size
- Distance selection - full width

### 3. CSS File: `src/index.css` (Lines 525-620)
Contains additional mobile styles in `@media (max-width: 767px)` block.

### 4. Import: `src/main.tsx`
```tsx
import './index.css'
import './mobile-fixes.css'
```

## Current Issues
- **Nothing is changing visually** despite:
  - Inline styles on elements
  - CSS media queries
  - Direct DOM manipulation via useEffect
  - Inline style tag in component

## Expected Behavior (Mobile < 768px width)
1. Checkbox: 50px × 50px square
2. Check mark icon: 28px × 28px
3. Label text: 24px font size, full width
4. Description text: 19px font size, full width
5. Distance selection: Full width, larger input

## Key Selectors
- Checkbox: `button[data-enrichment-checkbox="true"]`
- Container: `.fixed.inset-0.bg-white`
- Card: `.border.border-gray-200.rounded-lg`
- Text container: `.flex-1` inside `.flex.flex-col`

## Mobile Detection
- Uses `window.innerWidth < 768`
- State: `isMobile` (from useState)
- Also checks directly: `window.innerWidth < 768` in inline styles

