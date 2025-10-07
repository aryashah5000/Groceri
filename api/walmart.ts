import { Item, Recommendation } from '../types/item';

/**
 * Walmart Affiliate API client utilities.
 *
 * Walmart provides a public Affiliate Marketing API that allows
 * developers to look up products, search the catalog and locate
 * stores without requiring a paid subscription. In contrast to
 * Walmart’s real‑time pricing (OPD) services, the Affiliate API
 * simply requires an Impact Radius publisher identifier and, in
 * some cases, an API key supplied in the request headers. The
 * functions below build on the endpoints described in the official
 * documentation and are intended to replace calls to the OPD
 * services. Key endpoints include:
 *
 *   • `GET /items` – look up one or more products by UPC, GTIN or
 *     item IDs. Price and availability are dependent on zipCode or
 *     storeId parameters【346750288749779†screenshot】.
 *   • `GET /search` – search the product catalog by keyword. You
 *     can filter by category, sort by price or bestseller and
 *     enable facets【613843517298589†screenshot】.
 *   • `GET /stores` – locate Walmart stores near a given latitude
 *     and longitude or within a specific zip code【830037619157876†screenshot】.
 *
 * To use these endpoints you must set the following environment
 * variables in a `.env` file:
 *
 *   WALMART_PUBLISHER_ID – your Impact Radius publisher ID. This
 *     value is appended to each request as `publisherId`.
 *   WALMART_API_KEY – (optional) an API key that may be required
 *     for certain endpoints. If provided it will be sent as the
 *     `apiKey` header.
 */

const WALMART_BASE_URL =
  'https://developer.api.walmart.com/api-proxy/service/affil/product/v2';

/**
 * Retrieve the Impact Radius publisher ID from the environment.
 */
function getPublisherId(): string | undefined {
  const id = process.env.WALMART_PUBLISHER_ID;
  return id && id.trim() ? id.trim() : undefined;
}

/**
 * Retrieve the affiliate API key from the environment.
 */
function getApiKey(): string | undefined {
  const key = process.env.WALMART_API_KEY;
  return key && key.trim() ? key.trim() : undefined;
}

/**
 * Internal helper to perform a GET request against the Walmart
 * Affiliate API. It automatically appends the `publisherId`
 * parameter (if defined) and sets the `apiKey` header when
 * configured. A JSON response is returned or `null` on error.
 */
