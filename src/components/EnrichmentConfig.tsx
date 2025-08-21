import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronRight, Users, Building2, Heart, Zap, TreePine, Mountain, Bus, Coffee } from 'lucide-react';

interface EnrichmentConfigProps {
  selectedEnrichments: string[];
  onSelectionChange: (enrichments: string[]) => void;
  poiRadii: Record<string, number>;
  onPoiRadiiChange: (radii: Record<string, number>) => void;
}

interface EnrichmentCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  enrichments: EnrichmentItem[];
}

interface EnrichmentItem {
  id: string;
  label: string;
  description: string;
  isPOI: boolean;
  defaultRadius: number;
  category: string;
}

const ENRICHMENT_CATEGORIES: EnrichmentCategory[] = [
  {
    id: 'core',
    title: 'Core Attributes',
    icon: <Settings className="w-5 h-5" />,
    description: 'Basic location and environmental data',
    enrichments: [
      { id: 'elev', label: 'Elevation', description: 'Terrain elevation in meters', isPOI: false, defaultRadius: 0, category: 'core' },
      { id: 'airq', label: 'Air Quality', description: 'PM2.5 air quality index', isPOI: false, defaultRadius: 0, category: 'core' },
      { id: 'fips', label: 'Census IDs', description: 'FIPS codes for state/county/tract', isPOI: false, defaultRadius: 0, category: 'core' },
      { id: 'acs', label: 'Demographics', description: 'ACS population and income data', isPOI: false, defaultRadius: 0, category: 'core' },
      { id: 'nws_alerts', label: 'Weather Alerts', description: 'Active NWS weather alerts', isPOI: false, defaultRadius: 0, category: 'core' }
    ]
  },
  {
    id: 'community',
    title: 'Community & Services',
    icon: <Users className="w-5 h-5" />,
    description: 'Schools, hospitals, parks, and community facilities',
    enrichments: [
      { id: 'poi_schools', label: 'Schools', description: 'Educational institutions', isPOI: true, defaultRadius: 5, category: 'community' },
      { id: 'poi_hospitals', label: 'Hospitals', description: 'Medical facilities and clinics', isPOI: true, defaultRadius: 5, category: 'community' },
      { id: 'poi_parks', label: 'Parks', description: 'Public parks and recreation areas', isPOI: true, defaultRadius: 5, category: 'community' },
      { id: 'poi_worship', label: 'Places of Worship', description: 'Religious institutions', isPOI: true, defaultRadius: 5, category: 'community' }
    ]
  },
  {
    id: 'retail',
    title: 'Retail & Commerce',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Shopping, dining, and commercial services',
    enrichments: [
      { id: 'poi_grocery', label: 'Grocery Stores', description: 'Supermarkets and food markets', isPOI: true, defaultRadius: 3, category: 'retail' },
      { id: 'poi_restaurants', label: 'Restaurants', description: 'Dining establishments', isPOI: true, defaultRadius: 3, category: 'retail' },
      { id: 'poi_banks', label: 'Banks & ATMs', description: 'Financial institutions', isPOI: true, defaultRadius: 3, category: 'retail' },
      { id: 'poi_pharmacies', label: 'Pharmacies', description: 'Drug stores and pharmacies', isPOI: true, defaultRadius: 3, category: 'retail' }
    ]
  },
  {
    id: 'health',
    title: 'Health & Wellness',
    icon: <Heart className="w-5 h-5" />,
    description: 'Healthcare, fitness, and wellness services',
    enrichments: [
      { id: 'poi_doctors_clinics', label: 'Doctors & Clinics', description: 'Medical practices', isPOI: true, defaultRadius: 3, category: 'health' },
      { id: 'poi_dentists', label: 'Dentists', description: 'Dental care providers', isPOI: true, defaultRadius: 3, category: 'health' },
      { id: 'poi_gyms', label: 'Gyms & Fitness', description: 'Fitness centers and gyms', isPOI: true, defaultRadius: 3, category: 'health' }
    ]
  },
  {
    id: 'transportation',
    title: 'Transportation',
    icon: <Bus className="w-5 h-5" />,
    description: 'Public transit, airports, and transportation hubs',
    enrichments: [
      { id: 'poi_tnm_airports', label: 'Airports', description: 'Commercial and private airports', isPOI: true, defaultRadius: 10, category: 'transportation' },
      { id: 'poi_tnm_railroads', label: 'Railroads', description: 'Rail lines and stations', isPOI: true, defaultRadius: 15, category: 'transportation' },
      { id: 'poi_tnm_trails', label: 'Trails', description: 'Hiking and biking trails', isPOI: true, defaultRadius: 10, category: 'transportation' }
    ]
  },
  {
    id: 'infrastructure',
    title: 'Power & Infrastructure',
    icon: <Zap className="w-5 h-5" />,
    description: 'Utilities, power plants, and infrastructure',
    enrichments: [
      { id: 'poi_power_plants_openei', label: 'Power Plants', description: 'Electric power generation facilities', isPOI: true, defaultRadius: 25, category: 'infrastructure' },
      { id: 'poi_substations', label: 'Substations', description: 'Electrical substations', isPOI: true, defaultRadius: 6, category: 'infrastructure' },
      { id: 'poi_cell_towers', label: 'Cell Towers', description: 'Telecommunications infrastructure', isPOI: true, defaultRadius: 3, category: 'infrastructure' }
    ]
  },
  {
    id: 'environment',
    title: 'Environment & Hazards',
    icon: <TreePine className="w-5 h-5" />,
    description: 'Environmental data, hazards, and natural features',
    enrichments: [
      { id: 'poi_eq', label: 'Earthquakes', description: 'Recent seismic activity (M≥2.5)', isPOI: true, defaultRadius: 100, category: 'environment' },
      { id: 'poi_fema_floodzones', label: 'Flood Zones', description: 'FEMA flood hazard areas', isPOI: true, defaultRadius: 2, category: 'environment' },
      { id: 'poi_usgs_volcano', label: 'Volcanoes', description: 'Active and dormant volcanoes', isPOI: true, defaultRadius: 100, category: 'environment' }
    ]
  },
  {
    id: 'recreation',
    title: 'Recreation & Leisure',
    icon: <Mountain className="w-5 h-5" />,
    description: 'Outdoor activities, entertainment, and recreation',
    enrichments: [
      { id: 'poi_tnm_trailheads', label: 'Trailheads', description: 'Hiking trail starting points', isPOI: true, defaultRadius: 10, category: 'recreation' },
      { id: 'poi_cinemas', label: 'Cinemas', description: 'Movie theaters', isPOI: true, defaultRadius: 5, category: 'recreation' },
      { id: 'poi_hotels', label: 'Hotels', description: 'Accommodation options', isPOI: true, defaultRadius: 5, category: 'recreation' }
    ]
  },
  {
    id: 'quirky',
    title: 'Quirky & Fun',
    icon: <Coffee className="w-5 h-5" />,
    description: 'Interesting and unique nearby places',
    enrichments: [
      { id: 'poi_breweries', label: 'Breweries', description: 'Craft breweries and beer', isPOI: true, defaultRadius: 10, category: 'quirky' },
      { id: 'poi_wikipedia', label: 'Wikipedia Articles', description: 'Nearby points of interest', isPOI: true, defaultRadius: 3, category: 'quirky' }
    ]
  }
];

