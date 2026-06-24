import { z } from 'zod';

export const PROPERTY_TAG_OPTIONS = [
  'Studio',
  '1 Bedroom',
  '2 Bedroom',
  '3+ Bedroom',
  'Apartment',
  'House',
  'Office',
  'Elevator',
  'Stairs',
  'Parking Available',
] as const;

export const SERVICE_OPTIONS = [
  'Residential Moving',
  'Commercial Moving',
  'Long Distance',
  'Loading & Unloading',
  'Labor Only',
  'Packing',
  'Furniture Protection',
  'Furniture Disassembly & Assembly',
  'Storage',
  'Junk Removal',
  'Box Truck Delivery',
  'Final Mile Delivery',
  'One Time Moving',
  'Emergency Moving',
] as const;

export const ARRIVAL_WINDOWS = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Flexible'] as const;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const EstimateSchema = z.object({
  moveType: z.enum(['residential', 'office']),
  pickup: z.string().trim().min(3, 'Pickup address must be at least 3 characters.').max(300),
  delivery: z.string().trim().min(3, 'Delivery address must be at least 3 characters.').max(300),
  propertyTags: z.array(z.string()).max(20, 'Maximum 20 property details.'),
  inventory: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'Each item needs a name.').max(80),
        qty: z.number().int().positive().optional(),
      }),
    )
    .max(50, 'Maximum 50 items.'),
  services: z.array(z.string()).max(20, 'Maximum 20 services.'),
  moveDate: z.string().regex(datePattern, 'Use a valid date in YYYY-MM-DD format.'),
  arrivalWindow: z.enum(ARRIVAL_WINDOWS),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters.'),
  photoPaths: z.array(z.string()).max(5, 'Maximum 5 photos.'),
  contact: z.object({
    name: z.string().trim().min(2, 'Enter your full name.').max(100),
    email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address.')]),
    phone: z.string().trim().min(7, 'Enter a valid phone number.').max(30),
    preferredMethod: z.enum(['phone', 'email', 'text']),
  }),
  honeypot: z.literal(''),
});

export type CustomerEstimatePayload = z.infer<typeof EstimateSchema>;

export const customerEstimateDefaults = (): CustomerEstimatePayload => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return {
    moveType: 'residential',
    pickup: '',
    delivery: '',
    propertyTags: ['2 Bedroom', 'Apartment'],
    inventory: [
      { label: 'Sofa', qty: 1 },
      { label: 'Bed', qty: 2 },
      { label: 'Boxes', qty: 20 },
    ],
    services: ['Loading & Unloading', 'Furniture Protection'],
    moveDate: date.toISOString().slice(0, 10),
    arrivalWindow: 'Morning',
    notes: '',
    photoPaths: [],
    contact: { name: '', email: '', phone: '', preferredMethod: 'phone' },
    honeypot: '',
  };
};
