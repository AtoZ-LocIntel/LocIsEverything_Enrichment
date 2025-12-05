import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// CRITICAL: mobile-fixes.css MUST load last to override everything
import './mobile-fixes.css'

// Cache-busting mechanism for assets
const addCacheBustingToAssets = () => {
  const timestamp = Date.now();
  
  // Add cache-busting to all img tags
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && !src.includes('?v=')) {
      img.setAttribute('src', `${src}?v=${timestamp}`);
    }
  });
  
  // Add cache-busting to CSS and JS files
  const links = document.querySelectorAll('link[rel="stylesheet"], script[src]');
  links.forEach(link => {
    const href = link.getAttribute('href') || link.getAttribute('src');
    if (href && !href.includes('?v=') && !href.startsWith('http')) {
      if (link.tagName === 'LINK') {
        link.setAttribute('href', `${href}?v=${timestamp}`);
      } else {
        link.setAttribute('src', `${href}?v=${timestamp}`);
      }
    }
  });
  
  console.log('🔄 Applied cache-busting to assets with timestamp:', timestamp);
};

// Apply cache-busting when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addCacheBustingToAssets);
} else {
  addCacheBustingToAssets();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
