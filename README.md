# LocIsEverything - Advanced Location Intelligence Platform

A professional geocoding and enrichment platform that provides comprehensive location intelligence through multi-source data integration. Built with React, TypeScript, and modern web technologies.

## 🌟 Features

### 🗺️ Multi-Source Geocoding
- **OpenStreetMap Nominatim** - Global address geocoding
- **GeoNames** - Geographic database with detailed place information
- **NYC PLUTO** - NYC parcel-level geocoding (ArcGIS Feature Service)
- **Postcodes.io** - UK postcode geocoding
- **Composite Geocoder** - Intelligent fallback and result ranking

### 📊 Comprehensive Enrichment
- **Core Attributes**: Elevation, Air Quality, Census IDs, Demographics, Weather Alerts
- **Community POIs**: Schools, Hospitals, Parks, Places of Worship
- **Community & Services**: Grocery stores, restaurants, banks, pharmacies, and commercial services
- **Health & Wellness**: Medical facilities, fitness centers, dental care
- **Transportation**: Airports, railroads, trails, public transit
- **Infrastructure**: Power plants, substations, cell towers
- **Environment & Hazards**: Earthquakes, flood zones, volcanoes
- **Recreation**: Trailheads, visitor centers, campgrounds

### 🔧 Advanced Features
- **Single Address Search** - Individual location lookup and enrichment
- **Batch CSV Processing** - Upload CSV files for bulk processing
- **Flexible Field Mapping** - Support for single address column or component-based mapping
- **Configurable Search Radii** - Customizable POI search distances
- **Interactive Map View** - Leaflet-based visualization with result popups
- **CSV Export** - Download enriched results for analysis

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LocIsEverything_Enrichment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## 🏗️ Architecture

### Core Components

- **CompositeGeocoder** - Orchestrates multiple geocoding adapters with rate limiting and fallback
- **EnrichmentService** - Manages enrichment data retrieval from various APIs
- **React Components** - Modern, responsive UI built with TypeScript and Tailwind CSS

### Data Flow

1. **Input** → Address string or CSV file
2. **Geocoding** → Multi-source geocoding with confidence ranking
3. **Enrichment** → Parallel enrichment from selected data sources
4. **Output** → Interactive map view + CSV export

### API Integrations

- **Open-Meteo** - Elevation and air quality data
- **US Census Bureau** - FIPS codes and ACS demographics
- **National Weather Service** - Weather alerts
- **USGS** - Earthquake and volcano data
- **FEMA** - Flood hazard zones
- **EPA** - Facility registry and environmental data

## 📁 Project Structure

```
src/
├── components/          # React UI components
│   ├── Header.tsx      # Navigation and branding
│   ├── SingleSearch.tsx # Individual address search
│   ├── BatchProcessing.tsx # CSV upload and processing
│   ├── EnrichmentConfig.tsx # Enrichment options configuration
│   └── MapView.tsx     # Interactive map display
├── lib/                # Core geocoding logic
│   ├── composite.ts    # Composite geocoder implementation
│   └── types.ts        # TypeScript type definitions
├── adapters/           # Geocoding service adapters
│   ├── geonames.ts     # GeoNames integration
│   ├── nominatum.ts    # OpenStreetMap Nominatim
│   ├── pluto.ts        # NYC PLUTO parcel data
│   └── postcodesio.ts  # UK postcode service
├── services/           # Business logic services
│   └── EnrichmentService.ts # Enrichment orchestration
└── main.tsx           # Application entry point
```

## 🎯 Usage Examples

### Single Address Search

1. Navigate to the Single Address Search section
2. Enter an address (e.g., "123 Main St, Boston, MA 02108")
3. Select desired enrichments from the configuration panel
4. Click "Search & Enrich"
5. View results on the interactive map

### Batch Processing

1. Upload a CSV file with address data
2. Map CSV columns to address components or use a single address column
3. Configure enrichment options and search radii
4. Start batch processing
5. Monitor progress and download results

### Enrichment Configuration

- **Core Attributes**: Always available, no radius configuration needed
- **POI Categories**: Configure search radius (0.1 to 100 miles)
- **Grouped by Category**: Organized for easy selection and management

## 🔧 Configuration

### Environment Variables

```bash
# Optional: GeoNames username for higher rate limits
GEONAMES_USER=your_username

# Optional: OpenCellID API key for cell tower data
OPENCELLID_KEY=your_api_key
```

### Rate Limiting

Each geocoding service has built-in rate limiting:
- **Nominatim**: 1 request/second
- **GeoNames**: 5 requests/second  
- **PLUTO**: 3 requests/second
- **Postcodes.io**: 10 requests/second

### Customization

- Add new geocoding adapters in `src/adapters/`
- Extend enrichment options in `src/services/EnrichmentService.ts`
- Modify UI components in `src/components/`

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: The platform includes CORS proxy fallbacks for external APIs
2. **Rate Limiting**: Built-in delays prevent API throttling
3. **Geocoding Failures**: Automatic fallback to alternative services

### Debug Mode

Enable console logging for detailed debugging:
```typescript
// In EnrichmentService.ts
console.log('Geocoding query:', geocodeQuery);
console.log('Enrichment results:', enrichments);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenStreetMap** - Base map data and Nominatim service
- **GeoNames** - Geographic database and API
- **US Census Bureau** - Demographic and geographic data
- **Leaflet** - Interactive mapping library
- **Tailwind CSS** - Utility-first CSS framework

## 📞 Support

For questions, issues, or feature requests:
- Create an issue in the GitHub repository
- Check the documentation and examples
- Review the troubleshooting section

---

**Built with ❤️ for the location intelligence community**