const EnrichmentConfig: React.FC<EnrichmentConfigProps> = ({
  selectedEnrichments,
  onSelectionChange,
  poiRadii,
  onPoiRadiiChange
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core']));

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEnrichmentToggle = (enrichmentId: string) => {
    const newSelected = selectedEnrichments.includes(enrichmentId)
      ? selectedEnrichments.filter(id => id !== enrichmentId)
      : [...selectedEnrichments, enrichmentId];
    onSelectionChange(newSelected);
  };

  const handleRadiusChange = (enrichmentId: string, radius: number) => {
    onPoiRadiiChange({
      ...poiRadii,
      [enrichmentId]: radius
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enrichment Configuration</h3>
            <p className="text-sm text-gray-700">Select data sources and configure search radii</p>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="space-y-4">
          {ENRICHMENT_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const categoryEnrichments = category.enrichments;
            const selectedInCategory = categoryEnrichments.filter(e => selectedEnrichments.includes(e.id));

            return (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-700">
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900">{category.title}</h4>
                      <p className="text-sm text-gray-700">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedInCategory.length > 0 && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                        {selectedInCategory.length} selected
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="grid gap-3">
                      {categoryEnrichments.map((enrichment) => {
                        const isSelected = selectedEnrichments.includes(enrichment.id);
                        const currentRadius = poiRadii[enrichment.id] || enrichment.defaultRadius;

                        return (
                          <div key={enrichment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={enrichment.id}
                                checked={isSelected}
                                onChange={() => handleEnrichmentToggle(enrichment.id)}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <div>
                                <label htmlFor={enrichment.id} className="font-medium text-gray-900 cursor-pointer">
                                  {enrichment.label}
                                </label>
                                <p className="text-sm text-gray-700">{enrichment.description}</p>
                              </div>
                            </div>

                            {enrichment.isPOI && isSelected && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900 font-medium">Radius:</span>
                                <input
                                  type="number"
                                  min="0.1"
                                  max="100"
                                  step="0.1"
                                  value={currentRadius}
                                  onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                                />
                                <span className="text-sm text-gray-900 font-medium">miles</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Selected Enrichments</h4>
          <div className="flex flex-wrap gap-2">
            {selectedEnrichments.length === 0 ? (
              <span className="text-sm text-blue-700">No enrichments selected</span>
            ) : (
              selectedEnrichments.map(id => {
                const enrichment = ENRICHMENT_CATEGORIES
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
  );
};

export default EnrichmentConfig;
