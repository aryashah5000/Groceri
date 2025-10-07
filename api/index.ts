import { Item, Recommendation } from '../types/item';
import {
  getKrogerAccessToken,
  searchKrogerLocations,
  getKrogerProductByUPC,
  getKrogerDeals,
  searchKrogerProducts,
} from './kroger';
import {
  searchWalmartStores,
  getWalmartProductByUPC,
  getWalmartDeals,
  searchWalmartProducts,
} from './walmart';

/**
 * Generic API entry point used by the scanner. Given a UPC and user
 * coordinates this helper attempts to resolve the scanned product and
 * find competing prices across multiple grocery chains. The first
 * returned item corresponds to the store where the product was
 * originally scanned, while the array of recommendations lists other
 * stores with comparable items sorted by price.
 *
 * Note: If both Kroger and Walmart return results, the function
 * selects the nearest store (by distance) to treat as the scanned
 * store. Modify the logic as needed if you have additional APIs.
 */
export async function fetchProductWithDeals(
  upc: string,
  latitude: number,
  longitude: number,
  radiusMiles = 5,
): Promise<{ item: Item | null; deals: Recommendation[] }> {
  // Acquire tokens for each provider if keys are defined
  const krogerToken = await getKrogerAccessToken();
  // Determine if Walmart affiliate credentials are configured
  const hasWalmart = !!process.env.WALMART_PUBLISHER_ID;
  // Query candidate product details concurrently
  const krogerPromise = (async () => {
    if (!krogerToken) return null;
    // Find the nearest Kroger store to derive a location id
    const krogerLocations = await searchKrogerLocations(
      latitude,
      longitude,
      radiusMiles,
      krogerToken,
    );
    if (krogerLocations.length === 0) return null;
    // Pick the closest store (we could refine by distance)
    const loc = krogerLocations[0];
    const product = await getKrogerProductByUPC(upc, loc.locationId, krogerToken);
    if (product) {
      product.store = loc.name;
      product.coordinates = loc.coordinates;
    }
    return product;
  })();
  const walmartPromise = (async () => {
    if (!hasWalmart) return null;
    const walmartStores = await searchWalmartStores(
      latitude,
      longitude,
      radiusMiles,
    );
    if (walmartStores.length === 0) return null;
    const store = walmartStores[0];
    const product = await getWalmartProductByUPC(
      upc,
      store.id,
      store.zipCode,
    );
    if (product) {
      product.coordinates = undefined; // Walmart API may not return coordinates
    }
    return product;
  })();
  const [krogerItem, walmartItem] = await Promise.all([krogerPromise, walmartPromise]);
  // Determine which provider returned a product; choose the one with
  // non-null coordinates or fall back to whichever is defined first
  let item: Item | null = krogerItem ?? walmartItem ?? null;
  // Fetch deals from other providers (excluding the scanned store)
  const deals: Recommendation[] = [];
  if (item) {
    // If scanned from Kroger, get deals from Walmart (and vice versa)
    if (krogerItem && hasWalmart) {
      const walmartDeals = await getWalmartDeals(
        upc,
        latitude,
        longitude,
        radiusMiles,
      );
      deals.push(...walmartDeals);
    }
    if (walmartItem && krogerToken) {
      const krogerDeals = await getKrogerDeals(
        upc,
        latitude,
        longitude,
        radiusMiles,
        krogerToken,
      );
      deals.push(...krogerDeals);
    }
    // Filter out deals with the same store as the scanned item
    const scannedStore = item.store?.toLowerCase();
    const filteredDeals = deals.filter(
      (d) => d.store.toLowerCase() !== scannedStore,
    );
    // Sort by price ascending
    filteredDeals.sort((a, b) => a.price - b.price);
    return { item, deals: filteredDeals };
  }
  return { item: null, deals: [] };
}

/**
 * Perform a product search across available providers. The search term
 * is passed to each API and the resulting items are merged into a
 * single list. Each item includes price and store information for
 * nearby locations. If no API keys are configured for a provider
 * the corresponding results will be omitted.
 */
export async function searchProducts(
  term: string,
  latitude: number,
  longitude: number,
  radiusMiles = 5,
): Promise<Item[]> {
  const krogerToken = await getKrogerAccessToken();
  const hasWalmart = !!process.env.WALMART_PUBLISHER_ID;
  const results: Item[] = [];
  if (krogerToken) {
    const kroger = await searchKrogerProducts(
      term,
      latitude,
      longitude,
      radiusMiles,
      krogerToken,
    );
    results.push(...kroger);
  }
  if (hasWalmart) {
    const walmart = await searchWalmartProducts(
      term,
      latitude,
      longitude,
      radiusMiles,
    );
    results.push(...walmart);
  }
  return results;
}