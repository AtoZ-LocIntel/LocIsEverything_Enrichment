# 🚀 Vercel Deployment Guide

## **Quick Deploy to Vercel**

### **Option 1: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Follow prompts:
# - Set up and deploy: Yes
# - Which scope: Select your account
# - Link to existing project: No
# - Project name: locis-everything-enrichment
# - Directory: ./ (current directory)
# - Override settings: No
```

### **Option 2: GitHub Integration**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect it's a Vite React app
6. Click "Deploy"

## **Build Configuration**

The project is already configured for Vercel:

- ✅ **Build Command**: `npm run build`
- ✅ **Output Directory**: `dist`
- ✅ **Framework**: Vite
- ✅ **Node Version**: Auto-detected (18.x+)

## **Environment Variables**

No environment variables are required for basic functionality. The app uses free public APIs with built-in rate limiting.

## **Performance Optimizations**

- ✅ **Code Splitting**: Vendor, Leaflet, and utility chunks
- ✅ **Asset Optimization**: CSS and JS minification
- ✅ **Caching**: Static assets cached for 1 year
- ✅ **Security Headers**: XSS protection, content type options

## **Post-Deployment**

1. **Test the app**: Verify all features work
2. **Check console**: Monitor for any errors
3. **Performance**: Use Vercel Analytics if needed
4. **Custom Domain**: Add your domain in Vercel dashboard

## **Troubleshooting**

### **Build Failures**
- Ensure all dependencies are in `package.json`
- Check TypeScript compilation: `npm run build`
- Verify Node.js version (18.x+)

### **Runtime Errors**
- Check browser console for errors
- Verify CORS proxy functionality
- Test with small batches first

## **Rate Limiting Notes**

The app automatically handles rate limiting for free APIs:
- **Nominatim**: 1 request/second
- **US Census**: 10 requests/second  
- **GeoNames**: 4 requests/second

Large batches will take longer but are fully supported with clear user expectations.

## **Support**

For deployment issues:
1. Check Vercel build logs
2. Verify local build works: `npm run build`
3. Check browser console for runtime errors
