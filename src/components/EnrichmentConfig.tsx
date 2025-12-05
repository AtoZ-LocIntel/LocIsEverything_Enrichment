import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Settings, TreePine, Check, ArrowLeft } from 'lucide-react';
import { poiConfigManager } from '../lib/poiConfig';

interface EnrichmentConfigProps {
  selectedEnrichments: string[];
  onSelectionChange: (enrichments: string[]) => void;
  poiRadii: Record<string, number>;
  onPoiRadiiChange: (radii: Record<string, number>) => void;
  onViewCategory?: (category: EnrichmentCategory) => void;
  onModalStateChange?: (isModalOpen: boolean) => void;
  onTotalLayersChange?: (count: number) => void;
}

interface EnrichmentCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  enrichments: EnrichmentItem[];
  subCategories?: EnrichmentCategory[]; // Support for nested sub-categories
}

interface EnrichmentItem {
  id: string;
  label: string;
  description: string;
  isPOI: boolean;
  defaultRadius: number;
  category: string;
}

// Core enrichments (non-POI)
const CORE_ENRICHMENTS = [
  { id: 'elev', label: 'Elevation', description: 'Terrain elevation in feet', isPOI: false, defaultRadius: 0, category: 'core' },
  { id: 'airq', label: 'Air Quality', description: 'PM2.5 air quality index', isPOI: false, defaultRadius: 0, category: 'core' },
  { id: 'fips', label: 'Census IDs', description: 'FIPS codes for state/county/tract', isPOI: false, defaultRadius: 0, category: 'core' },
  { id: 'acs', label: 'Demographics', description: 'ACS population and income data', isPOI: false, defaultRadius: 0, category: 'core' },
  { id: 'nws_alerts', label: 'Weather Alerts', description: 'Active NWS weather alerts', isPOI: false, defaultRadius: 0, category: 'core' }
];

// Icon mapping for sections
const SECTION_ICONS: Record<string, React.ReactNode> = {
  core: <Settings className="w-5 h-5" />,
  hazards: <img src="/assets/human_hazards.webp" alt="Human Caused Hazards" className="w-8 h-8" />,
  community: <span className="text-xl">👥</span>,
  retail: <span className="text-xl">🏢</span>,
  health: <span className="text-xl">❤️</span>,
  transportation: <span className="text-xl">🚌</span>,
  infrastructure: <span className="text-xl">⚡</span>,
  environment: <TreePine className="w-5 h-5" />,
  recreation: <span className="text-xl">🎯</span>,
  natural_resources: <span className="text-xl">🏔️</span>,
  public_lands: <span className="text-xl">🏞️</span>,
  quirky: <span className="text-xl">☕</span>,
  wildfire: <img src="/assets/wildfire.webp" alt="Natural Hazards" className="w-5 h-5" />,
  at: <img src="/assets/at.webp" alt="Appalachian Trail" className="w-5 h-5" />,
  pct: <img src="/assets/pct.webp" alt="Pacific Crest Trail" className="w-5 h-5" />,
  nh: <img src="/assets/newhampshire.webp" alt="New Hampshire Open Data" className="w-5 h-5" />,
  ma: <img src="/assets/MA.webp" alt="Massachusetts Open Data" className="w-5 h-5" />,
  ma_massgis: <img src="/assets/MassGIS.webp" alt="MassGIS" className="w-5 h-5" />,
  ri: <img src="/assets/RI.webp" alt="Rhode Island Open Data" className="w-5 h-5" />,
  ct: <img src="/assets/CT.webp" alt="Connecticut Open Data" className="w-5 h-5" />,
  ny: <img src="/assets/NY.webp" alt="New York Open Data" className="w-5 h-5" />,
  vt: <img src="/assets/VT.webp" alt="Vermont Open Data" className="w-5 h-5" />,
  me: <img src="/assets/ME.webp" alt="Maine Open Data" className="w-5 h-5" />,
  nj: <img src="/assets/NJ.webp" alt="New Jersey Open Data" className="w-5 h-5" />,
  pa: <img src="/assets/PA.webp" alt="Pennsylvania Open Data" className="w-5 h-5" />,
  de: <img src="/assets/DE.webp" alt="Delaware Open Data" className="w-5 h-5" />,
  wv: <img src="/assets/WV.webp" alt="West Virginia Open Data" className="w-5 h-5" />,
  ca: <img src="/assets/CA.webp" alt="California Open Data" className="w-5 h-5" />,
  ga: <img src="/assets/GA.webp" alt="Georgia Open Data" className="w-5 h-5" />,
  sc: <img src="/assets/SC.webp" alt="South Carolina Open Data" className="w-5 h-5" />,
  nc: <img src="/assets/NC.webp" alt="North Carolina Open Data" className="w-5 h-5" />,
  md: <img src="/assets/MD.webp" alt="Maryland Open Data" className="w-5 h-5" />,
  dc: <img src="/assets/DC.webp" alt="District of Columbia Open Data" className="w-5 h-5" />,
  va: <img src="/assets/VA.webp" alt="Virginia Open Data" className="w-5 h-5" />,
  fl: <img src="/assets/FL.webp" alt="Florida Open Data" className="w-5 h-5" />,
  tx: <img src="/assets/TX.webp" alt="Texas Open Data" className="w-5 h-5" />,
  nm: <img src="/assets/NM.webp" alt="New Mexico Open Data" className="w-5 h-5" />,
  az: <img src="/assets/AZ.webp" alt="Arizona Open Data" className="w-5 h-5" />,
  ak: <img src="/assets/AK.webp" alt="Alaska Open Data" className="w-5 h-5" />,
  hi: <img src="/assets/HI.webp" alt="Hawaii Open Data" className="w-5 h-5" />,
  wa: <img src="/assets/WA.webp" alt="Washington Open Data" className="w-5 h-5" />,
  or: <img src="/assets/OR.webp" alt="Oregon Open Data" className="w-5 h-5" />,
  mt: <img src="/assets/MT.webp" alt="Montana Open Data" className="w-5 h-5" />,
  wy: <img src="/assets/WY.webp" alt="Wyoming Open Data" className="w-5 h-5" />,
  nv: <img src="/assets/NV.webp" alt="Nevada Open Data" className="w-5 h-5" />,
  id: <img src="/assets/ID.webp" alt="Idaho Open Data" className="w-5 h-5" />,
  ut: <img src="/assets/UT.webp" alt="Utah Open Data" className="w-5 h-5" />,
  co: <img src="/assets/CO.webp" alt="Colorado Open Data" className="w-5 h-5" />,
  il: <img src="/assets/IL.webp" alt="Illinois Open Data" className="w-5 h-5" />,
  custom: <span className="text-xl">🔧</span>
};




