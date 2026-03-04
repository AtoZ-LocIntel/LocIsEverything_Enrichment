/**
 * Scroll Debugging Utility
 * Helps identify why scrolling might not be working
 */

export const debugScroll = () => {
  console.group('🔍 SCROLL DEBUG INFO');
  
  // Check body styles
  const bodyStyles = window.getComputedStyle(document.body);
  console.log('📄 BODY STYLES:');
  console.log('  overflow:', bodyStyles.overflow);
  console.log('  overflowY:', bodyStyles.overflowY);
  console.log('  overflowX:', bodyStyles.overflowX);
  console.log('  height:', bodyStyles.height);
  console.log('  maxHeight:', bodyStyles.maxHeight);
  console.log('  position:', bodyStyles.position);
  console.log('  classes:', document.body.className);
  
  // Check html styles
  const htmlStyles = window.getComputedStyle(document.documentElement);
  console.log('🌐 HTML STYLES:');
  console.log('  overflow:', htmlStyles.overflow);
  console.log('  overflowY:', htmlStyles.overflowY);
  console.log('  height:', htmlStyles.height);
  console.log('  maxHeight:', htmlStyles.maxHeight);
  
  // Check #root styles
  const root = document.getElementById('root');
  if (root) {
    const rootStyles = window.getComputedStyle(root);
    console.log('🎯 #ROOT STYLES:');
    console.log('  overflow:', rootStyles.overflow);
    console.log('  overflowY:', rootStyles.overflowY);
    console.log('  height:', rootStyles.height);
    console.log('  maxHeight:', rootStyles.maxHeight);
  }
  
  // Check App wrapper
  const appWrapper = document.querySelector('.bg-black.flex.flex-col.min-h-screen');
  if (appWrapper) {
    const wrapperStyles = window.getComputedStyle(appWrapper);
    console.log('📦 APP WRAPPER STYLES:');
    console.log('  overflow:', wrapperStyles.overflow);
    console.log('  overflowY:', wrapperStyles.overflowY);
    console.log('  height:', wrapperStyles.height);
    console.log('  maxHeight:', wrapperStyles.maxHeight);
    console.log('  position:', wrapperStyles.position);
  }
  
  // Check for fixed overlays
  const fixedElements = document.querySelectorAll('[class*="fixed"], [style*="position: fixed"]');
  console.log('🔒 FIXED ELEMENTS:', fixedElements.length);
  fixedElements.forEach((el, i) => {
    const styles = window.getComputedStyle(el);
    const className = typeof el.className === 'string' 
      ? el.className 
      : ((el.className as any)?.baseVal || Array.from(el.classList || []).join(' ') || '');
    console.log(`  [${i}]`, {
      tag: el.tagName,
      classes: className,
      zIndex: styles.zIndex,
      pointerEvents: styles.pointerEvents,
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity
    });
  });
  
  // Check for elements with overflow hidden
  const overflowHidden = Array.from(document.querySelectorAll('*')).filter(el => {
    const styles = window.getComputedStyle(el);
    return styles.overflow === 'hidden' || styles.overflowY === 'hidden';
  });
  console.log('🚫 ELEMENTS WITH overflow: hidden:', overflowHidden.length);
  if (overflowHidden.length > 0) {
    overflowHidden.slice(0, 10).forEach((el, i) => {
      const styles = window.getComputedStyle(el);
      const className = typeof el.className === 'string' 
        ? el.className.substring(0, 50) 
        : ((el.className as any)?.baseVal || Array.from(el.classList || []).join(' ') || '').substring(0, 50);
      console.log(`  [${i}]`, {
        tag: el.tagName,
        classes: className,
        overflow: styles.overflow,
        overflowY: styles.overflowY,
        height: styles.height
      });
    });
  }
  
  // Check scroll position
  console.log('📊 SCROLL POSITION:');
  console.log('  window.pageYOffset:', window.pageYOffset);
  console.log('  document.documentElement.scrollTop:', document.documentElement.scrollTop);
  console.log('  document.body.scrollTop:', document.body.scrollTop);
  console.log('  window.innerHeight:', window.innerHeight);
  console.log('  window.innerWidth:', window.innerWidth);
  console.log('  document.documentElement.scrollHeight:', document.documentElement.scrollHeight);
  console.log('  document.body.scrollHeight:', document.body.scrollHeight);
  console.log('  document.documentElement.clientHeight:', document.documentElement.clientHeight);
  console.log('  document.body.clientHeight:', document.body.clientHeight);
  
  // Check if scroll is possible
  const htmlCanScroll = document.documentElement.scrollHeight > document.documentElement.clientHeight;
  const bodyCanScroll = document.body.scrollHeight > document.body.clientHeight;
  const viewportCanScroll = document.documentElement.scrollHeight > window.innerHeight;
  console.log('✅ CAN SCROLL CHECK:');
  console.log('  html scrollHeight > clientHeight:', htmlCanScroll, `(${document.documentElement.scrollHeight} > ${document.documentElement.clientHeight})`);
  console.log('  body scrollHeight > clientHeight:', bodyCanScroll, `(${document.body.scrollHeight} > ${document.body.clientHeight})`);
  console.log('  scrollHeight > innerHeight:', viewportCanScroll, `(${document.documentElement.scrollHeight} > ${window.innerHeight})`);
  
  // Check which element is actually scrollable
  console.log('🎯 ACTUAL SCROLL CONTAINER CHECK:');
  const htmlScrollable = htmlStyles.overflowY === 'auto' || htmlStyles.overflowY === 'scroll';
  const bodyScrollable = bodyStyles.overflowY === 'auto' || bodyStyles.overflowY === 'scroll';
  console.log('  html overflowY:', htmlStyles.overflowY, '| scrollable:', htmlScrollable, '| scrollTop:', document.documentElement.scrollTop);
  console.log('  body overflowY:', bodyStyles.overflowY, '| scrollable:', bodyScrollable, '| scrollTop:', document.body.scrollTop);
  
  // Check if content is actually taller
  const contentHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    document.documentElement.offsetHeight,
    document.body.offsetHeight
  );
  console.log('  Total content height:', contentHeight);
  console.log('  Viewport height:', window.innerHeight);
  console.log('  Difference:', contentHeight - window.innerHeight);
  
  // Check #root scrollability
  const rootScrollable = root ? (window.getComputedStyle(root).overflowY === 'auto' || window.getComputedStyle(root).overflowY === 'scroll') : false;
  console.log('  #root is scrollable:', rootScrollable);
  
  // Check for flex containers that might be blocking
  const flexContainers = Array.from(document.querySelectorAll('.flex, [class*="flex"]')).filter(el => {
    const styles = window.getComputedStyle(el);
    return styles.display === 'flex' && (styles.height === '100vh' || styles.height === '100%' || styles.minHeight === '100vh');
  });
  console.log('🔒 FLEX CONTAINERS WITH HEIGHT CONSTRAINTS:', flexContainers.length);
  flexContainers.slice(0, 5).forEach((el, i) => {
    const styles = window.getComputedStyle(el);
    const className = typeof el.className === 'string' 
      ? el.className.substring(0, 80) 
      : ((el.className as any)?.baseVal || Array.from(el.classList || []).join(' ') || '').substring(0, 80);
    console.log(`  [${i}]`, {
      tag: el.tagName,
      classes: className,
      height: styles.height,
      minHeight: styles.minHeight,
      maxHeight: styles.maxHeight,
      overflow: styles.overflow,
      overflowY: styles.overflowY,
      position: styles.position
    });
  });
  
  console.groupEnd();
  
  return {
    bodyOverflow: bodyStyles.overflow,
    bodyOverflowY: bodyStyles.overflowY,
    htmlOverflowY: htmlStyles.overflowY,
    canScroll: viewportCanScroll,
    htmlCanScroll,
    bodyCanScroll,
    fixedElementsCount: fixedElements.length,
    overflowHiddenCount: overflowHidden.length
  };
};

// Monitor wheel events
export const monitorWheelEvents = () => {
  let wheelEventCount = 0;
  let preventedCount = 0;
  let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  const wheelHandler = (e: WheelEvent) => {
    wheelEventCount++;
    if (e.defaultPrevented) {
      preventedCount++;
      console.warn('⚠️ WHEEL EVENT PREVENTED:', {
        count: preventedCount,
        target: e.target,
        currentTarget: e.currentTarget,
        timeStamp: e.timeStamp
      });
    }
    
    // Check if scroll actually changed after wheel event
    setTimeout(() => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScrollTop === lastScrollTop && Math.abs(e.deltaY) > 0) {
        console.warn('🚨 WHEEL EVENT FIRED BUT SCROLL DID NOT CHANGE!', {
          deltaY: e.deltaY,
          scrollTop: currentScrollTop,
          target: e.target,
          targetTag: (e.target as Element)?.tagName,
          targetClasses: typeof (e.target as Element)?.className === 'string' 
            ? (e.target as Element).className.substring(0, 50)
            : ''
        });
      }
      lastScrollTop = currentScrollTop;
    }, 50);
    
    if (wheelEventCount % 10 === 0) {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      console.log('🖱️ Wheel events:', wheelEventCount, 'Prevented:', preventedCount, 'ScrollTop:', currentScrollTop);
    }
  };
  
  // Listen on document and window
  document.addEventListener('wheel', wheelHandler, { passive: true, capture: true });
  window.addEventListener('wheel', wheelHandler, { passive: true, capture: true });
  
  console.log('👂 Monitoring wheel events...');
  
  return () => {
    document.removeEventListener('wheel', wheelHandler, { capture: true });
    window.removeEventListener('wheel', wheelHandler, { capture: true });
  };
};

// Check for event listeners that might prevent scroll
export const checkEventListeners = () => {
  console.group('🎧 EVENT LISTENER CHECK');
  
  // Check if we can detect passive listeners (limited browser support)
  let hasPassiveSupport = false;
  
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        hasPassiveSupport = true;
        return false;
      }
    });
    const testHandler = () => {};
    window.addEventListener('test', testHandler, opts);
    window.removeEventListener('test', testHandler, opts);
  } catch (e) {
    // Passive not supported
  }
  
  console.log('Passive event listener support:', hasPassiveSupport);
  console.log('Note: Cannot directly inspect existing listeners, but monitoring wheel events');
  
  console.groupEnd();
};
