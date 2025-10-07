import { Item, Recommendation } from '../types/item';

/**
 * Kroger API client utilities.
 *
 * Kroger exposes a set of REST APIs that allow access to product
 * information, pricing, store locations and more. To use the API you
 * must first obtain an access token using your client id and client
 * secret. Once authenticated you can search for products by UPC or
 * description, and look up store locations by latitude/longitude.
 *
 * The endpoints used below are derived from the Kroger Products API
 * documentation. In particular, to retrieve pricing you must include
 * a `locationId` filter in product requests【636611525376000†screenshot】. Without a
 * location id the API will return catalog information but omit price
 * and availability. See the Kroger developer portal for details on
 * required scopes and request parameters.
 */

const KROGER_AUTH_URL = 'https://api.kroger.com/v1/connect/oauth2/token';
const KROGER_API_URL = 'https://api.kroger.com/v1';

/**
 * Fetch an OAuth access token from Kroger. The token is valid for a
 * limited period (usually one hour). You must supply your client id
 * and client secret via environment variables. The returned token
 * string should be included in subsequent API requests in the
 * `Authorization` header as `Bearer <token>`.
 */
export async function getKrogerAccessToken(): Promise<string | null> {
  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.warn(
      '[kroger] Missing KROGER_CLIENT_ID or KROGER_CLIENT_SECRET environment variables.',
    );
    return null;
  }
  const credentials = `${clientId}:${clientSecret}`;
  // Encode credentials to base64. Use btoa in environments where Buffer
  // is undefined (e.g. React Native). Fall back to Buffer when available.
  let encoded: string;
  if (typeof btoa === 'function') {
    encoded = btoa(credentials);
  } else {
    // eslint-disable-next-line no-undef
    encoded = Buffer.from(credentials).toString('base64');
  }
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  // Request product scope so we can query the products API. Other
  // scopes (e.g. ``cart.basic``) are available depending on your app.
  body.append('scope', 'product.compact');
  try {
    const res = await fetch(KROGER_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${encoded}`,
      },
      body: body.toString(),
    });
    if (!res.ok) {
      console.warn('[kroger] Failed to obtain access token', await res.text());
      return null;
    }
    const data: any = await res.json();
    return data.access_token as string;
  } catch (err) {
    console.warn('[kroger] Token request error', err);
    return null;
  }
}

/**
 * Search for Kroger store locations near the user. The API accepts
 * latitude/longitude and a radius in miles. It returns a list of
 * location objects which contain a locationId, name and geocoordinates.
 * For more details see the Locations API reference.
 */
export async function searchKrogerLocations(
  lat: number,
  lon: number,
  radiusMiles: number,
  token: string,
): Promise<{
  locationId: string;
  name: string;
  coordinates: { lat: number; lon: number };
}[]> {
  const query = new URLSearchParams();
  // The API expects a latitude, longitude pair separated by comma
  query.append('filter.latLong', `${lat},${lon}`);
  // The distance in miles to search
  query.append('filter.radiusInMiles', radiusMiles.toString());
  // Only return physical store locations
  query.append('filter.locationType', 'STORE');
  const url = `${KROGER_API_URL}/locations?${query.toString()}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn('[kroger] search locations failed', await res.text());
      return [];
    }
    const json: any = await res.json();
    const locations: any[] = json.data ?? [];
    return locations.map((loc) => ({
      locationId: loc.locationId,
      name: loc.address?.name ?? loc.locationId,
      coordinates: {
        lat: loc.geolocation?.latitude ?? 0,
        lon: loc.geolocation?.longitude ?? 0,
      },
    }));
  } catch (err) {
    console.warn('[kroger] search locations error', err);
    return [];
  }
}

/**
 * Look up a single product by UPC at a specific Kroger location. This
 * helper queries the `/products` endpoint with the `filter.upc` and
 * `filter.locationId` parameters. If the product is found it returns
 * an Item containing price, image and store metadata.
 */