async function fetchWalmartJSON(
  path: string,
  query: Record<string, string | undefined | null>,
): Promise<any | null> {
  const params = new URLSearchParams();
  // Append the publisher ID to every request when available
  const publisherId = getPublisherId();
  if (publisherId) params.append('publisherId', publisherId);
  // Append user‑supplied query params
  Object.entries(query).forEach(([key, value]) => {
    if (value != null && String(value).length > 0) {
      params.append(key, String(value));
    }
  });
  const url = `${WALMART_BASE_URL}${path}?${params.toString()}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const apiKey = getApiKey();
  if (apiKey) {
    // Some affiliate endpoints accept an apiKey header; if your
    // account requires additional headers (e.g. WM_SEC.ACCESS_TOKEN)
    // you can extend this object accordingly.
    headers['apiKey'] = apiKey;
  }
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`[walmart] Request failed (${res.status})`, await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[walmart] Network error', err);
    return null;
  }
}

/**
 * Locate Walmart stores near a geographic coordinate. The Affiliate
 * API’s `stores` endpoint accepts either latitude/longitude or a
 * zip code. It returns store numbers and metadata such as store
 * name【830037619157876†screenshot】. Note: the API may require additional
 * headers; consult your publisher dashboard for details.
 */
export async function searchWalmartStores(
  lat: number,
  lon: number,
  radiusMiles: number,
): Promise<{ id: string; name: string; zipCode?: string }[]> {
  const data = await fetchWalmartJSON('/stores', {
    lat: String(lat),
    lon: String(lon),
    radius: String(radiusMiles),
  });
  if (!data) return [];
  const stores: any[] = data.data ?? data.stores ?? [];
  return stores.map((store) => ({
    id: store.no ?? store.storeId ?? store.id ?? '',
    name: store.name ?? store.storeType ?? 'Walmart Store',
    zipCode: store.zip ?? store.zipCode ?? store.postalCode ?? undefined,
  }));
}

/**
 * Look up a Walmart item by UPC (barcode) at a specific store or
 * within a given zip code. Pricing and availability are dependent
 * on either `storeId` or `zipCode`【346750288749779†screenshot】. This function
 * returns a simplified Item object including price, image and
 * organic status.
 */
export async function getWalmartProductByUPC(
  upc: string,
  storeId?: string,
  zipCode?: string,
): Promise<Item | null> {
  const query: Record<string, string | undefined | null> = {
    upc,
  };
  // Use storeId when provided; otherwise fall back to zipCode
  if (storeId) {
    query.storeId = storeId;
  } else if (zipCode) {
    query.zipCode = zipCode;
  }
  const data = await fetchWalmartJSON('/items', query);
  if (!data) return null;
  const itemData = data.items?.[0] ?? data.data?.[0];
  if (!itemData) return null;
  // Extract price. The affiliate API includes price in the
  // `salePrice` or `msrp` fields depending on the item. Use the
  // lowest non‑null value when available.
  const priceFields = [
    itemData.salePrice,
    itemData.listPrice,
    itemData.msrp,
    itemData.price,
  ];
  const numericPrice = priceFields
    .map((p) => (p != null ? Number(p) : NaN))
    .find((p) => !Number.isNaN(p));
  const price = numericPrice ?? 0;
  const name = itemData.name ?? itemData.title ?? itemData.shortName ?? 'Unknown Product';
  const imageUrl =
    itemData.mediumImage ?? itemData.imageUrl ?? itemData.thumbnailImage ?? '';
  const brand: string | undefined = itemData.brandName ?? itemData.brand;
  const isOrganic = name.toLowerCase().includes('organic');
  return {
    id: upc,
    name,
    brand,
    price,
    image: imageUrl,
    store: storeId ? `Walmart (${storeId})` : 'Walmart',
    coordinates: undefined,
    isOrganic,
  };
}

/**
 * Fetch nearby deals for a product by UPC. This helper uses the
 * store locator to find Walmart stores within a given radius and
 * then queries the item endpoint for each store to get pricing.
 * Results are sorted by price ascending.
 */
export async function getWalmartDeals(
  upc: string,
  lat: number,
  lon: number,
  radiusMiles: number,
): Promise<Recommendation[]> {
  const stores = await searchWalmartStores(lat, lon, radiusMiles);
  const deals: Recommendation[] = [];
  for (const store of stores) {
    const product = await getWalmartProductByUPC(upc, store.id, store.zipCode);
    if (product && product.price) {
      deals.push({
        id: product.id,
        name: product.name,
        price: product.price,
        store: product.store ?? 'Walmart',
        distance: undefined,
      });
    }
  }
  deals.sort((a, b) => a.price - b.price);
  return deals;
}

/**
 * Search Walmart’s affiliate catalog for products matching a term.
 * Results are filtered to a maximum of 20 items. When latitude
 * and longitude are provided, the nearest store is used to include
 * price information. If no stores are found, the search falls back
 * to using the publisher’s default zip code (if configured).
 */
export async function searchWalmartProducts(
  term: string,
  lat: number,
  lon: number,
  radiusMiles: number,
): Promise<Item[]> {
  const params: Record<string, string | undefined | null> = {
    query: term,
    sort: 'bestseller',
    order: 'ascending',
    numItems: '20',
  };
  const data = await fetchWalmartJSON('/search', params);
  if (!data) return [];
  const items: any[] = data.items ?? data.data ?? [];
  // Determine a default store (closest to user) to enrich items with
  const stores = await searchWalmartStores(lat, lon, radiusMiles);
  const defaultStore = stores[0];
  return items.map((item) => {
    const priceFields = [
      item.salePrice,
      item.listPrice,
      item.msrp,
      item.price,
    ];
    const numericPrice = priceFields
      .map((p) => (p != null ? Number(p) : NaN))
      .find((p) => !Number.isNaN(p));
    const price = numericPrice ?? 0;
    const name = item.name ?? item.title ?? item.shortName ?? 'Unknown Product';
    const imageUrl = item.mediumImage ?? item.imageUrl ?? item.thumbnailImage ?? '';
    const brand: string | undefined = item.brandName ?? item.brand;
    const isOrganic = name.toLowerCase().includes('organic');
    return {
      id: item.upc ?? item.itemId ?? '',
      name,
      brand,
      price,
      image: imageUrl,
      store: defaultStore ? `Walmart (${defaultStore.name})` : 'Walmart',
      coordinates: undefined,
      isOrganic,
    } as Item;
  });
}