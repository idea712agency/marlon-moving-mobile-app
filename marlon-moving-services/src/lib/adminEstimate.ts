export type DepositStatus = 'required' | 'paid' | 'applied';

// Truck presets — flat one-time fee
export const TRUCK_PRESETS = [
  { size: '24 ft', fee: 220 },
  { size: '26 ft', fee: 240 },
  { size: '28 ft', fee: 240 },
] as const;

// Crew / labor presets — hourly
export const CREW_PRESETS = [
  { crewSize: 2, hourlyRate: 99, label: '2 Movers' },
  { crewSize: 3, hourlyRate: 149, label: '3 Movers' },
  { crewSize: 4, hourlyRate: 199, label: '4 Movers' },
] as const;

export type PackingKitId = 'none' | 'apartment' | 'townhouse' | 'single_family';

// Packing material kits — replaces the old packing package
export const PACKING_KITS = [
  { id: 'none', label: 'None', price: 0 },
  { id: 'apartment', label: 'Apartment Kit', price: 99 },
  { id: 'townhouse', label: 'Townhouse Kit', price: 149 },
  { id: 'single_family', label: 'Single Family House Kit', price: 249 },
] as const;

export type TravelZoneId = 'within_15' | '15_25' | '25_50' | '50_plus';

// Travel fee zones — distance-based, one-time
export const TRAVEL_ZONES = [
  { id: 'within_15', label: 'Within 15 miles of Sterling', range: '0–15 mi', fee: 0 },
  { id: '15_25', label: '15–25 miles', range: '15–25 mi', fee: 99 },
  { id: '25_50', label: '25–50 miles', range: '25–50 mi', fee: 150 },
  { id: '50_plus', label: '50+ miles (custom quote)', range: '50+ mi', fee: null },
] as const;

export type EstimateContact = {
  contactId: string | null;
  name: string;
  phone: string;
  email: string;
};

export type EstimateAddresses = {
  origin: string;
  destination: string;
  homeSize: string;
};

export type EstimateSchedule = {
  moveDate: string;
  arrivalWindow: string;
};

export type EstimateCrew = {
  size: number;
  hourlyRate: number;
  truckFee: number;
  truckSize: string;
  minimumHours: number;
};

export type EstimateOptions = {
  packingPackage: boolean;
  packingPrice: number;
  packingPackagePrice?: number;
  packingKit?: PackingKitId;
  noTravelTime: boolean;
};

export type EstimateDeposit = {
  requiredAmount: number;
  paidAmount: number;
  status: DepositStatus;
};

export type EstimateUpdatedCopy = {
  isUpdatedCopy: boolean;
  date: string;
  notice: string;
};

export type EstimatePayload = {
  estimateNumber: string;
  issuedDate: string;
  contact: EstimateContact;
  addresses: EstimateAddresses;
  schedule: EstimateSchedule;
  crew: EstimateCrew;
  travelFee?: number;
  travelZone?: TravelZoneId;
  options: EstimateOptions;
  deposit: EstimateDeposit;
  hours: number[];
  updatedCopy: EstimateUpdatedCopy;
  notes: string;
  converted_job_id?: string | null;
};

export type HoursRow = {
  hours: number;
  labor: number;
  packing: number;
  truckFee: number;
  travelFee: number;
  total: number;
  depositPaid: number;
  afterDeposit: number;
};

const today = () => new Date().toISOString().slice(0, 10);

export const buildEstimateNumber = (date = new Date(), sequence?: number) => {
  const year = date.getFullYear();
  const serial = sequence ?? Math.floor(Math.random() * 9000) + 1000;
  return `MMS-${year}-${String(serial).padStart(4, '0')}`;
};

export const DEFAULT_ESTIMATE: EstimatePayload = {
  estimateNumber: buildEstimateNumber(),
  issuedDate: today(),
  contact: { contactId: null, name: '', phone: '', email: '' },
  addresses: { origin: '', destination: '', homeSize: '' },
  schedule: { moveDate: '', arrivalWindow: '8:00 AM – 9:00 AM' },
  crew: { size: 3, hourlyRate: 149, truckFee: 240, truckSize: '28 ft', minimumHours: 3 },
  travelFee: 0,
  travelZone: 'within_15',
  options: { packingPackage: false, packingPrice: 149, packingPackagePrice: 149, packingKit: 'none', noTravelTime: true },
  deposit: { requiredAmount: 250, paidAmount: 0, status: 'required' },
  hours: [7, 8, 10, 12],
  updatedCopy: { isUpdatedCopy: false, date: '', notice: '' },
  notes: '',
  converted_job_id: null,
};

export const resolvePackingPrice = (estimate: EstimatePayload) => {
  const kit = PACKING_KITS.find((item) => item.id === estimate.options.packingKit);
  if (kit && kit.id !== 'none') return { label: kit.label, price: kit.price, id: kit.id };
  if (estimate.options.packingPackage) {
    const price = estimate.options.packingPackagePrice ?? estimate.options.packingPrice ?? 0;
    return { label: 'Packing & Protection Package', price, id: 'legacy' as const };
  }
  return { label: 'None', price: 0, id: 'none' as const };
};

export const hasPackingCharge = (estimate: EstimatePayload) => resolvePackingPrice(estimate).price > 0;

export const resolveTravelZone = (estimate: EstimatePayload) =>
  TRAVEL_ZONES.find((zone) => zone.id === (estimate.travelZone ?? 'within_15')) ?? TRAVEL_ZONES[0];

export const resolveTravelLabel = (estimate: EstimatePayload) => {
  const zone = resolveTravelZone(estimate);
  const fee = estimate.travelFee ?? 0;
  if (zone.id === 'within_15' && fee === 0) return null;
  if (zone.id === 'within_15') return `Free (within 15 mi of Sterling) — ${formatMoney(fee)}`;
  if (zone.id === '50_plus') return fee > 0 ? `Custom — ${formatMoney(fee)}` : 'Custom quote';
  return `${zone.range} · ${formatMoney(fee)}`;
};

export const computeHoursRow = (estimate: EstimatePayload, requestedHours: number): HoursRow => {
  const hours = Math.max(requestedHours, estimate.crew.minimumHours);
  const labor = Math.round(hours * estimate.crew.hourlyRate);
  const packing = resolvePackingPrice(estimate).price;
  const truckFee = estimate.crew.truckFee;
  const travelFee = estimate.travelFee ?? 0;
  const total = labor + packing + truckFee + travelFee;
  const depositPaid =
    estimate.deposit.status === 'paid' || estimate.deposit.status === 'applied'
      ? Math.min(total, estimate.deposit.paidAmount)
      : 0;
  return { hours, labor, packing, truckFee, travelFee, total, depositPaid, afterDeposit: total - depositPaid };
};

export const computeGrid = (estimate: EstimatePayload) =>
  estimate.hours.map((hours) => computeHoursRow(estimate, hours));

export const priceRange = (estimate: EstimatePayload) => {
  const totals = computeGrid(estimate).map((row) => row.total);
  return { min: Math.min(...totals), max: Math.max(...totals) };
};

export const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export const isEstimatePayload = (value: unknown): value is EstimatePayload => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.estimateNumber === 'string' && Array.isArray(record.hours) && Boolean(record.contact) && Boolean(record.crew);
};

export const estimateFromUnknown = (value: unknown): EstimatePayload => {
  const defaults = JSON.parse(JSON.stringify(DEFAULT_ESTIMATE)) as EstimatePayload;
  if (!isEstimatePayload(value)) {
    defaults.estimateNumber = buildEstimateNumber();
    defaults.issuedDate = today();
    return defaults;
  }
  return {
    ...defaults,
    ...value,
    contact: { ...DEFAULT_ESTIMATE.contact, ...value.contact },
    addresses: { ...DEFAULT_ESTIMATE.addresses, ...value.addresses },
    schedule: { ...DEFAULT_ESTIMATE.schedule, ...value.schedule },
    crew: { ...DEFAULT_ESTIMATE.crew, ...value.crew },
    options: { ...DEFAULT_ESTIMATE.options, ...value.options },
    travelFee: value.travelFee ?? DEFAULT_ESTIMATE.travelFee,
    travelZone: value.travelZone ?? DEFAULT_ESTIMATE.travelZone,
    deposit: { ...DEFAULT_ESTIMATE.deposit, ...value.deposit },
    updatedCopy: { ...DEFAULT_ESTIMATE.updatedCopy, ...value.updatedCopy },
    hours: value.hours.length ? value.hours : DEFAULT_ESTIMATE.hours,
  };
};