const EnrichmentConfig: React.FC<EnrichmentConfigProps> = ({ 
  selectedEnrichments, 
  onSelectionChange, 
  poiRadii, 
  onPoiRadiiChange,
  onViewCategory,
  onModalStateChange,
  onTotalLayersChange
}) => {
  const [enrichmentCategories, setEnrichmentCategories] = useState<EnrichmentCategory[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [viewingNHSubCategories, setViewingNHSubCategories] = useState(false);
  const [viewingMASubCategories, setViewingMASubCategories] = useState(false);
  const [viewingCTSubCategories, setViewingCTSubCategories] = useState(false);
  const [viewingDESubCategories, setViewingDESubCategories] = useState(false);
  const [viewingNJSubCategories, setViewingNJSubCategories] = useState(false);
  const [viewingWVSubCategories, setViewingWVSubCategories] = useState(false);
  const [viewingCASubCategories, setViewingCASubCategories] = useState(false);
  const [viewingGASubCategories, setViewingGASubCategories] = useState(false);
  const [viewingSCSubCategories, setViewingSCSubCategories] = useState(false);
  const [viewingNCSubCategories, setViewingNCSubCategories] = useState(false);
  const [viewingMDSubCategories, setViewingMDSubCategories] = useState(false);
  const [viewingDCSubCategories, setViewingDCSubCategories] = useState(false);
  const [viewingVASubCategories, setViewingVASubCategories] = useState(false);
  const [viewingFLSubCategories, setViewingFLSubCategories] = useState(false);
  const [viewingNYSubCategories, setViewingNYSubCategories] = useState(false);
  const [viewingPASubCategories, setViewingPASubCategories] = useState(false);
  const [viewingRISubCategories, setViewingRISubCategories] = useState(false);
  const [viewingVTSubCategories, setViewingVTSubCategories] = useState(false);
  const [viewingTXSubCategories, setViewingTXSubCategories] = useState(false);
  const [viewingNMSubCategories, setViewingNMSubCategories] = useState(false);
  const [viewingAZSubCategories, setViewingAZSubCategories] = useState(false);
  const [viewingAKSubCategories, setViewingAKSubCategories] = useState(false);
  const [viewingHISubCategories, setViewingHISubCategories] = useState(false);
  const [viewingWASubCategories, setViewingWASubCategories] = useState(false);
  const [viewingORSubCategories, setViewingORSubCategories] = useState(false);
  const [viewingMTSubCategories, setViewingMTSubCategories] = useState(false);
  const [viewingWYSubCategories, setViewingWYSubCategories] = useState(false);
  const [viewingNVSubCategories, setViewingNVSubCategories] = useState(false);
  const [viewingIDSubCategories, setViewingIDSubCategories] = useState(false);
  const [viewingUTSubCategories, setViewingUTSubCategories] = useState(false);
  const [viewingCOSubCategories, setViewingCOSubCategories] = useState(false);
  const [viewingILSubCategories, setViewingILSubCategories] = useState(false);
  const [cameFromNHSubCategories, setCameFromNHSubCategories] = useState(false);
  const [cameFromMASubCategories, setCameFromMASubCategories] = useState(false);
  const [cameFromCTSubCategories, setCameFromCTSubCategories] = useState(false);
  const [cameFromDESubCategories, setCameFromDESubCategories] = useState(false);
  const [cameFromNJSubCategories, setCameFromNJSubCategories] = useState(false);
  const [cameFromWVSubCategories, setCameFromWVSubCategories] = useState(false);
  const [cameFromCASubCategories, setCameFromCASubCategories] = useState(false);
  const [cameFromGASubCategories, setCameFromGASubCategories] = useState(false);
  const [cameFromSCSubCategories, setCameFromSCSubCategories] = useState(false);
  const [cameFromNCSubCategories, setCameFromNCSubCategories] = useState(false);
  const [cameFromMDSubCategories, setCameFromMDSubCategories] = useState(false);
  const [cameFromDCSubCategories, setCameFromDCSubCategories] = useState(false);
  const [cameFromVASubCategories, setCameFromVASubCategories] = useState(false);
  const [cameFromFLSubCategories, setCameFromFLSubCategories] = useState(false);
  const [cameFromNYSubCategories, setCameFromNYSubCategories] = useState(false);
  const [cameFromPASubCategories, setCameFromPASubCategories] = useState(false);
  const [cameFromRISubCategories, setCameFromRISubCategories] = useState(false);
  const [cameFromVTSubCategories, setCameFromVTSubCategories] = useState(false);
  const [cameFromTXSubCategories, setCameFromTXSubCategories] = useState(false);
  const [cameFromNMSubCategories, setCameFromNMSubCategories] = useState(false);
  const [cameFromAZSubCategories, setCameFromAZSubCategories] = useState(false);
  const [cameFromAKSubCategories, setCameFromAKSubCategories] = useState(false);
  const [cameFromHISubCategories, setCameFromHISubCategories] = useState(false);
  const [cameFromWASubCategories, setCameFromWASubCategories] = useState(false);
  const [cameFromORSubCategories, setCameFromORSubCategories] = useState(false);
  const [cameFromMTSubCategories, setCameFromMTSubCategories] = useState(false);
  const [cameFromWYSubCategories, setCameFromWYSubCategories] = useState(false);
  const [cameFromNVSubCategories, setCameFromNVSubCategories] = useState(false);
  const [cameFromIDSubCategories, setCameFromIDSubCategories] = useState(false);
  const [cameFromUTSubCategories, setCameFromUTSubCategories] = useState(false);
  const [cameFromCOSubCategories, setCameFromCOSubCategories] = useState(false);
  const [cameFromILSubCategories, setCameFromILSubCategories] = useState(false);
  
  // Notify parent when modal state changes
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(activeModal !== null || viewingNHSubCategories || viewingMASubCategories || viewingCTSubCategories || viewingDESubCategories || viewingNJSubCategories || viewingWVSubCategories || viewingCASubCategories || viewingGASubCategories || viewingSCSubCategories || viewingNCSubCategories || viewingMDSubCategories || viewingDCSubCategories || viewingVASubCategories || viewingFLSubCategories || viewingNYSubCategories || viewingPASubCategories || viewingRISubCategories || viewingVTSubCategories || viewingTXSubCategories || viewingNMSubCategories || viewingAZSubCategories || viewingAKSubCategories || viewingHISubCategories || viewingWASubCategories || viewingORSubCategories || viewingMTSubCategories || viewingWYSubCategories || viewingNVSubCategories || viewingIDSubCategories || viewingUTSubCategories || viewingCOSubCategories || viewingILSubCategories);
    }
  }, [activeModal, viewingNHSubCategories, viewingMASubCategories, viewingCTSubCategories, viewingDESubCategories, viewingNJSubCategories, viewingWVSubCategories, viewingCASubCategories, viewingGASubCategories, viewingSCSubCategories, viewingNCSubCategories, viewingMDSubCategories, viewingDCSubCategories, viewingVASubCategories, viewingFLSubCategories, viewingNYSubCategories, viewingPASubCategories, viewingRISubCategories, viewingVTSubCategories, viewingTXSubCategories, viewingNMSubCategories, viewingAZSubCategories, viewingAKSubCategories, viewingHISubCategories, viewingWASubCategories, viewingORSubCategories, viewingMTSubCategories, viewingWYSubCategories, viewingNVSubCategories, viewingIDSubCategories, viewingUTSubCategories, viewingCOSubCategories, viewingILSubCategories, onModalStateChange]); // Track if viewing state sub-categories page
  const [isMobile, setIsMobile] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  // const [mobileView, setMobileView] = useState<'landing' | 'category'>('landing'); // Unused after removing mobile view
  // const [activeCategory, setActiveCategory] = useState<string | null>(null); // Unused after removing mobile view

  // Mobile detection - use window width directly to ensure it works
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      // Debug log to verify mobile detection
      if (isMobileDevice) {
        console.log('📱 Mobile detected, width:', window.innerWidth);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Handle modal body scroll prevention (desktop only)
  useEffect(() => {
    if (activeModal && !isMobile) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [activeModal, isMobile]);


  // Scroll to top when modal opens
  useEffect(() => {
    if (activeModal) {
      console.log('Modal opened:', activeModal);
      // Multiple attempts to ensure scroll to top works
      const scrollToTop = () => {
        // Scroll the modal content to top
        if (modalContentRef.current) {
          console.log('Scrolling modal content to top');
          modalContentRef.current.scrollTop = 0;
          modalContentRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        
        // Scroll the main window to top
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        
        // Force scroll all possible scroll containers
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Try to scroll any parent containers
        const modalContainer = document.querySelector('.fixed.inset-0.bg-white');
        if (modalContainer) {
          modalContainer.scrollTop = 0;
        }
      };
      
      // Immediate scroll
      scrollToTop();
      
      // Delayed scroll to ensure DOM is fully rendered
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 100);
      setTimeout(scrollToTop, 200);
    }
  }, [activeModal]);

  // Load dynamic POI configuration
  useEffect(() => {
    const loadEnrichmentCategories = () => {
      const sections = poiConfigManager.getAllSections();
      const poiTypes = poiConfigManager.getAllPOITypes();
      
      const categories: EnrichmentCategory[] = sections.map(section => {
        const sectionPOIs = poiTypes.filter(poi => poi.section === section.id);
        const sectionEnrichments = section.id === 'core' 
          ? CORE_ENRICHMENTS 
          : sectionPOIs.map(poi => ({
              id: poi.id,
              label: poi.label,
              description: poi.description,
              isPOI: poi.isPOI,
              defaultRadius: poi.defaultRadius,
              category: poi.category
            }));
        
        // Special handling for NH - add sub-categories based on data sources
        if (section.id === 'nh') {
          // Get NH GRANIT enrichments (filter POIs where section is 'nh')
          const nhGranitPOIs = poiTypes.filter(poi => poi.section === 'nh');
          console.log('🔍 Loading NH GRANIT enrichments:', {
            allPOITypes: poiTypes.length,
            nhPOIs: nhGranitPOIs.length,
            nhPOIIds: nhGranitPOIs.map(p => p.id)
          });
          const nhGranitEnrichments = nhGranitPOIs.map(poi => ({
            id: poi.id,
            label: poi.label,
            description: poi.description,
            isPOI: poi.isPOI,
            defaultRadius: poi.defaultRadius,
            category: poi.category
          }));
          
          console.log('✅ NH GRANIT Enrichments created:', {
            count: nhGranitEnrichments.length,
            enrichments: nhGranitEnrichments.map(e => e.id)
          });
          
          // Define NH sub-categories (organized by data source)
          const nhSubCategories: EnrichmentCategory[] = [
            {
              id: 'nh_granit',
              title: 'NH GRANIT',
              icon: <img src="/assets/NHgranit.webp" alt="NH GRANIT" className="w-full h-full object-cover rounded-full" />,
              description: 'New Hampshire Geographic Reference Information Network (GRANIT) data layers',
              enrichments: nhGranitEnrichments
            }
          ];
          
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [], // NH parent category has no direct enrichments
            subCategories: nhSubCategories
          };
        }
        
        // Special handling for MA - add sub-categories based on data sources
        if (section.id === 'ma') {
          // Filter enrichments for MassGIS sub-category (same pattern as NH GRANIT)
          const maMassGISPOIs = poiTypes.filter(poi => poi.section === 'ma' && poi.category === 'ma');
          
          console.log('🔍 Loading MA MassGIS enrichments:', {
            allPOITypes: poiTypes.length,
            maPOIs: maMassGISPOIs.length,
            maPOIIds: maMassGISPOIs.map(p => p.id)
          });
          
          const maMassGISEnrichments = maMassGISPOIs.map(poi => ({
            id: poi.id,
            label: poi.label,
            description: poi.description,
            isPOI: poi.isPOI,
            defaultRadius: poi.defaultRadius,
            category: poi.category
          }));
          
          console.log('✅ MA MassGIS Enrichments created:', {
            count: maMassGISEnrichments.length,
            enrichments: maMassGISEnrichments.map(e => e.id)
          });
          
          // Define MA sub-categories
          const maSubCategories: EnrichmentCategory[] = [
            {
              id: 'ma_massgis',
              title: 'MassGIS',
              icon: <img src="/assets/MassGIS.webp" alt="MassGIS" className="w-full h-full object-cover rounded-full" />,
              description: 'Massachusetts Geographic Information System data layers',
              enrichments: maMassGISEnrichments
            }
          ];
          
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [], // MA parent category has no direct enrichments
            subCategories: maSubCategories
          };
        }
        
        // Special handling for CT - add sub-categories based on data sources
        if (section.id === 'ct') {
          // Get CT Geodata Portal enrichments (filter POIs where section is 'ct')
          const ctGeoDataPortalPOIs = poiTypes.filter(poi => poi.section === 'ct');
          const ctGeoDataPortalEnrichments = ctGeoDataPortalPOIs.map(poi => ({
            id: poi.id,
            label: poi.label,
            description: poi.description,
            isPOI: poi.isPOI,
            defaultRadius: poi.defaultRadius,
            category: poi.category
          }));
          
          // Define CT sub-categories (organized by data source)
          const ctSubCategories: EnrichmentCategory[] = [
            {
              id: 'ct_geodata_portal',
              title: 'CT Geodata Portal',
              icon: <img src="/assets/CT_GeoDataPortal.webp" alt="CT Geodata Portal" className="w-full h-full object-cover rounded-full" />,
              description: 'Connecticut Geodata Portal data layers',
              enrichments: ctGeoDataPortalEnrichments
            }
          ];
          
          console.log('🔵 CT SECTION PROCESSED - Sub-categories:', ctSubCategories.length, ctSubCategories.map(sc => sc.id));
          
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [], // CT parent category has no direct enrichments
            subCategories: ctSubCategories
          };
        }
        
        // Special handling for DE - add sub-categories based on data sources
        if (section.id === 'de') {
          // Get DE FirstMap enrichments (filter POIs where section is 'de')
          const deFirstMapPOIs = poiTypes.filter(poi => poi.section === 'de');
          const deFirstMapEnrichments = deFirstMapPOIs.map(poi => ({
            id: poi.id,
            label: poi.label,
            description: poi.description,
            isPOI: poi.isPOI,
            defaultRadius: poi.defaultRadius,
            category: poi.category
          }));
          
          // Define DE sub-categories (organized by data source)
          const deSubCategories: EnrichmentCategory[] = [
            {
              id: 'de_firstmap',
              title: 'DE FirstMap',
              icon: <img src="/assets/DEfirstmap.webp" alt="DE FirstMap" className="w-full h-full object-cover rounded-full" />,
              description: 'Delaware FirstMap data layers',
              enrichments: deFirstMapEnrichments
            }
          ];
          
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [], // DE parent category has no direct enrichments
            subCategories: deSubCategories
          };
        }
        
        // Special handling for NJ - add sub-categories based on data sources
        if (section.id === 'nj') {
          // Get all NJ enrichments (filter POIs where section is 'nj')
          const njPOIs = poiTypes.filter(poi => poi.section === 'nj');
          
          // Split into NJGIN and NJDEP based on description
          const njGINPOIs = njPOIs.filter(poi => poi.description.includes('NJGIN'));
          const njDEPPOIs = njPOIs.filter(poi => poi.description.includes('NJDEP'));
          
          const njGINEnrichments = njGINPOIs.map(poi => ({
            id: poi.id,
            label: poi.label,
            description: poi.description,
            isPOI: poi.isPOI,
            defaultRadius: poi.defaultRadius,
            category: poi.category
          }));
          
          const njDEPEnrichments = njDEPPOIs.map(poi => ({
            id: poi.id,
            label: poi.label,
            description: poi.description,
            isPOI: poi.isPOI,
            defaultRadius: poi.defaultRadius,
            category: poi.category
          }));
          
          // Define NJ sub-categories (organized by data source)
          const njSubCategories: EnrichmentCategory[] = [
            {
              id: 'nj_gin',
              title: 'NJGIN',
              icon: <img src="/assets/NJGIN.webp" alt="NJGIN" className="w-full h-full object-cover rounded-full" />,
              description: 'New Jersey Geographic Information Network data layers',
              enrichments: njGINEnrichments
            },
            {
              id: 'nj_dep',
              title: 'NJDEP Bureau of GIS',
              icon: <img src="/assets/NJDEP.webp" alt="NJDEP Bureau of GIS" className="w-full h-full object-cover rounded-full" />,
              description: 'New Jersey Department of Environmental Protection Bureau of GIS data layers',
              enrichments: njDEPEnrichments
            }
          ];
          
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [], // NJ parent category has no direct enrichments
            subCategories: njSubCategories
          };
        }
        
        if (section.id === 'wv') {
          // WV will have sub-categories (to be added later)
          // For now, return empty category ready for sub-categories
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [], // WV parent category has no direct enrichments
            subCategories: [] // Will be populated when sub-categories are added
          };
        }
        
        if (section.id === 'ca') {
          // Get CA Open Data Portal enrichments (filter POIs where section is 'ca')
          const caOpenDataPortalPOIs = poiTypes.filter(poi => poi.section === 'ca');
          const caOpenDataPortalEnrichments = caOpenDataPortalPOIs.map(poi => ({
            id: poi.id,
            label: poi.label,
            description: poi.description,
            isPOI: poi.isPOI,
            defaultRadius: poi.defaultRadius,
            category: poi.category
          }));
          
          // Define CA sub-categories (organized by data source)
          const caSubCategories: EnrichmentCategory[] = [
            {
              id: 'ca_open_data_portal',
              title: 'CA Open Data Portal',
              icon: <img src="/assets/CAopendataportal.webp" alt="CA Open Data Portal" className="w-full h-full object-cover rounded-full" />,
              description: 'California Open Data Portal data layers',
              enrichments: caOpenDataPortalEnrichments
            }
          ];
          
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [], // CA parent category has no direct enrichments
            subCategories: caSubCategories
          };
        }
        
        if (section.id === 'ga') {
          // GA will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'sc') {
          // SC will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'nc') {
          // NC will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'md') {
          // MD will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'dc') {
          // DC will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'va') {
          // VA will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'fl') {
          // FL will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'tx') {
          // TX will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'nm') {
          // NM will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'az') {
          // AZ will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'ak') {
          // AK will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'hi') {
          // HI will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'wa') {
          // WA will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'or') {
          // OR will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'mt') {
          // MT will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'wy') {
          // WY will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'nv') {
          // NV will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'id') {
          // ID will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'ut') {
          // UT will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'co') {
          // CO will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        if (section.id === 'il') {
          // IL will have sub-categories (to be added later)
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [],
            subCategories: []
          };
        }
        
        return {
          id: section.id,
          title: section.title,
          icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
          description: section.description,
          enrichments: sectionEnrichments
        };
      });
      
      setEnrichmentCategories(categories);
    };

    loadEnrichmentCategories();
    
    // Listen for custom POI updates
    const handleStorageChange = () => {
      loadEnrichmentCategories();
    };
    
    const handleCustomPOIAdded = () => {
      loadEnrichmentCategories();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customPOIAdded', handleCustomPOIAdded);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customPOIAdded', handleCustomPOIAdded);
    };
  }, []);

  // Calculate total count of all open data layers dynamically
  const totalLayersCount = useMemo(() => {
    let total = 0;
    enrichmentCategories.forEach(category => {
      // Count direct enrichments
      total += category.enrichments.length;
      
      // Count sub-category enrichments
      if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach(subCategory => {
          total += subCategory.enrichments.length;
        });
      }
    });
    return total;
  }, [enrichmentCategories]);

  // Notify parent of total layers count when it changes
  useEffect(() => {
    if (onTotalLayersChange && totalLayersCount > 0) {
      onTotalLayersChange(totalLayersCount);
    }
  }, [totalLayersCount, onTotalLayersChange]);

  // Mobile navigation functions - removed since mobile view is disabled

  // const handleMobileBackToLanding = () => {
  //   setMobileView('landing');
  //   setActiveCategory(null);
  // }; // Unused after removing mobile view

  // Map category IDs to icon file names
  const getIconFileName = (categoryId: string): string => {
    const iconMap: { [key: string]: string } = {
      'hazards': 'hazards_risk',
      'community': 'community_services',
      'retail': 'retail_commerce',
      'nh': 'newhampshire',
      'health': 'health_wellness',
      'transportation': 'transportation',
      'infrastructure': 'power_inf',
      'recreation': 'recreation_leisure',
      'natural_resources': 'natural_resources',
      'public_lands': 'public_lands',
      'quirky': 'quirky_and_fun',
      'at': 'at',
      'pct': 'PCT',
      'ma': 'MA',
      'ma_massgis': 'MassGIS',
      'ri': 'RI',
      'ct': 'CT',
      'ny': 'NY',
      'vt': 'VT',
      'me': 'ME',
      'nj': 'NJ',
      'pa': 'PA',
      'de': 'DE',
      'wv': 'WV',
      'ca': 'CA',
      'ga': 'GA',
      'sc': 'SC',
      'nc': 'NC',
      'md': 'MD',
      'dc': 'DC',
      'va': 'VA',
      'fl': 'FL',
      'tx': 'TX',
      'nm': 'NM',
      'az': 'AZ',
      'ak': 'AK',
      'hi': 'HI',
      'wa': 'WA',
      'or': 'OR',
      'mt': 'MT',
      'wy': 'WY',
      'nv': 'NV',
      'id': 'ID',
      'ut': 'UT',
      'co': 'CO',
      'il': 'IL'
    };
    return iconMap[categoryId] || categoryId;
  };

  const handleEnrichmentToggle = (enrichmentId: string) => {
    const newSelected = selectedEnrichments.includes(enrichmentId)
      ? selectedEnrichments.filter(id => id !== enrichmentId)
      : [...selectedEnrichments, enrichmentId];
    onSelectionChange(newSelected);
  };

  const getMaxRadius = (enrichmentId: string): number => {
    // Get max radius from POI config, with fallback to hardcoded values for special cases
    const poiConfig = poiConfigManager.getPOIType(enrichmentId);
    if (poiConfig?.maxRadius) {
      return poiConfig.maxRadius;
    }
    
    // Fallback to hardcoded values for special cases not in POI config
    if (enrichmentId === 'poi_earthquakes') {
      return 25; // Earthquakes can go up to 25 miles
    } else if (enrichmentId === 'poi_volcanoes') {
      return 50; // Volcanoes can go up to 50 miles
    } else if (enrichmentId === 'poi_wildfires') {
      return 50; // Wildfires can go up to 50 miles for risk assessment
    } else if (enrichmentId === 'poi_flood_reference_points') {
      return 25; // Flood reference points can go up to 25 miles
    }
    
    return 5; // Default for most POI types
  };

  const handleRadiusChange = (enrichmentId: string, radius: number) => {
    const maxRadius = getMaxRadius(enrichmentId);
    const minRadius = enrichmentId === 'poi_aurora_viewing_sites' ? 5 : 0.1;
    const cappedRadius = Math.max(minRadius, Math.min(radius, maxRadius));
    onPoiRadiiChange({
      ...poiRadii,
      [enrichmentId]: cappedRadius
    });
  };

  const handleResetAllFilters = () => {
    // Reset all selected enrichments
    onSelectionChange([]);
    // Reset all POI radii to defaults
    const defaultRadii: Record<string, number> = {};
    enrichmentCategories.forEach(category => {
      category.enrichments.forEach(enrichment => {
        if (enrichment.isPOI) {
          defaultRadii[enrichment.id] = enrichment.defaultRadius;
        }
      });
    });
    onPoiRadiiChange(defaultRadii);
  };

  const handleResetApp = () => {
    console.log('🔄 Starting comprehensive app reset from config...');
    
    // Clear all cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        console.log('🗑️ Clearing caches:', names);
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('🗑️ Cleared localStorage and sessionStorage');
    
    // Clear any service worker registrations
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('🗑️ Unregistering service workers:', registrations.length);
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    // Clear IndexedDB if available
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            console.log('🗑️ Deleting IndexedDB:', db.name);
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
    
    // Add cache-busting parameter to force reload
    const timestamp = Date.now();
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_cb', timestamp.toString());
    
    console.log('🔄 Reloading app with cache busting...');
    
    // Force a complete page reload with cache busting
    window.location.href = currentUrl.toString();
  };

  // Mobile full-page view for portrait mode - DISABLED to show grid instead
  // This section has been removed to fix TypeScript compilation errors



  // Mobile landing page for portrait mode - DISABLED to use consistent grid layout
  if (false) { // Disabled mobile landing view
    return (
      <div className="enrichment-config">
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>Enrichment Layers</h3>
                  <p className="text-xs lg:text-sm text-gray-300">Select data sources and configure search parameters</p>
                </div>
              </div>
              
              {/* Reset All Filters Button */}
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button
                  onClick={handleResetAllFilters}
                  className="btn btn-outline flex items-center justify-center space-x-2 text-xs sm:text-sm px-3 py-2 flex-1 sm:flex-none"
                  title="Reset all selected enrichments and radii to defaults"
                >
                  <span className="w-4 h-4">🔄</span>
                  <span className="whitespace-nowrap">Reset All Filters</span>
                </button>
                
                <button
                  onClick={handleResetApp}
                  className="btn btn-outline flex items-center justify-center space-x-2 text-xs sm:text-sm px-3 py-2 flex-1 sm:flex-none"
                  title="Clear browser cache and refresh application to ensure latest code"
                >
                  <span className="w-4 h-4">🔄</span>
                  <span className="whitespace-nowrap">Reset App</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="card-body">
            {/* Custom Icon Category Button Grid - 2 Column Layout */}
            <div className="mb-6 w-full px-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto">
                {enrichmentCategories.map((category) => {
                  const categoryEnrichments = category.enrichments;
                  const selectedCount = categoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                  
                  // Determine ring brightness based on selection count
                  const getRingOpacity = () => {
                    if (selectedCount === 0) return 0;
                    if (selectedCount <= 2) return 0.3;
                    if (selectedCount <= 4) return 0.6;
                    return 0.9;
                  };

                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        // Special handling for NH, MA, and CT - show sub-categories page
                        console.log('🔍 Category clicked:', category.id, {
                          hasSubCategories: !!category.subCategories,
                          subCategoriesLength: category.subCategories?.length || 0,
                          subCategories: category.subCategories?.map(sc => sc.id) || []
                        });
                        if (category.id === 'nh' && category.subCategories && category.subCategories.length > 0) {
                          setViewingNHSubCategories(true);
                        } else if (category.id === 'ma' && category.subCategories && category.subCategories.length > 0) {
                          setViewingMASubCategories(true);
                        } else if (category.id === 'ct' && category.subCategories && category.subCategories.length > 0) {
                          console.log('✅ Setting viewingCTSubCategories to true');
                          setViewingCTSubCategories(true);
                        } else if (category.id === 'de' && category.subCategories && category.subCategories.length > 0) {
                          console.log('✅ Setting viewingDESubCategories to true', {
                            categoryId: category.id,
                            hasSubCategories: !!category.subCategories,
                            subCategoriesLength: category.subCategories.length,
                            subCategoryIds: category.subCategories.map(sc => sc.id)
                          });
                          setViewingDESubCategories(true);
                        } else if (category.id === 'nj' && category.subCategories && category.subCategories.length > 0) {
                          console.log('✅ Setting viewingNJSubCategories to true', {
                            categoryId: category.id,
                            hasSubCategories: !!category.subCategories,
                            subCategoriesLength: category.subCategories.length,
                            subCategoryIds: category.subCategories.map(sc => sc.id)
                          });
                          setViewingNJSubCategories(true);
                        } else if (category.id === 'de') {
                          console.log('⚠️ DE clicked but no sub-categories found', {
                            categoryId: category.id,
                            hasSubCategories: !!category.subCategories,
                            subCategoriesLength: category.subCategories?.length || 0
                          });
                        } else if (onViewCategory) {
                          onViewCategory(category);
                        } else {
                          setActiveModal(category.id);
                        }
                      }}
                      className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                      }}
                    >
                      {/* Custom Icon */}
                      <img
                        src={`/assets/${getIconFileName(category.id)}.webp`}
                        alt={category.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-200"
                        style={{ 
                          objectFit: 'cover',
                          objectPosition: 'center',
                          minWidth: '100%',
                          minHeight: '100%',
                          width: '100%',
                          height: '100%'
                        }}
                        onError={(e) => {
                          // Fallback to category name if icon fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      
                      {/* Fallback Text */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-800 font-semibold text-sm text-center p-2 hidden"
                        style={{ display: 'none' }}
                      >
                        {category.title}
                      </div>
                      
                      {/* Selection Count Badge */}
                      {selectedCount > 0 && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                          {selectedCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Enrichments Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Selected Enrichments</h4>
              <div className="flex flex-wrap gap-2">
                {selectedEnrichments.length === 0 ? (
                  <span className="text-sm text-blue-700">No enrichments selected</span>
                ) : (
                  selectedEnrichments.map(id => {
                    const enrichment = enrichmentCategories
                      .flatMap(c => c.enrichments)
                      .find(e => e.id === id);
                    return (
                      <span key={id} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {enrichment?.label || id}
                        {enrichment?.isPOI && poiRadii[id] && (
                          <span className="ml-1 text-blue-600">({poiRadii[id]}mi)</span>
                        )}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If viewing NJ sub-categories, show full page with round icons
  if (viewingNJSubCategories) {
    const njCategory = enrichmentCategories.find(c => c.id === 'nj');
    const njSubCategories = njCategory?.subCategories || [];
    
    return (
      <div className="enrichment-config">
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewingNJSubCategories(false)}
                  className="text-white text-2xl font-bold p-2 hover:bg-white hover:bg-opacity-20 rounded flex-shrink-0"
                  title="Back to categories"
                >
                  ←
                </button>
                <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>New Jersey Open Data</h3>
                  <p className="text-xs lg:text-sm text-gray-300">Select a category to view available layers</p>
                </div>
              </div>
            </div>
          </div>
            
          <div className="card-body">
            {/* NJ Sub-Category Round Icons Grid - Same layout as home page */}
            <div className="mb-6 w-full px-2 sm:px-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto w-full justify-items-center">
                {njSubCategories.length > 0 ? (
                  njSubCategories.map((subCategory) => {
                    const subCategoryEnrichments = subCategory.enrichments;
                    const selectedCount = subCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                    
                    // Determine ring brightness based on selection count
                    const getRingOpacity = () => {
                      if (selectedCount === 0) return 0;
                      if (selectedCount <= 2) return 0.3;
                      if (selectedCount <= 4) return 0.6;
                      return 0.9;
                    };

                    return (
                      <button
                        key={subCategory.id}
                        onClick={() => {
                          // Use onViewCategory to show sub-category layers (same pattern as NH, MA, CT, DE)
                          if (onViewCategory) {
                            setViewingNJSubCategories(false);
                            onViewCategory(subCategory);
                          } else {
                            // Fallback to modal
                            setCameFromNJSubCategories(true);
                            setActiveModal(subCategory.id);
                            setViewingNJSubCategories(false);
                          }
                        }}
                        className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                        }}
                      >
                        {/* Sub-Category Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {subCategory.icon}
                        </div>
                        
                        {/* Selection Counter Badge */}
                        {selectedCount > 0 && (
                          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {selectedCount}
                          </div>
                        )}
                        
                        {/* Category Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs font-semibold py-1 px-2 text-center">
                          {subCategory.title}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center text-gray-500 py-8">
                    No sub-categories available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If viewing CT sub-categories, show full page with round icons
  if (viewingCTSubCategories) {
    const ctCategory = enrichmentCategories.find(c => c.id === 'ct');
    const ctSubCategories = ctCategory?.subCategories || [];
    
  return (
    <div className="enrichment-config">
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewingCTSubCategories(false)}
                  className="text-white text-2xl font-bold p-2 hover:bg-white hover:bg-opacity-20 rounded flex-shrink-0"
                  title="Back to categories"
                >
                  ←
                </button>
              <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>Connecticut Open Data</h3>
                  <p className="text-xs lg:text-sm text-gray-300">Select a category to view available layers</p>
                </div>
              </div>
              </div>
            </div>
            
          <div className="card-body">
            {/* CT Sub-Category Round Icons Grid - Same layout as home page */}
            <div className="mb-6 w-full px-2 sm:px-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto w-full justify-items-center">
                {ctSubCategories.length > 0 ? (
                  ctSubCategories.map((subCategory) => {
                    const subCategoryEnrichments = subCategory.enrichments;
                    const selectedCount = subCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                    
                    // Determine ring brightness based on selection count
                    const getRingOpacity = () => {
                      if (selectedCount === 0) return 0;
                      if (selectedCount <= 2) return 0.3;
                      if (selectedCount <= 4) return 0.6;
                      return 0.9;
                    };

                    return (
              <button
                        key={subCategory.id}
                        onClick={() => {
                          // Use onViewCategory to show sub-category layers (same pattern as NH and MA)
                          if (onViewCategory) {
                            setViewingCTSubCategories(false);
                            onViewCategory(subCategory);
                          } else {
                            // Fallback to modal
                            setCameFromCTSubCategories(true);
                            setActiveModal(subCategory.id);
                            setViewingCTSubCategories(false);
                          }
                        }}
                        className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                        }}
                      >
                        {/* Sub-Category Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {subCategory.icon}
                        </div>
                        
                        {/* Selection Counter Badge */}
                        {selectedCount > 0 && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold z-10">
                            {selectedCount}
                          </div>
                        )}
              </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center text-gray-500 py-8">
                    No sub-categories available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If viewing DE sub-categories, show full page with round icons
  if (viewingDESubCategories) {
    const deCategory = enrichmentCategories.find(c => c.id === 'de');
    const deSubCategories = deCategory?.subCategories || [];
    
    return (
      <div className="enrichment-config">
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewingDESubCategories(false)}
                  className="text-white text-2xl font-bold p-2 hover:bg-white hover:bg-opacity-20 rounded flex-shrink-0"
                  title="Back to categories"
                >
                  ←
                </button>
                <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>Delaware Open Data</h3>
                  <p className="text-xs lg:text-sm text-gray-300">Select a category to view available layers</p>
                </div>
              </div>
            </div>
          </div>
            
          <div className="card-body">
            {/* DE Sub-Category Round Icons Grid - Same layout as home page */}
            <div className="mb-6 w-full px-2 sm:px-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto w-full justify-items-center">
                {deSubCategories.length > 0 ? (
                  deSubCategories.map((subCategory) => {
                    const subCategoryEnrichments = subCategory.enrichments;
                    const selectedCount = subCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                    
                    // Determine ring brightness based on selection count
                    const getRingOpacity = () => {
                      if (selectedCount === 0) return 0;
                      if (selectedCount <= 2) return 0.3;
                      if (selectedCount <= 4) return 0.6;
                      return 0.9;
                    };

                    return (
                      <button
                        key={subCategory.id}
                        onClick={() => {
                          // Use onViewCategory to show sub-category layers (same pattern as NH, MA, CT)
                          if (onViewCategory) {
                            setViewingDESubCategories(false);
                            onViewCategory(subCategory);
                          } else {
                            // Fallback to modal
                            setCameFromDESubCategories(true);
                            setActiveModal(subCategory.id);
                            setViewingDESubCategories(false);
                          }
                        }}
                        className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                        }}
                      >
                        {/* Sub-Category Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {subCategory.icon}
                        </div>
                        
                        {/* Selection Counter Badge */}
                        {selectedCount > 0 && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold z-10">
                            {selectedCount}
                          </div>
                        )}
                        
                        {/* Category Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs font-semibold p-2 text-center z-10">
                          {subCategory.title}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center text-gray-500 py-8">
                    <p>No sub-categories available yet. Sub-categories will appear here as layers are added.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to render state sub-categories page
  const renderStateSubCategoriesPage = (
    viewingState: boolean,
    setViewingState: (value: boolean) => void,
    stateId: string,
    stateTitle: string,
    setCameFromState: (value: boolean) => void
  ) => {
    if (!viewingState) return null;
    
    const stateCategory = enrichmentCategories.find(c => c.id === stateId);
    const stateSubCategories = stateCategory?.subCategories || [];
    
    return (
      <div className="enrichment-config">
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewingState(false)}
                  className="text-white text-2xl font-bold p-2 hover:bg-white hover:bg-opacity-20 rounded flex-shrink-0"
                  title="Back to categories"
                >
                  ←
                </button>
                <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>{stateTitle}</h3>
                  <p className="text-xs lg:text-sm text-gray-300">Select a category to view available layers</p>
                </div>
              </div>
            </div>
          </div>
            
          <div className="card-body">
            <div className="mb-6 w-full px-2 sm:px-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto w-full justify-items-center">
                {stateSubCategories.length > 0 ? (
                  stateSubCategories.map((subCategory) => {
                    const subCategoryEnrichments = subCategory.enrichments;
                    const selectedCount = subCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                    
                    const getRingOpacity = () => {
                      if (selectedCount === 0) return 0;
                      if (selectedCount <= 2) return 0.3;
                      if (selectedCount <= 4) return 0.6;
                      return 0.9;
                    };

                    return (
                      <button
                        key={subCategory.id}
                        onClick={() => {
                          if (onViewCategory) {
                            setViewingState(false);
                            onViewCategory(subCategory);
                          } else {
                            setCameFromState(true);
                            setActiveModal(subCategory.id);
                            setViewingState(false);
                          }
                        }}
                        className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          {subCategory.icon}
                        </div>
                        
                        {selectedCount > 0 && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold z-10">
                            {selectedCount}
                          </div>
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs font-semibold p-2 text-center z-10">
                          {subCategory.title}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                      <div className="text-4xl mb-4">🚧</div>
                      <p className="text-lg font-semibold text-blue-900 mb-2">Open Data Sources Coming Soon!</p>
                      <p className="text-sm text-blue-700">We're working on adding data layers for this state. Check back soon for updates!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If viewing CA sub-categories, show full page with round icons
  if (viewingCASubCategories) {
    const caCategory = enrichmentCategories.find(c => c.id === 'ca');
    const caSubCategories = caCategory?.subCategories || [];
    
    return (
      <div className="enrichment-config">
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewingCASubCategories(false)}
                  className="text-white text-2xl font-bold p-2 hover:bg-white hover:bg-opacity-20 rounded flex-shrink-0"
                  title="Back to categories"
                >
                  ←
                </button>
                <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>California Open Data</h3>
                  <p className="text-xs lg:text-sm text-gray-300">Select a category to view available layers</p>
                </div>
              </div>
            </div>
          </div>
            
          <div className="card-body">
            {/* CA Sub-Category Round Icons Grid - Same layout as home page */}
            <div className="mb-6 w-full px-2 sm:px-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto w-full justify-items-center">
                {caSubCategories.length > 0 ? (
                  caSubCategories.map((subCategory) => {
                    const subCategoryEnrichments = subCategory.enrichments;
                    const selectedCount = subCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                    
                    // Determine ring brightness based on selection count
                    const getRingOpacity = () => {
                      if (selectedCount === 0) return 0;
                      if (selectedCount <= 2) return 0.3;
                      if (selectedCount <= 4) return 0.6;
                      return 0.9;
                    };

                    return (
                      <button
                        key={subCategory.id}
                        onClick={() => {
                          // Use onViewCategory to show sub-category layers (same pattern as NH, MA, CT, DE)
                          if (onViewCategory) {
                            setViewingCASubCategories(false);
                            onViewCategory(subCategory);
                          } else {
                            // Fallback to modal
                            setCameFromCASubCategories(true);
                            setActiveModal(subCategory.id);
                            setViewingCASubCategories(false);
                          }
                        }}
                        className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                        }}
                      >
                        {/* Sub-Category Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {subCategory.icon}
                        </div>
                        
                        {/* Selection Counter Badge */}
                        {selectedCount > 0 && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold z-10">
                            {selectedCount}
                          </div>
                        )}
                        
                        {/* Category Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs font-semibold p-2 text-center z-10">
                          {subCategory.title}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center text-gray-500 py-8">
                    <p>No sub-categories available yet. Sub-categories will appear here as layers are added.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If viewing MA sub-categories, show full page with round icons
  if (viewingMASubCategories) {
    const maCategory = enrichmentCategories.find(c => c.id === 'ma');
    const maSubCategories = maCategory?.subCategories || [];
    
    return (
      <div className="enrichment-config">
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
              <button
                  onClick={() => setViewingMASubCategories(false)}
                  className="text-white text-2xl font-bold p-2 hover:bg-white hover:bg-opacity-20 rounded flex-shrink-0"
                  title="Back to categories"
              >
                  ←
              </button>
                <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>Massachusetts Open Data</h3>
                  <p className="text-xs lg:text-sm text-gray-300">Select a category to view available layers</p>
                </div>
            </div>
          </div>
        </div>
        
        <div className="card-body">
            {/* MA Sub-Category Round Icons Grid - Same layout as home page */}
          <div className="mb-6 w-full px-2 sm:px-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto w-full justify-items-center">
                {maSubCategories.length > 0 ? (
                  maSubCategories.map((subCategory) => {
                    const subCategoryEnrichments = subCategory.enrichments;
                    const selectedCount = subCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                
                // Determine ring brightness based on selection count
                const getRingOpacity = () => {
                  if (selectedCount === 0) return 0;
                  if (selectedCount <= 2) return 0.3;
                  if (selectedCount <= 4) return 0.6;
                  return 0.9;
                };

                return (
                  <button
                        key={subCategory.id}
                    onClick={() => {
                          // Use onViewCategory to show sub-category layers (same pattern as NH)
                      if (onViewCategory) {
                            setViewingMASubCategories(false);
                            onViewCategory(subCategory);
                      } else {
                            // Fallback to modal
                            setCameFromMASubCategories(true);
                            setActiveModal(subCategory.id);
                            setViewingMASubCategories(false);
                      }
                    }}
                        className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                    }}
                  >
                        {/* Sub-Category Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {subCategory.icon}
                    </div>
                    
                    {/* Selection Counter Badge */}
                    {selectedCount > 0 && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold z-10">
                        {selectedCount}
                      </div>
                    )}
                        
                        {/* Category Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs font-semibold p-2 text-center z-10">
                          {subCategory.title}
                        </div>
                  </button>
                );
                  })
                ) : (
                  <div className="col-span-2 text-center text-gray-500 py-8">
                    <p>No sub-categories available yet. Sub-categories will appear here as layers are added.</p>
            </div>
                )}
          </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render new state sub-categories pages
  const gaSubCategoriesPage = renderStateSubCategoriesPage(
    viewingGASubCategories,
    setViewingGASubCategories,
    'ga',
    'Georgia Open Data',
    setCameFromGASubCategories
  );
  if (gaSubCategoriesPage) return gaSubCategoriesPage;

  const scSubCategoriesPage = renderStateSubCategoriesPage(
    viewingSCSubCategories,
    setViewingSCSubCategories,
    'sc',
    'South Carolina Open Data',
    setCameFromSCSubCategories
  );
  if (scSubCategoriesPage) return scSubCategoriesPage;

  const ncSubCategoriesPage = renderStateSubCategoriesPage(
    viewingNCSubCategories,
    setViewingNCSubCategories,
    'nc',
    'North Carolina Open Data',
    setCameFromNCSubCategories
  );
  if (ncSubCategoriesPage) return ncSubCategoriesPage;

  const mdSubCategoriesPage = renderStateSubCategoriesPage(
    viewingMDSubCategories,
    setViewingMDSubCategories,
    'md',
    'Maryland Open Data',
    setCameFromMDSubCategories
  );
  if (mdSubCategoriesPage) return mdSubCategoriesPage;

  const dcSubCategoriesPage = renderStateSubCategoriesPage(
    viewingDCSubCategories,
    setViewingDCSubCategories,
    'dc',
    'District of Columbia Open Data',
    setCameFromDCSubCategories
  );
  if (dcSubCategoriesPage) return dcSubCategoriesPage;

  const vaSubCategoriesPage = renderStateSubCategoriesPage(
    viewingVASubCategories,
    setViewingVASubCategories,
    'va',
    'Virginia Open Data',
    setCameFromVASubCategories
  );
  if (vaSubCategoriesPage) return vaSubCategoriesPage;

  const flSubCategoriesPage = renderStateSubCategoriesPage(
    viewingFLSubCategories,
    setViewingFLSubCategories,
    'fl',
    'Florida Open Data',
    setCameFromFLSubCategories
  );
  if (flSubCategoriesPage) return flSubCategoriesPage;

  const wvSubCategoriesPage = renderStateSubCategoriesPage(
    viewingWVSubCategories,
    setViewingWVSubCategories,
    'wv',
    'West Virginia Open Data',
    setCameFromWVSubCategories
  );
  if (wvSubCategoriesPage) return wvSubCategoriesPage;

  const nySubCategoriesPage = renderStateSubCategoriesPage(
    viewingNYSubCategories,
    setViewingNYSubCategories,
    'ny',
    'New York Open Data',
    setCameFromNYSubCategories
  );
  if (nySubCategoriesPage) return nySubCategoriesPage;

  const paSubCategoriesPage = renderStateSubCategoriesPage(
    viewingPASubCategories,
    setViewingPASubCategories,
    'pa',
    'Pennsylvania Open Data',
    setCameFromPASubCategories
  );
  if (paSubCategoriesPage) return paSubCategoriesPage;

  const riSubCategoriesPage = renderStateSubCategoriesPage(
    viewingRISubCategories,
    setViewingRISubCategories,
    'ri',
    'Rhode Island Open Data',
    setCameFromRISubCategories
  );
  if (riSubCategoriesPage) return riSubCategoriesPage;

  const vtSubCategoriesPage = renderStateSubCategoriesPage(
    viewingVTSubCategories,
    setViewingVTSubCategories,
    'vt',
    'Vermont Open Data',
    setCameFromVTSubCategories
  );
  if (vtSubCategoriesPage) return vtSubCategoriesPage;

  const txSubCategoriesPage = renderStateSubCategoriesPage(
    viewingTXSubCategories,
    setViewingTXSubCategories,
    'tx',
    'Texas Open Data',
    setCameFromTXSubCategories
  );
  if (txSubCategoriesPage) return txSubCategoriesPage;

  const nmSubCategoriesPage = renderStateSubCategoriesPage(
    viewingNMSubCategories,
    setViewingNMSubCategories,
    'nm',
    'New Mexico Open Data',
    setCameFromNMSubCategories
  );
  if (nmSubCategoriesPage) return nmSubCategoriesPage;

  const azSubCategoriesPage = renderStateSubCategoriesPage(
    viewingAZSubCategories,
    setViewingAZSubCategories,
    'az',
    'Arizona Open Data',
    setCameFromAZSubCategories
  );
  if (azSubCategoriesPage) return azSubCategoriesPage;

  const akSubCategoriesPage = renderStateSubCategoriesPage(
    viewingAKSubCategories,
    setViewingAKSubCategories,
    'ak',
    'Alaska Open Data',
    setCameFromAKSubCategories
  );
  if (akSubCategoriesPage) return akSubCategoriesPage;

  const hiSubCategoriesPage = renderStateSubCategoriesPage(
    viewingHISubCategories,
    setViewingHISubCategories,
    'hi',
    'Hawaii Open Data',
    setCameFromHISubCategories
  );
  if (hiSubCategoriesPage) return hiSubCategoriesPage;

  const waSubCategoriesPage = renderStateSubCategoriesPage(
    viewingWASubCategories,
    setViewingWASubCategories,
    'wa',
    'Washington Open Data',
    setCameFromWASubCategories
  );
  if (waSubCategoriesPage) return waSubCategoriesPage;

  const orSubCategoriesPage = renderStateSubCategoriesPage(
    viewingORSubCategories,
    setViewingORSubCategories,
    'or',
    'Oregon Open Data',
    setCameFromORSubCategories
  );
  if (orSubCategoriesPage) return orSubCategoriesPage;

  const mtSubCategoriesPage = renderStateSubCategoriesPage(
    viewingMTSubCategories,
    setViewingMTSubCategories,
    'mt',
    'Montana Open Data',
    setCameFromMTSubCategories
  );
  if (mtSubCategoriesPage) return mtSubCategoriesPage;

  const wySubCategoriesPage = renderStateSubCategoriesPage(
    viewingWYSubCategories,
    setViewingWYSubCategories,
    'wy',
    'Wyoming Open Data',
    setCameFromWYSubCategories
  );
  if (wySubCategoriesPage) return wySubCategoriesPage;

  const nvSubCategoriesPage = renderStateSubCategoriesPage(
    viewingNVSubCategories,
    setViewingNVSubCategories,
    'nv',
    'Nevada Open Data',
    setCameFromNVSubCategories
  );
  if (nvSubCategoriesPage) return nvSubCategoriesPage;

  const idSubCategoriesPage = renderStateSubCategoriesPage(
    viewingIDSubCategories,
    setViewingIDSubCategories,
    'id',
    'Idaho Open Data',
    setCameFromIDSubCategories
  );
  if (idSubCategoriesPage) return idSubCategoriesPage;

  const utSubCategoriesPage = renderStateSubCategoriesPage(
    viewingUTSubCategories,
    setViewingUTSubCategories,
    'ut',
    'Utah Open Data',
    setCameFromUTSubCategories
  );
  if (utSubCategoriesPage) return utSubCategoriesPage;

  const coSubCategoriesPage = renderStateSubCategoriesPage(
    viewingCOSubCategories,
    setViewingCOSubCategories,
    'co',
    'Colorado Open Data',
    setCameFromCOSubCategories
  );
  if (coSubCategoriesPage) return coSubCategoriesPage;

  const ilSubCategoriesPage = renderStateSubCategoriesPage(
    viewingILSubCategories,
    setViewingILSubCategories,
    'il',
    'Illinois Open Data',
    setCameFromILSubCategories
  );
  if (ilSubCategoriesPage) return ilSubCategoriesPage;

  // If viewing NH sub-categories, show full page with round icons
  if (viewingNHSubCategories) {
    const nhCategory = enrichmentCategories.find(c => c.id === 'nh');
    const nhSubCategories = nhCategory?.subCategories || [];
    
    return (
      <div className="enrichment-config">
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewingNHSubCategories(false)}
                  className="text-white text-2xl font-bold p-2 hover:bg-white hover:bg-opacity-20 rounded flex-shrink-0"
                  title="Back to categories"
                >
                  ←
                </button>
                <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>New Hampshire Open Data</h3>
                  <p className="text-xs lg:text-sm text-gray-300">Select a category to view available layers</p>
                </div>
              </div>
            </div>
              </div>
              
          <div className="card-body">
            {/* NH Sub-Category Round Icons Grid - Same layout as home page */}
            <div className="mb-6 w-full px-2 sm:px-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto w-full justify-items-center">
                {nhSubCategories.map((subCategory) => {
                  const subCategoryEnrichments = subCategory.enrichments;
                  const selectedCount = subCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                  
                  // Determine ring brightness based on selection count
                  const getRingOpacity = () => {
                    if (selectedCount === 0) return 0;
                    if (selectedCount <= 2) return 0.3;
                    if (selectedCount <= 4) return 0.6;
                    return 0.9;
                  };
                  
                  return (
                    <button
                      key={subCategory.id}
                      onClick={() => {
                        // Use onViewCategory to navigate to full page view (like regular categories)
                        if (onViewCategory) {
                          onViewCategory(subCategory);
                        }
                      }}
                      className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                      }}
                    >
                      {/* Sub-Category Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {subCategory.icon}
                      </div>
                      
                      {/* Selection Counter Badge */}
                      {selectedCount > 0 && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold z-10">
                          {selectedCount}
                      </div>
                      )}
                      
                      {/* Category Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs font-semibold p-2 text-center z-10">
                        {subCategory.title}
                      </div>
                    </button>
                  );
                })}
              </div>
                  </div>
                </div>
            </div>
      </div>
    );
  }

  // Desktop view (existing modal-based approach)
  // If modal is open, render ONLY the modal (hide main content)
  if (activeModal) {
    // Render modal only - this will cover the entire screen
    return (
      <div className="enrichment-config" style={{ position: 'relative', zIndex: 10001 }}>
            <div 
          className="fixed inset-0 bg-white"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10001
          }}
            >
          <div className="bg-white flex flex-col" style={{ height: '100vh', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {(() => {
              // Check if this is a state sub-category (they have IDs like nh_granit, ma_massgis, ct_geodata_portal, de_firstmap)
              const isNHSubCategory = activeModal?.startsWith('nh_');
              const isMASubCategory = activeModal?.startsWith('ma_');
              const isCTSubCategory = activeModal?.startsWith('ct_');
              const isDESubCategory = activeModal?.startsWith('de_');
              const isNJSubCategory = activeModal?.startsWith('nj_');
              const isCASubCategory = activeModal?.startsWith('ca_');
              let category: EnrichmentCategory | undefined;
              
              if (isNHSubCategory) {
                // Find the NH category and get the sub-category
                const nhCategory = enrichmentCategories.find(c => c.id === 'nh');
                category = nhCategory?.subCategories?.find(sc => sc.id === activeModal);
                console.log('🔍 NH Sub-Category Modal:', {
                  activeModal,
                  isNHSubCategory,
                  nhCategoryFound: !!nhCategory,
                  subCategories: nhCategory?.subCategories?.map(sc => sc.id),
                  foundCategory: category?.id,
                  enrichmentsCount: category?.enrichments?.length
                });
              } else if (isMASubCategory) {
                // Find the MA category and get the sub-category
                const maCategory = enrichmentCategories.find(c => c.id === 'ma');
                category = maCategory?.subCategories?.find(sc => sc.id === activeModal);
                console.log('🔍 MA Sub-Category Modal:', {
                  activeModal,
                  isMASubCategory,
                  maCategoryFound: !!maCategory,
                  subCategories: maCategory?.subCategories?.map(sc => sc.id),
                  foundCategory: category?.id,
                  enrichmentsCount: category?.enrichments?.length
                });
              } else if (isCTSubCategory) {
                // Find the CT category and get the sub-category
                const ctCategory = enrichmentCategories.find(c => c.id === 'ct');
                category = ctCategory?.subCategories?.find(sc => sc.id === activeModal);
                console.log('🔍 CT Sub-Category Modal:', {
                  activeModal,
                  isCTSubCategory,
                  ctCategoryFound: !!ctCategory,
                  subCategories: ctCategory?.subCategories?.map(sc => sc.id),
                  foundCategory: category?.id,
                  enrichmentsCount: category?.enrichments?.length
                });
              } else if (isDESubCategory) {
                // Find the DE category and get the sub-category
                const deCategory = enrichmentCategories.find(c => c.id === 'de');
                category = deCategory?.subCategories?.find(sc => sc.id === activeModal);
                console.log('🔍 DE Sub-Category Modal:', {
                  activeModal,
                  isDESubCategory,
                  deCategoryFound: !!deCategory,
                  subCategories: deCategory?.subCategories?.map(sc => sc.id),
                  foundCategory: category?.id,
                  enrichmentsCount: category?.enrichments?.length
                });
              } else if (isNJSubCategory) {
                // Find the NJ category and get the sub-category
                const njCategory = enrichmentCategories.find(c => c.id === 'nj');
                category = njCategory?.subCategories?.find(sc => sc.id === activeModal);
                console.log('🔍 NJ Sub-Category Modal:', {
                  activeModal,
                  isNJSubCategory,
                  njCategoryFound: !!njCategory,
                  subCategories: njCategory?.subCategories?.map(sc => sc.id),
                  foundCategory: category?.id,
                  enrichmentsCount: category?.enrichments?.length
                });
              } else if (isCASubCategory) {
                // Find the CA category and get the sub-category
                const caCategory = enrichmentCategories.find(c => c.id === 'ca');
                category = caCategory?.subCategories?.find(sc => sc.id === activeModal);
                console.log('🔍 CA Sub-Category Modal:', {
                  activeModal,
                  isCASubCategory,
                  caCategoryFound: !!caCategory,
                  subCategories: caCategory?.subCategories?.map(sc => sc.id),
                  foundCategory: category?.id,
                  enrichmentsCount: category?.enrichments?.length
                });
              } else {
                // Regular category
                category = enrichmentCategories.find(c => c.id === activeModal);
              }
              
              if (!category) {
                console.warn('⚠️ Category not found for activeModal:', activeModal);
                return (
                  <div className="p-4">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-semibold"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back to Configuration</span>
                    </button>
                    <div className="mt-4 text-center text-gray-500">
                      <p>Category not found: {activeModal}</p>
                    </div>
                  </div>
                );
              }
                  
                  const categoryEnrichments = category.enrichments;
              const selectedCount = categoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
              console.log('📋 Category Enrichments:', {
                categoryId: category.id,
                categoryTitle: category.title,
                enrichmentsCount: categoryEnrichments.length,
                selectedCount: selectedCount,
                enrichments: categoryEnrichments.map(e => e.id)
              });
                  
                  const headerColor = category.id === 'hazards' ? '#991b1b' :
                                    category.id === 'community' ? '#1e40af' :
                                    category.id === 'retail' ? '#6b21a8' :
                                    category.id === 'health' ? '#9d174d' :
                                    category.id === 'transportation' ? '#3730a3' :
                                    category.id === 'infrastructure' ? '#92400e' :
                                    category.id === 'environment' ? '#166534' :
                                    category.id === 'recreation' ? '#065f46' :
                                    category.id === 'natural_resources' ? '#115e59' :
                                    category.id === 'public_lands' ? '#365314' :
                                    category.id === 'quirky' ? '#9a3412' :
                                    category.id === 'wildfire' ? '#dc2626' :
                                category.id === 'at' ? '#166534' :
                                category.id === 'pct' ? '#166534' :
                                category.id === 'nh' ? '#166534' :
                                category.id === 'nh_granit' ? '#166534' :
                                category.id === 'ma_massgis' ? '#166534' :
                                category.id === 'ct_geodata_portal' ? '#166534' :
                                category.id === 'de_firstmap' ? '#166534' :
                                    category.id === 'core' ? '#1e293b' : '#1f2937';
                  
                  console.log('Category:', category.id, 'Header color:', headerColor);

                  return (
                    <>
                  {/* Header with Back Button - Matching EnrichmentCategoryView style exactly */}
                      <div 
                    className="shadow-lg border-b border-gray-300 flex-shrink-0"
                        style={{
                          backgroundColor: headerColor,
                      position: 'sticky',
                      top: 0,
                      zIndex: 10002,
                      width: '100%'
                        }}
                      >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex items-center justify-between h-16">
                          <button
                          onClick={() => {
                            if (cameFromNHSubCategories) {
                              // Go back to NH sub-categories page
                              setCameFromNHSubCategories(false);
                              setActiveModal(null);
                              setViewingNHSubCategories(true);
                            } else if (cameFromMASubCategories) {
                              // Go back to MA sub-categories page
                              setCameFromMASubCategories(false);
                              setActiveModal(null);
                              setViewingMASubCategories(true);
                            } else if (cameFromCTSubCategories) {
                              // Go back to CT sub-categories page
                              setCameFromCTSubCategories(false);
                              setActiveModal(null);
                              setViewingCTSubCategories(true);
                            } else if (cameFromDESubCategories) {
                              // Go back to DE sub-categories page
                              setCameFromDESubCategories(false);
                              setActiveModal(null);
                              setViewingDESubCategories(true);
                            } else if (cameFromNJSubCategories) {
                              // Go back to NJ sub-categories page
                              setCameFromNJSubCategories(false);
                              setActiveModal(null);
                              setViewingNJSubCategories(true);
                            } else if (cameFromWVSubCategories) {
                              // Go back to WV sub-categories page
                              setCameFromWVSubCategories(false);
                              setActiveModal(null);
                              setViewingWVSubCategories(true);
                            } else if (cameFromCASubCategories) {
                              // Go back to CA sub-categories page
                              setCameFromCASubCategories(false);
                              setActiveModal(null);
                              setViewingCASubCategories(true);
                            } else if (cameFromGASubCategories) {
                              // Go back to GA sub-categories page
                              setCameFromGASubCategories(false);
                              setActiveModal(null);
                              setViewingGASubCategories(true);
                            } else if (cameFromSCSubCategories) {
                              // Go back to SC sub-categories page
                              setCameFromSCSubCategories(false);
                              setActiveModal(null);
                              setViewingSCSubCategories(true);
                            } else if (cameFromNCSubCategories) {
                              // Go back to NC sub-categories page
                              setCameFromNCSubCategories(false);
                              setActiveModal(null);
                              setViewingNCSubCategories(true);
                            } else if (cameFromMDSubCategories) {
                              // Go back to MD sub-categories page
                              setCameFromMDSubCategories(false);
                              setActiveModal(null);
                              setViewingMDSubCategories(true);
                            } else if (cameFromDCSubCategories) {
                              // Go back to DC sub-categories page
                              setCameFromDCSubCategories(false);
                              setActiveModal(null);
                              setViewingDCSubCategories(true);
                            } else if (cameFromVASubCategories) {
                              // Go back to VA sub-categories page
                              setCameFromVASubCategories(false);
                              setActiveModal(null);
                              setViewingVASubCategories(true);
                            } else if (cameFromFLSubCategories) {
                              // Go back to FL sub-categories page
                              setCameFromFLSubCategories(false);
                              setActiveModal(null);
                              setViewingFLSubCategories(true);
                            } else if (cameFromNYSubCategories) {
                              setCameFromNYSubCategories(false);
                              setActiveModal(null);
                              setViewingNYSubCategories(true);
                            } else if (cameFromPASubCategories) {
                              setCameFromPASubCategories(false);
                              setActiveModal(null);
                              setViewingPASubCategories(true);
                            } else if (cameFromRISubCategories) {
                              setCameFromRISubCategories(false);
                              setActiveModal(null);
                              setViewingRISubCategories(true);
                            } else if (cameFromVTSubCategories) {
                              setCameFromVTSubCategories(false);
                              setActiveModal(null);
                              setViewingVTSubCategories(true);
                            } else if (cameFromTXSubCategories) {
                              setCameFromTXSubCategories(false);
                              setActiveModal(null);
                              setViewingTXSubCategories(true);
                            } else if (cameFromNMSubCategories) {
                              setCameFromNMSubCategories(false);
                              setActiveModal(null);
                              setViewingNMSubCategories(true);
                            } else if (cameFromAZSubCategories) {
                              setCameFromAZSubCategories(false);
                              setActiveModal(null);
                              setViewingAZSubCategories(true);
                            } else if (cameFromAKSubCategories) {
                              setCameFromAKSubCategories(false);
                              setActiveModal(null);
                              setViewingAKSubCategories(true);
                            } else if (cameFromHISubCategories) {
                              setCameFromHISubCategories(false);
                              setActiveModal(null);
                              setViewingHISubCategories(true);
                            } else if (cameFromWASubCategories) {
                              setCameFromWASubCategories(false);
                              setActiveModal(null);
                              setViewingWASubCategories(true);
                            } else if (cameFromORSubCategories) {
                              setCameFromORSubCategories(false);
                              setActiveModal(null);
                              setViewingORSubCategories(true);
                            } else if (cameFromMTSubCategories) {
                              setCameFromMTSubCategories(false);
                              setActiveModal(null);
                              setViewingMTSubCategories(true);
                            } else if (cameFromWYSubCategories) {
                              setCameFromWYSubCategories(false);
                              setActiveModal(null);
                              setViewingWYSubCategories(true);
                            } else if (cameFromNVSubCategories) {
                              setCameFromNVSubCategories(false);
                              setActiveModal(null);
                              setViewingNVSubCategories(true);
                            } else if (cameFromIDSubCategories) {
                              setCameFromIDSubCategories(false);
                              setActiveModal(null);
                              setViewingIDSubCategories(true);
                            } else if (cameFromUTSubCategories) {
                              setCameFromUTSubCategories(false);
                              setActiveModal(null);
                              setViewingUTSubCategories(true);
                            } else if (cameFromCOSubCategories) {
                              setCameFromCOSubCategories(false);
                              setActiveModal(null);
                              setViewingCOSubCategories(true);
                            } else if (cameFromILSubCategories) {
                              setCameFromILSubCategories(false);
                              setActiveModal(null);
                              setViewingILSubCategories(true);
                            } else {
                              // Go back to main configuration
                              setActiveModal(null);
                            }
                          }}
                          className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors font-semibold text-sm sm:text-base"
                        >
                          <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                          <span className="whitespace-nowrap">Back to Configuration</span>
                          </button>
                        
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                          <div className="text-right">
                            <h1 className="text-sm sm:text-base font-bold text-white leading-tight">{category.title}</h1>
                            <p className="text-xs text-white text-opacity-90 leading-tight">{selectedCount} of {categoryEnrichments.length} selected</p>
                          </div>
                        </div>
                      </div>
                        </div>
                      </div>

                      {/* Content - Scrollable */}
                      <div 
                        ref={modalContentRef}
                    className="flex-1 overflow-y-auto p-3 sm:p-4" 
                    style={{ 
                      scrollBehavior: 'smooth',
                      WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                      minHeight: 0, // Critical for flex children to scroll
                      flex: '1 1 auto',
                      overflowY: 'auto',
                      overflowX: 'hidden'
                    }}
                      >
                    <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto w-full pt-2 sm:pt-4 px-1 sm:px-0">
                      {categoryEnrichments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No layers available yet in this category.</p>
                          <p className="text-sm mt-2">Layers will be added soon.</p>
                          <p className="text-xs mt-2 text-gray-400">Debug: Category ID: {category.id}, Enrichments: {categoryEnrichments.length}</p>
                        </div>
                      ) : (
                        categoryEnrichments.map((enrichment) => {
                            const isSelected = selectedEnrichments.includes(enrichment.id);
                            const currentRadius = poiRadii[enrichment.id] || enrichment.defaultRadius;
                            const maxRadius = getMaxRadius(enrichment.id);
                            const minRadius = enrichment.id === 'poi_aurora_viewing_sites' ? 5 : 0.1;
                            const formatMiles = (value: number) => Number.isInteger(value) ? value.toString() : value.toFixed(1);
                            const radiusLabel = (() => {
                              if (enrichment.id === 'poi_earthquakes') return '25 miles (earthquakes)';
                              if (enrichment.id === 'poi_volcanoes') return '50 miles (volcanoes)';
                              if (enrichment.id === 'poi_wildfires') return '50 miles (wildfires)';
                              if (enrichment.id === 'poi_flood_reference_points') return '25 miles (flood reference points)';
                              if (enrichment.id === 'poi_aurora_viewing_sites') return '100 miles (aurora viewing sites)';
                          if (enrichment.id === 'nh_parcels') return '0.3 miles';
                          if (enrichment.id === 'nj_parcels') return '0.3 miles';
                          if (enrichment.id === 'ma_parcels') return '0.3 miles';
                          if (enrichment.id === 'ct_building_footprints') return '0.3 miles';
                              return '5 miles';
                            })();

                            return (
                              <div key={enrichment.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 w-full max-w-full" style={isMobile ? { padding: '24px', marginBottom: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' } as React.CSSProperties : {}}>
                                {/* 🔑 FIX: Parent container - force flex-col on mobile to allow full width */}
                            <div className={`flex ${isMobile ? 'flex-col items-start space-y-4 space-x-0' : 'flex-row sm:items-start'} gap-3 w-full max-w-full`}>
                                  <button
                                    type="button"
                                    onClick={() => handleEnrichmentToggle(enrichment.id)}
                                    data-enrichment-checkbox="true"
                                    data-test-mobile="true"
                                className={`enrichment-checkbox flex-shrink-0 border-2 border-gray-300 rounded flex items-center justify-center transition-all duration-200 self-start ${
                                      isSelected 
                                        ? 'bg-black border-black' 
                                        : 'bg-white border-gray-300'
                                    }`}
                                style={(() => {
                                  const isMobileWidth = typeof window !== 'undefined' && window.innerWidth < 768;
                                  return isMobileWidth ? { 
                                    width: '50px', 
                                    height: '50px', 
                                    minWidth: '50px', 
                                    minHeight: '50px', 
                                    maxWidth: '50px',
                                    maxHeight: '50px',
                                    aspectRatio: '1',
                                    flexShrink: '0',
                                    boxSizing: 'border-box',
                                  } as React.CSSProperties : {
                                    width: '16px',
                                    height: '16px',
                                    minWidth: '16px',
                                    minHeight: '16px',
                                  } as React.CSSProperties;
                                })()}
                                  >
                                    {isSelected && (
                                      <Check className={`text-white ${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`} style={isMobile ? { width: '28px', height: '28px', flexShrink: '0' } as React.CSSProperties : {}} />
                                    )}
                                  </button>
                              <div className={`flex-1 min-w-0 text-left w-full max-w-full ${isMobile ? 'space-y-3 pt-3' : 'space-y-1'}`} style={isMobile ? { width: '100%', maxWidth: '100%', flex: '1 1 100%' } as React.CSSProperties : {}}>
                                    <label htmlFor={enrichment.id} className={`font-semibold text-gray-900 cursor-pointer block break-words w-full ${isMobile ? 'text-2xl leading-9' : 'text-base sm:text-base leading-relaxed'}`} style={isMobile ? { width: '100%', maxWidth: '100%', display: 'block' } as React.CSSProperties : {}}>
                                      {enrichment.label}
                                    </label>
                                    <p className={`text-gray-700 break-words whitespace-normal w-full ${isMobile ? 'text-xl leading-8' : 'text-sm sm:text-sm leading-relaxed'}`} style={isMobile ? { width: '100%', maxWidth: '100%', margin: '0', padding: '0', display: 'block' } as React.CSSProperties : {}}>
                                      {enrichment.description}
                                    </p>
                                  </div>
                                </div>

                            {enrichment.isPOI && isSelected && (() => {
                              // For NH parcels, use a dropdown with specific options
                              const isNHParcels = enrichment.id === 'nh_parcels';
                              const isNJParcels = enrichment.id === 'nj_parcels';
                              const isMAParcels = enrichment.id === 'ma_parcels';
                              const isCTBuildingFootprints = enrichment.id === 'ct_building_footprints';
                              const radiusOptions = isNHParcels || isNJParcels
                                ? [0.25, 0.50, 0.75, 1.0]
                                : isMAParcels
                                ? [0.3, 0.5, 0.75, 1.0]
                                : isCTBuildingFootprints
                                ? [0.25, 0.50, 0.75, 1.0]
                                : enrichment.id === 'poi_aurora_viewing_sites'
                                ? [5, 10, 25, 50, 100]
                                : null; // null means use number input
                              
                              return (
                                  <div className="mt-4 pt-4 border-t border-gray-100" style={isMobile ? { width: '100%', maxWidth: '100%', marginTop: '16px', paddingTop: '16px', boxSizing: 'border-box' } as React.CSSProperties : {}}>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3" style={isMobile ? { width: '100%', maxWidth: '100%', boxSizing: 'border-box' } as React.CSSProperties : {}}>
                                      <p className="text-xs text-amber-700" style={isMobile ? { width: '100%', maxWidth: '100%' } as React.CSSProperties : {}}>
                                        ⚠️ Recommended range: {radiusLabel} (for performance & accuracy)
                                      </p>
                                    </div>
                                    
                                  <div className="flex flex-col gap-3 mt-4 w-full max-w-full" style={isMobile ? { width: '100%', maxWidth: '100%' } as React.CSSProperties : {}}>
                                      <label className="text-sm font-medium text-black w-full" style={isMobile ? { width: '100%', fontSize: '16px' } as React.CSSProperties : {}}>Search Radius:</label>
                                    <div className="flex items-center gap-2 w-full max-w-full" style={isMobile ? { width: '100%', maxWidth: '100%' } as React.CSSProperties : {}}>
                                      {radiusOptions ? (
                                        <select
                                          value={currentRadius}
                                          onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value))}
                                          className={`px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 ${isMobile ? 'w-full flex-grow' : 'w-32 sm:w-28 flex-shrink-0'}`}
                                          style={isMobile ? { width: '100%', maxWidth: '100%', minWidth: '150px' } as React.CSSProperties : { maxWidth: 'calc(100% - 60px)' }}
                                        >
                                          {radiusOptions.map(option => (
                                            <option key={option} value={option}>
                                              {formatMiles(option)} {option === 1 ? 'mile' : 'miles'}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="number"
                                          min={minRadius}
                                          max={maxRadius}
                                          step={enrichment.id === 'poi_aurora_viewing_sites' ? 1 : 0.1}
                                          value={currentRadius}
                                          onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value) || 0)}
                                          className={`px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-center ${isMobile ? 'w-full flex-grow' : 'w-24 sm:w-20 flex-shrink-0'}`}
                                          style={isMobile ? { width: '100%', maxWidth: '100%', minWidth: '150px' } as React.CSSProperties : { maxWidth: 'calc(100% - 60px)' }}
                                        />
                                      )}
                                        <span className="text-sm text-black whitespace-nowrap flex-shrink-0" style={isMobile ? { fontSize: '16px' } as React.CSSProperties : {}}>miles</span>
                                      </div>
                                    </div>

                                  {!radiusOptions && (currentRadius > maxRadius || currentRadius < minRadius) && (
                                      <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                        Please stay between {formatMiles(minRadius)} and {formatMiles(maxRadius)} miles
                                      </div>
                                    )}
                                  </div>
                              );
                            })()}
                              </div>
                            );
                          })
                                )}
                              </div>
                  </div>
                </>
                            );
            })()}
                        </div>
                      </div>
      </div>
    );
  }
  
  return (
    <div className="enrichment-config">
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>Enrichment Layers</h3>
                <p className="text-xs lg:text-sm text-gray-300">Select data sources and configure search parameters</p>
              </div>
            </div>
            
            {/* Reset All Filters Button */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <button
                onClick={handleResetAllFilters}
                className="btn btn-outline flex items-center justify-center space-x-2 text-xs sm:text-sm px-3 py-2 flex-1 sm:flex-none"
                title="Reset all selected enrichments and radii to defaults"
              >
                <span className="w-4 h-4">🔄</span>
                <span className="whitespace-nowrap">Reset All Filters</span>
              </button>
              
              <button
                onClick={handleResetApp}
                className="btn btn-outline flex items-center justify-center space-x-2 text-xs sm:text-sm px-3 py-2 flex-1 sm:flex-none"
                title="Clear browser cache and refresh application to ensure latest code"
                        >
                <span className="w-4 h-4">🔄</span>
                <span className="whitespace-nowrap">Reset App</span>
                        </button>
                      </div>
              </div>
            </div>
        
        <div className="card-body">
          {/* Custom Icon Category Button Grid - Desktop */}
          <div className="mb-6 w-full px-2 sm:px-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto w-full justify-items-center">
              {enrichmentCategories.map((category) => {
                const categoryEnrichments = category.enrichments;
                // For NH, MA, and other states, count sub-category enrichments too
                const stateSubCategoryEnrichments = (category.id === 'nh' || category.id === 'ma' || category.id === 'ri' || category.id === 'ct' || category.id === 'ny' || category.id === 'vt' || category.id === 'me' || category.id === 'nj' || category.id === 'pa' || category.id === 'de') && category.subCategories
                  ? category.subCategories.flatMap(sc => sc.enrichments)
                  : [];
                const allCategoryEnrichments = (category.id === 'nh' || category.id === 'ma' || category.id === 'ri' || category.id === 'ct' || category.id === 'ny' || category.id === 'vt' || category.id === 'me' || category.id === 'nj' || category.id === 'pa' || category.id === 'de')
                  ? stateSubCategoryEnrichments 
                  : categoryEnrichments;
                const selectedCount = allCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                
                // Determine ring brightness based on selection count
                const getRingOpacity = () => {
                  if (selectedCount === 0) return 0;
                  if (selectedCount <= 2) return 0.3;
                  if (selectedCount <= 4) return 0.6;
                  return 0.9;
                };

                  return (
                  <button
                    key={category.id}
                    onClick={() => {
                      // Special handling for states with sub-categories - show sub-categories page instead of modal
                      if (category.id === 'nh' && category.subCategories && category.subCategories.length > 0) {
                        setViewingNHSubCategories(true);
                      } else if (category.id === 'ma' && category.subCategories && category.subCategories.length > 0) {
                        setViewingMASubCategories(true);
                      } else if (category.id === 'ct' && category.subCategories && category.subCategories.length > 0) {
                        setViewingCTSubCategories(true);
                      } else if (category.id === 'de' && category.subCategories && category.subCategories.length > 0) {
                        setViewingDESubCategories(true);
                      } else if (category.id === 'nj' && category.subCategories && category.subCategories.length > 0) {
                        setViewingNJSubCategories(true);
                      } else if (category.id === 'wv') {
                        setViewingWVSubCategories(true);
                      } else if (category.id === 'ca' && category.subCategories && category.subCategories.length > 0) {
                        setViewingCASubCategories(true);
                      } else if (category.id === 'ga') {
                        setViewingGASubCategories(true);
                      } else if (category.id === 'sc') {
                        setViewingSCSubCategories(true);
                      } else if (category.id === 'nc') {
                        setViewingNCSubCategories(true);
                      } else if (category.id === 'md') {
                        setViewingMDSubCategories(true);
                      } else if (category.id === 'dc') {
                        setViewingDCSubCategories(true);
                      } else if (category.id === 'va') {
                        setViewingVASubCategories(true);
                      } else if (category.id === 'fl') {
                        setViewingFLSubCategories(true);
                      } else if (category.id === 'ny') {
                        setViewingNYSubCategories(true);
                      } else if (category.id === 'pa') {
                        setViewingPASubCategories(true);
                      } else if (category.id === 'ri') {
                        setViewingRISubCategories(true);
                      } else if (category.id === 'vt') {
                        setViewingVTSubCategories(true);
                      } else if (category.id === 'tx') {
                        setViewingTXSubCategories(true);
                      } else if (category.id === 'nm') {
                        setViewingNMSubCategories(true);
                      } else if (category.id === 'az') {
                        setViewingAZSubCategories(true);
                      } else if (category.id === 'ak') {
                        setViewingAKSubCategories(true);
                      } else if (category.id === 'hi') {
                        setViewingHISubCategories(true);
                      } else if (category.id === 'wa') {
                        setViewingWASubCategories(true);
                      } else if (category.id === 'or') {
                        setViewingORSubCategories(true);
                      } else if (category.id === 'mt') {
                        setViewingMTSubCategories(true);
                      } else if (category.id === 'wy') {
                        setViewingWYSubCategories(true);
                      } else if (category.id === 'nv') {
                        setViewingNVSubCategories(true);
                      } else if (category.id === 'id') {
                        setViewingIDSubCategories(true);
                      } else if (category.id === 'ut') {
                        setViewingUTSubCategories(true);
                      } else if (category.id === 'co') {
                        setViewingCOSubCategories(true);
                      } else if (category.id === 'il') {
                        setViewingILSubCategories(true);
                      } else {
                        // Always use modal view for other categories
                        if (onViewCategory) {
                          onViewCategory(category);
                        } else {
                          setActiveModal(category.id);
                        }
                      }
                    }}
                    className={`relative overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 ${category.id === 'at' ? 'w-full aspect-square rounded-full' : 'w-full aspect-square rounded-full'}`}
                    style={{
                      boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                    }}
                  >
                    {/* Custom Icon */}
                    <img
                      src={`/assets/${getIconFileName(category.id)}.webp`}
                      alt={category.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-200"
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center',
                        minWidth: '100%',
                        minHeight: '100%',
                        width: '100%',
                        height: '100%'
                      }}
                      onError={(e) => {
                        // Fallback to category name if icon fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    
                    {/* Fallback Text */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-800 font-semibold text-sm text-center p-2 hidden"
                      style={{ display: 'none' }}
                    >
                      {category.title}
                    </div>
                    
                    {/* Selection Counter Badge */}
                    {selectedCount > 0 && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {selectedCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selection Summary Panel */}
          {selectedEnrichments.length > 0 && (
            <div className="mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <h4 className="text-base sm:text-lg font-bold text-blue-900 flex items-center space-x-2">
                  <span>📊</span>
                  <span>Selection Summary</span>
                </h4>
                <span className="text-xs sm:text-sm font-semibold text-blue-700 bg-blue-100 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                  {selectedEnrichments.length} total
                    </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {enrichmentCategories.map((category) => {
                  // For NH, count sub-category enrichments too
                  const nhSubCategoryEnrichments = category.id === 'nh' && category.subCategories
                    ? category.subCategories.flatMap(sc => sc.enrichments)
                    : [];
                  const allCategoryEnrichments = category.id === 'nh' 
                    ? nhSubCategoryEnrichments 
                    : category.enrichments;
                  const categorySelected = allCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id));
                  if (categorySelected.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="bg-white rounded-lg p-2 sm:p-3 border border-blue-100">
                      <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                        <img 
                          src={`/assets/${getIconFileName(category.id)}.webp`}
                          alt={category.title}
                          className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{category.title}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {categorySelected.length} of {allCategoryEnrichments.length} selected
                      </div>
                      <div className="mt-1 text-xs text-blue-600 font-medium truncate">
                        {categorySelected.map(e => e.label).slice(0, 2).join(', ')}
                        {categorySelected.length > 2 && ` +${categorySelected.length - 2} more`}
                      </div>
                    </div>
                  );
                })}
            </div>
              
              {selectedEnrichments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>Ready to search!</strong> Your selected enrichments will provide comprehensive location insights.
          </div>
        </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrichmentConfig;