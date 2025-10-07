import { Item } from '../types/item';

/**
 * A curated list of grocery items with location metadata. These values
 * simulate products available at various stores around the user's area.
 * Coordinates are approximate and centred around Atlanta, GA (the user's
 * specified location). Organic status is noted so that recommendations
 * always match the user's scanned product (e.g. organic vs non-organic).
 */
export const ALL_ITEMS: Item[] = [
  {
    id: 'banana-fresh-each',
    name: 'Fresh Banana, Each',
    price: 0.59,
    image:
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=400&auto=format&fit=crop',
    store: 'Walmart',
    coordinates: { lat: 33.7528, lon: -84.39 },
    isOrganic: false,
    tag: 'DEAL',
  },
  {
    id: 'market-banana-bunch',
    name: 'Marketside Fresh Organic Bananas, Bunch',
    price: 2.18,
    image:
      'https://images.unsplash.com/photo-1619546813926-f4e11210d0cc?q=80&w=400&auto=format&fit=crop',
    store: 'Walmart',
    coordinates: { lat: 33.753, lon: -84.391 },
    isOrganic: true,
  },
  {
    id: 'great-value-sliced-bananas',
    name: 'Great Value Sliced Bananas, 16 oz',
    price: 3.29,
    image:
      'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=400&auto=format&fit=crop',
    store: 'Walmart',
    coordinates: { lat: 33.7525, lon: -84.388 },
    isOrganic: false,
  },
  {
    id: 'toothpaste-hello',
    name: 'hello Fresh Watermelon Fluoride Free Kids Toothpaste, 4.2 oz',
    price: 4.46,
    image:
      'https://images.unsplash.com/photo-1629196895764-7b3d6f0d0cb9?q=80&w=400&auto=format&fit=crop',
    store: 'Target',
    coordinates: { lat: 33.749, lon: -84.39 },
    isOrganic: false,
    tag: 'DEAL',
  },
  {
    id: 'bread-maker-kbs',
    name: 'KBS 19-in-1.2LB Bread Maker LCD Display Stainless 013',
    price: 99.99,
    image:
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=400&auto=format&fit=crop',
    store: 'Best Buy',
    coordinates: { lat: 33.751, lon: -84.38 },
    isOrganic: false,
    tag: 'NO DEAL',
  },
  {
    id: 'bars-david-high-protein',
    name: 'David High Protein Bars, Cinnamon Roll Flavor, 12 ct',
    price: 39.0,
    image:
      'https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=400&auto=format&fit=crop',
    store: 'Kroger',
    coordinates: { lat: 33.754, lon: -84.394 },
    isOrganic: false,
  },
  // Additional items representing the same product at other stores for
  // comparison purposes. These duplicates allow evaluateDeal to find
  // alternatives when scanning a banana at a different store.
  {
    id: 'banana-organic-kroger',
    name: 'Organic Banana, Each',
    price: 0.79,
    image:
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=400&auto=format&fit=crop',
    store: 'Kroger',
    coordinates: { lat: 33.753, lon: -84.391 },
    isOrganic: true,
  },
  {
    id: 'banana-fresh-publix',
    name: 'Fresh Banana, Each',
    price: 0.69,
    image:
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=400&auto=format&fit=crop',
    store: 'Publix',
    coordinates: { lat: 33.752, lon: -84.389 },
    isOrganic: false,
  },
];