export async function getKrogerProductByUPC(
  upc: string,
  locationId: string,
  token: string,
): Promise<Item | null> {
  const query = new URLSearchParams();
  query.append('filter.upc', upc);
  query.append('filter.locationId', locationId);
  query.append('filter.limit', '1');
  const url = `${KROGER_API_URL}/products?${query.toString()}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn('[kroger] product search failed', await res.text());
      return null;
    }
    const json: any = await res.json();
    const item = json.data?.[0];
    if (!item) return null;
    const priceInfo = item.items?.[0]?.price ?? {};
    const images = item.images?.[0]?.sizes ?? [];
    const imageUrl = images.find((s: any) => s.size === 'medium')?.url ?? images[0]?.url ?? '';
    const productName: string = item.description ?? item.description?.consumer ?? 'Unknown Product';
    const brandName: string | undefined = item.brand;
    // Determine if the product is organic by inspecting tags
    const isOrganic =
      item.attributes?.some((attr: string) =>
        attr.toLowerCase().includes('organic'),
      ) ?? false;
    return {
      id: upc,
      name: productName,
      brand: brandName,
      price: Number(priceInfo.promo ?? priceInfo.regular ?? 0),
      image: imageUrl,
      store: item.primaryDepartment ?? 'Kroger',
      isOrganic,
      coordinates: undefined,
    };
  } catch (err) {
    console.warn('[kroger] product lookup error', err);
    return null;
  }
}

/**
 * Get nearby deals for a product by UPC. This helper searches for stores
 * within a radius and fetches product pricing at each store. It returns
 * an array of recommendation objects sorted by price ascending.
 */
export async function getKrogerDeals(
  upc: string,
  lat: number,
  lon: number,
  radiusMiles: number,
  token: string,
): Promise<Recommendation[]> {
  const locations = await searchKrogerLocations(lat, lon, radiusMiles, token);
  const deals: Recommendation[] = [];
  for (const loc of locations) {
    const product = await getKrogerProductByUPC(upc, loc.locationId, token);
    if (product && product.price) {
      deals.push({
        id: product.id,
        name: product.name,
        price: product.price,
        store: `Kroger (${loc.name})`,
        distance: undefined,
      });
    }
  }
  // Sort by price
  deals.sort((a, b) => a.price - b.price);
  return deals;
}

/**
 * Search the Kroger catalog for products matching a term near the
 * supplied coordinates. The API allows fuzzy matching on product
 * descriptions via the `filter.term` parameter. To include price data
 * you must also supply a locationId. This helper finds the closest
 * store, queries the products endpoint and returns up to 20 items.
 */
export async function searchKrogerProducts(
  term: string,
  lat: number,
  lon: number,
  radiusMiles: number,
  token: string,
): Promise<Item[]> {
  const locations = await searchKrogerLocations(lat, lon, radiusMiles, token);
  if (locations.length === 0) return [];
  const locationId = locations[0].locationId;
  const query = new URLSearchParams();
  query.append('filter.term', term);
  query.append('filter.locationId', locationId);
  query.append('filter.limit', '20');
  const url = `${KROGER_API_URL}/products?${query.toString()}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn('[kroger] product search failed', await res.text());
      return [];
    }
    const json: any = await res.json();
    const data: any[] = json.data ?? [];
    return data.map((item) => {
      const priceInfo = item.items?.[0]?.price ?? {};
      const images = item.images?.[0]?.sizes ?? [];
      const imageUrl = images.find((s: any) => s.size === 'medium')?.url ?? images[0]?.url ?? '';
      const productName: string = item.description ?? item.description?.consumer ?? 'Unknown Product';
      const brandName: string | undefined = item.brand;
      const isOrganic =
        item.attributes?.some((attr: string) => attr.toLowerCase().includes('organic')) ?? false;
      return {
        id: item.upc ?? item.productId ?? '',
        name: productName,
        brand: brandName,
        price: Number(priceInfo.promo ?? priceInfo.regular ?? 0),
        image: imageUrl,
        store: locations[0].name,
        coordinates: locations[0].coordinates,
        isOrganic,
      } as Item;
    });
  } catch (err) {
    console.warn('[kroger] product search error', err);
    return [];
  }
}