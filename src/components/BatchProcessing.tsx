import React, { useState, useRef, useMemo, type Dispatch, type SetStateAction } from 'react';
import { Upload, AlertTriangle, Clock, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';
import Papa from 'papaparse';

interface BatchProcessingProps {
  onComplete: (results: any[]) => void;
  selectedEnrichments: string[];
  poiRadii: Record<string, number>;
  onLoadingChange?: (isLoading: boolean) => void;
  /** Persisted in App — survives leaving the config view to choose enrichments */
  batchFile: BatchFilePersistedState;
  onBatchFileChange: Dispatch<SetStateAction<BatchFilePersistedState>>;
}

/** Matches public/geocoder.html batch behavior */
const MAX_BATCH_ROWS = 5000;
const WARN_BATCH_ROWS = 500;

type AddressMode = 'single' | 'component';

export interface FieldMapping {
  mode: AddressMode;
  singleColumn: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export const defaultMapping = (): FieldMapping => ({
  mode: 'single',
  singleColumn: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: '',
});

/** CSV + mapping state lifted to App so it survives navigation (e.g. enrichment category). */
export interface BatchFilePersistedState {
  csvRows: Record<string, unknown>[];
  csvHeaders: string[];
  csvFileName: string;
  mapping: FieldMapping;
  rowLimitInput: string;
  isExpanded: boolean;
}

export function createEmptyBatchFileState(): BatchFilePersistedState {
  return {
    csvRows: [],
    csvHeaders: [],
    csvFileName: '',
    mapping: defaultMapping(),
    rowLimitInput: '',
    isExpanded: false,
  };
}

function guessDefaultSingleColumn(headers: string[]): string {
  if (!headers.length) return '';
  const patterns = [/address|addr|full.?street|location|street.?address|place|site.?address/i];
  for (const h of headers) {
    if (patterns.some((p) => p.test(h))) return h;
  }
  return headers[0];
}

/** Strip UTF-8 BOM and trim so column names match row keys reliably */
function normalizeHeaderKey(key: string): string {
  return key.replace(/^\uFEFF/, '').trim();
}

/** Normalize Papa-parse field names and row keys (fixes BOM on first column). */
function normalizeCsvDataset(
  fields: string[],
  raw: Record<string, unknown>[]
): { fields: string[]; rows: Record<string, unknown>[] } {
  const normFields = fields.map(normalizeHeaderKey);
  const rows = raw.map((row) => {
    const out: Record<string, unknown> = {};
    fields.forEach((oldKey, i) => {
      const newKey = normFields[i];
      const v = row[oldKey] !== undefined ? row[oldKey] : row[newKey];
      if (v !== undefined) out[newKey] = v;
    });
    return out;
  });
  return { fields: normFields, rows };
}

/**
 * When the CSV has a street column plus city/state/ZIP, use component mode so the geocoder
 * gets a full line (street-only strings like "146 Lafayette Road" are ambiguous worldwide).
 */
function inferColumnMapping(headers: string[]): FieldMapping {
  if (!headers.length) return defaultMapping();

  const h = headers;
  const lower = h.map((x) => x.toLowerCase());

  const at = (name: string): string => {
    const i = lower.indexOf(name.toLowerCase());
    return i >= 0 ? h[i] : '';
  };

  const firstMatch = (res: RegExp[]): string => {
    for (const re of res) {
      const i = lower.findIndex((col) => re.test(col));
      if (i >= 0) return h[i];
    }
    return '';
  };

  const street =
    at('address') ||
    at('street') ||
    firstMatch([/^street_address$/i, /^address_line_1$/i, /^address1$/i, /^addr_line1$/i, /^addr1$/i]);

  const city = at('city') || at('town') || firstMatch([/^municipality$/i]);
  const state = at('state') || firstMatch([/^province$/i]);
  const zip =
    at('zip') ||
    at('zipcode') ||
    firstMatch([/^postal$/i, /^postcode$/i, /^postal_code$/i, /^zip_code$/i]);
  const country = at('country') || at('nation');

  const hasStreet = Boolean(street);
  const hasMetro = Boolean(city || state || zip);

  if (hasStreet && hasMetro) {
    return {
      mode: 'component',
      singleColumn: '',
      street,
      city,
      state,
      zip,
      country,
    };
  }

  if (city && (state || zip)) {
    return {
      mode: 'component',
      singleColumn: '',
      street: street || '',
      city,
      state,
      zip,
      country,
    };
  }

  return {
    mode: 'single',
    singleColumn: guessDefaultSingleColumn(h),
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  };
}

/** US-style single line: street, city, ST ZIP [, country] — helps geocoders disambiguate */
function buildAddressFromRow(row: Record<string, unknown>, m: FieldMapping): string {
  if (m.mode === 'single' && m.singleColumn) {
    const v = row[m.singleColumn];
    return v != null ? String(v).trim() : '';
  }

  const street = m.street && row[m.street] != null ? String(row[m.street]).trim() : '';
  const city = m.city && row[m.city] != null ? String(row[m.city]).trim() : '';
  const state = m.state && row[m.state] != null ? String(row[m.state]).trim() : '';
  const zip = m.zip && row[m.zip] != null ? String(row[m.zip]).trim() : '';
  let country = m.country && row[m.country] != null ? String(row[m.country]).trim() : '';

  if (!country && state && /^[A-Za-z]{2}$/.test(state)) {
    const z = zip.replace(/\s/g, '');
    if (z && /^\d{5}(-\d{4})?$/.test(z)) {
      country = 'USA';
    }
  }

  const stateZip = [state, zip].filter(Boolean).join(' ');
  const cityStateZip = [city, stateZip].filter(Boolean).join(', ');
  const afterStreet = [cityStateZip, country].filter(Boolean).join(', ');
  return [street, afterStreet].filter(Boolean).join(', ');
}

function mappingIsValid(m: FieldMapping): boolean {
  if (m.mode === 'single') {
    return Boolean(m.singleColumn);
  }
  return Boolean(m.street || m.city || m.state || m.zip || m.country);
}

const BatchProcessing: React.FC<BatchProcessingProps> = ({
  onComplete,
  selectedEnrichments,
  poiRadii,
  onLoadingChange,
  batchFile,
  onBatchFileChange,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAddress, setCurrentAddress] = useState('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [totalAddresses, setTotalAddresses] = useState(0);
  const [showRateLimitInfo, setShowRateLimitInfo] = useState(false);

  const { csvRows, csvHeaders, csvFileName, mapping, rowLimitInput, isExpanded } = batchFile;
  const patchBatch = (patch: Partial<BatchFilePersistedState>) => {
    onBatchFileChange((prev) => ({ ...prev, ...patch }));
  };

  const [parseError, setParseError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewAddresses = useMemo(() => {
    if (!csvRows.length || !mappingIsValid(mapping)) return [];
    const out: string[] = [];
    for (let i = 0; i < Math.min(3, csvRows.length); i++) {
      const a = buildAddressFromRow(csvRows[i], mapping);
      if (a) out.push(a);
    }
    return out;
  }, [csvRows, mapping]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setParseError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fieldsRaw = results.meta.fields?.filter(Boolean) as string[];
        const raw = (results.data as Record<string, unknown>[]).filter(
          (row) => row && typeof row === 'object' && Object.keys(row).length > 0
        );
        if (!fieldsRaw?.length || !raw.length) {
          setParseError('No data rows found. Check that the CSV has headers and at least one row.');
          event.target.value = '';
          return;
        }
        const { fields, rows } = normalizeCsvDataset(fieldsRaw, raw);
        onBatchFileChange((prev) => ({
          ...prev,
          csvHeaders: fields,
          csvRows: rows,
          csvFileName: file.name,
          mapping: inferColumnMapping(fields),
          rowLimitInput: '',
          isExpanded: true,
        }));
        event.target.value = '';
      },
      error: (err) => {
        console.error('CSV parsing error:', err);
        setParseError(err.message || 'Could not parse CSV.');
        event.target.value = '';
      },
    });
  };

  const clearCsv = () => {
    onBatchFileChange(() => createEmptyBatchFileState());
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartBatch = () => {
    if (!mappingIsValid(mapping)) {
      alert('Choose a single address column, or map at least one address component (street, city, state, ZIP, or country).');
      return;
    }

    let rows = csvRows;
    const limitRaw = rowLimitInput.trim();
    if (limitRaw) {
      const n = parseInt(limitRaw, 10);
      if (Number.isFinite(n) && n > 0) {
        rows = rows.slice(0, n);
      }
    }

    const addresses = rows
      .map((row) => buildAddressFromRow(row, mapping))
      .map((a) => a.trim())
      .filter(Boolean);

    if (addresses.length === 0) {
      alert('No non-empty addresses could be built from your mapping. Adjust columns or row limit.');
      return;
    }

    if (addresses.length > MAX_BATCH_ROWS) {
      alert(
        `This batch has ${addresses.length} addresses. Maximum is ${MAX_BATCH_ROWS} per run. Split your CSV or use Row limit.`
      );
      return;
    }

    if (addresses.length > WARN_BATCH_ROWS) {
      const ok = window.confirm(
        `You are about to process ${addresses.length} addresses (>${WARN_BATCH_ROWS}). This may take a long time. Continue?`
      );
      if (!ok) return;
    }

    processBatch(addresses);
  };

  const processBatch = async (addresses: string[]) => {
    setIsProcessing(true);
    onLoadingChange?.(true);
    setProgress(0);
    setTotalAddresses(addresses.length);
    setEstimatedTimeRemaining(0);

    try {
      const { EnrichmentService } = await import('../services/EnrichmentService');
      const enrichmentService = new EnrichmentService();

      const results: any[] = [];

      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        setCurrentAddress(address);
        setProgress(((i + 1) / addresses.length) * 100);

        const baseTimePerAddress = 0.8;
        const enrichmentTime = selectedEnrichments.length * 0.3;
        const estimatedTimePerAddress = baseTimePerAddress + enrichmentTime;
        const remainingAddresses = addresses.length - i - 1;
        setEstimatedTimeRemaining(remainingAddresses * estimatedTimePerAddress);

        if (address.trim()) {
          try {
            const result = await enrichmentService.enrichSingleLocation(address, selectedEnrichments, poiRadii);
            results.push(result);
          } catch (error) {
            console.error(`Failed to enrich address: ${address}`, error);
            results.push({
              location: {
                source: 'Failed',
                lat: 0,
                lon: 0,
                name: address,
                confidence: 0,
                raw: {},
              },
              enrichments: { error: 'Geocoding failed' },
            });
          }
        }
      }

      setProgress(100);
      setIsProcessing(false);
      onLoadingChange?.(false);
      clearCsv();
      onComplete(results);
    } catch (error) {
      console.error('Batch processing failed:', error);
      setIsProcessing(false);
      onLoadingChange?.(false);
      alert('Batch processing failed. Please try again.');
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    }
    if (seconds < 3600) {
      return `${Math.round(seconds / 60)} minutes`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const selectClass =
    'w-full mt-1 px-3 py-2 rounded-md bg-gray-800 border border-gray-600 text-white text-sm focus:ring-2 focus:ring-blue-500';

  return (
    <div id="batch-processing-section" className="batch-processing card">
      <div
        className="card-header cursor-pointer hover:bg-gray-700 transition-colors duration-200"
        onClick={() => patchBatch({ isExpanded: !isExpanded })}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg flex items-center justify-center">
              <img
                src="/assets/new-logo.webp"
                alt="The Location Is Everything Co Logo"
                className="w-16 h-16 lg:w-20 lg:h-20 object-contain"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                Batch Address Processing
              </h3>
              <p className="text-xs text-gray-200">Upload CSV → map columns → run geocoding & enrichment</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="card-content">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowRateLimitInfo(!showRateLimitInfo)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              <Info className="w-4 h-4" />
              <span>View Rate Limits & Performance Info</span>
            </button>

            {showRateLimitInfo && (
              <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Rate Limits & Performance</span>
                </h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Nominatim (OSM):</span>
                    <span>1 request/second (global coverage)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">US Census:</span>
                    <span>10 requests/second (US addresses only)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">GeoNames:</span>
                    <span>4 requests/second (geographic database)</span>
                  </div>
                  <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                    <strong>Processing Time:</strong> ~
                    {Math.round((0.8 + selectedEnrichments.length * 0.3) * 10) / 10}s per address (includes rate
                    limiting delays)
                  </div>
                  <div className="text-xs mt-2">
                    Hard cap: <strong>{MAX_BATCH_ROWS}</strong> addresses per run. Confirmation prompt above{' '}
                    <strong>{WARN_BATCH_ROWS}</strong> rows.
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isProcessing ? (
            <div className="space-y-4">
              {parseError && (
                <div className="p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-100 text-sm">{parseError}</div>
              )}

              {!csvRows.length ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-white mb-2">Upload your CSV file</p>
                  <p className="text-sm text-gray-300 mb-4">
                    After upload, you will map which column(s) contain the address — then start the batch.
                  </p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-primary">
                    Choose CSV File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-800 rounded-lg border border-gray-600">
                    <p className="text-sm text-gray-200">
                      <strong className="text-white">Loaded:</strong> {csvFileName} — {csvRows.length} row
                      {csvRows.length !== 1 ? 's' : ''}
                    </p>
                    <button type="button" onClick={clearCsv} className="text-sm text-amber-400 hover:text-amber-200 underline">
                      Remove file & start over
                    </button>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 space-y-4">
                    <h4 className="font-semibold text-white flex items-center gap-2">📋 Address field mapping</h4>
                    <p className="text-xs text-gray-400">
                      Choose <strong>one</strong> option: a single full-address column, or multiple columns (street, city,
                      state, etc.).
                    </p>

                    <div className="flex gap-4 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                        <input
                          type="radio"
                          name="addrMode"
                          checked={mapping.mode === 'single'}
                          onChange={() => patchBatch({ mapping: { ...mapping, mode: 'single' } })}
                        />
                        Option A: Single address column
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                        <input
                          type="radio"
                          name="addrMode"
                          checked={mapping.mode === 'component'}
                          onChange={() => patchBatch({ mapping: { ...mapping, mode: 'component' } })}
                        />
                        Option B: Street / city / state / ZIP / country
                      </label>
                    </div>

                    {mapping.mode === 'single' && (
                      <div>
                        <label className="block text-sm text-gray-300">Column containing full address</label>
                        <select
                          className={selectClass}
                          value={mapping.singleColumn}
                          onChange={(e) => patchBatch({ mapping: { ...mapping, singleColumn: e.target.value } })}
                        >
                          <option value="">— Select column —</option>
                          {csvHeaders.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-amber-200/90 mt-2">
                          If your file has separate columns for street, city, state, and ZIP, use Option B. Mapping only the
                          street column (without city/state) often geocodes to the wrong region.
                        </p>
                      </div>
                    )}

                    {mapping.mode === 'component' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            ['street', 'Street address'],
                            ['city', 'City'],
                            ['state', 'State'],
                            ['zip', 'ZIP / postal'],
                            ['country', 'Country'],
                          ] as const
                        ).map(([key, label]) => (
                          <div key={key}>
                            <label className="block text-sm text-gray-300">{label}</label>
                            <select
                              className={selectClass}
                              value={mapping[key]}
                              onChange={(e) =>
                                patchBatch({
                                  mapping: { ...mapping, [key]: e.target.value },
                                })
                              }
                            >
                              <option value="">— None —</option>
                              {csvHeaders.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-gray-300">Row limit (optional)</label>
                      <input
                        type="number"
                        min={1}
                        placeholder={`All ${csvRows.length} rows`}
                        value={rowLimitInput}
                        onChange={(e) => patchBatch({ rowLimitInput: e.target.value })}
                        className="w-full max-w-xs mt-1 px-3 py-2 rounded-md bg-gray-900 border border-gray-600 text-white text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Process only the first N rows of the file.</p>
                    </div>

                    {previewAddresses.length > 0 && (
                      <div className="p-3 rounded-md bg-gray-900 border border-gray-700">
                        <div className="text-xs font-semibold text-gray-400 mb-2">Preview (first rows)</div>
                        <ul className="text-sm text-emerald-300 space-y-1 list-disc list-inside">
                          {previewAddresses.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleStartBatch}
                      disabled={!mappingIsValid(mapping)}
                      className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🚀 Start batch processing
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span>Batch size guidelines</span>
                </h4>
                <div className="text-sm text-gray-200 space-y-1">
                  <div>
                    • <strong>1–100 addresses:</strong> ~1–2 minutes
                  </div>
                  <div>
                    • <strong>100–500 addresses:</strong> ~2–8 minutes
                  </div>
                  <div>
                    • <strong>500+ addresses:</strong> longer; you will be asked to confirm
                  </div>
                  <div className="text-xs text-gray-300 mt-2">
                    💡 Large batches are supported but take longer due to rate limiting
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Enrichment configuration</span>
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>
                    • <strong>Customize your batch:</strong> Scroll down to select which data sources to include
                  </div>
                  <div>
                    • <strong>Set search radii:</strong> Configure how far to search for points of interest
                  </div>
                  <div>
                    • <strong>Data sources:</strong> Choose from many enrichment options below
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-200">
                  <span>Processing addresses...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Processing: {currentAddress}</p>
                    <p className="text-xs text-blue-700">
                      {Math.round((progress * totalAddresses) / 100)} of {totalAddresses} addresses
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Estimated time remaining: {formatTime(estimatedTimeRemaining)}
                    </p>
                    <p className="text-xs text-green-700">
                      Total estimated time:{' '}
                      {formatTime(totalAddresses * (0.8 + selectedEnrichments.length * 0.3))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-gray-200">
                <p>⏳ Rate limiting is active to respect API limits</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchProcessing;
