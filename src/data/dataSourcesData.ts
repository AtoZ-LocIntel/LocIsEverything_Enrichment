// Shared data sources array for both desktop and mobile views
export interface DataSource {
  name: string;
  description: string;
  coverage: string;
  accuracy: string;
  cost: string;
  url?: string;
}

export interface DataSourceCategory {
  category: string;
  sources: DataSource[];
}

// This will be populated by copying from DataSourcesView
// For now, we'll import it dynamically or extract it
export const dataSources: DataSourceCategory[] = [];

