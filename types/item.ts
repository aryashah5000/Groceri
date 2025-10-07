// A marker indicating how good a price is relative to nearby alternatives.
// "DEAL" means the scanned item is the best price, "SO-SO" means the price
// is within a small margin of the best alternative, and "NO DEAL" means
// cheaper options exist nearby.
export type DealTag = 'DEAL' | 'SO-SO' | 'NO DEAL';

/**
 * A recommendation entry returned when evaluating a scanned item. Each
 * recommendation points to another store carrying the same product (or
 * equivalent) along with pricing and distance information. The distance is
 * optional because it may not be available if the user's location isn't
 * provided or if the coordinate data is missing.
 */
export interface Recommendation {
    id: string;
    name: string;
    price: number;
    store: string;
    distance?: number;
}

/**
 * Represents a grocery item in our application. In addition to the core
 * properties such as id, name, price and image, an item can carry extra
 * metadata that enables geolocation-based comparisons. The `store`
 * identifies where the item is sold, `coordinates` are the latitude and
 * longitude of that store, and `isOrganic` flags whether the item is an
 * organic product (used to ensure recommendations match organic status).
 * After a scan and evaluation, a tag and a list of recommendations may be
 * attached to the item as well.
 */
export interface Item {
    id: string;
    /** Human-readable name of the product */
    name: string;
    /** Optional brand name (unused currently) */
    brand?: string;
    /** Price in US dollars */
    price: number;
    /** Photo URL for display */
    image: string;
    /** Name of the store where this product is sold */
    store?: string;
    /** Geographic location of the store */
    coordinates?: { lat: number; lon: number };
    /** Whether this product is certified organic */
    isOrganic?: boolean;
    /** Deal tag computed after scanning */
    tag?: DealTag;
    /** List of alternative deals to present to the user */
    recommendations?: Recommendation[];
}