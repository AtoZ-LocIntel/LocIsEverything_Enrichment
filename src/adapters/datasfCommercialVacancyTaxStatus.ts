/**
 * DataSF — Commercial Vacancy Tax Status
 * Same underlying Socrata dataset as Taxable Commercial Spaces (rzkk-54yv / location_point).
 * The named “Map of Commercial Vacancy Tax Status” on DataSF visualizes this table.
 */
export { getDatasfTaxableCommercialSpacesData as getDatasfCommercialVacancyTaxStatusData } from './datasfTaxableCommercialSpaces';
export type { DatasfTaxableCommercialSpace as DatasfCommercialVacancyTaxStatusRow } from './datasfTaxableCommercialSpaces';
