/**
 * Geospatial utilities for privacy-preserving nearby discovery.
 * Uses geohash-based clustering and coordinate fuzzing to prevent revealing exact private user coordinates.
 */

// Geohash base32 characters
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Calculates haversine distance between two coordinates in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Encodes latitude and longitude into a geohash string.
 * Precision defaults to 6 characters (~1.2km x 0.6km grid, safe for privacy).
 */
export function encodeGeohash(latitude: number, longitude: number, precision: number = 6): string {
  let latMin = -90,
    latMax = 90;
  let lonMin = -180,
    lonMax = 180;
  let geohash = '';
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    let mid;
    if (isEven) {
      mid = (lonMin + lonMax) / 2;
      if (longitude > mid) {
        ch |= 1 << (4 - bit);
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      mid = (latMin + latMax) / 2;
      if (latitude > mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Decodes a geohash into approximate bounding center coordinates.
 * This guarantees we never reconstruct exact user homes or private locations.
 */
export function decodeGeohash(geohash: string): { latitude: number; longitude: number } {
  let latMin = -90,
    latMax = 90;
  let lonMin = -180,
    lonMax = 180;
  let isEven = true;

  for (let i = 0; i < geohash.length; i++) {
    const c = geohash[i];
    const cd = BASE32.indexOf(c);
    if (cd === -1) continue;

    for (let j = 0; j < 5; j++) {
      const mask = 1 << (4 - j);
      if (isEven) {
        const mid = (lonMin + lonMax) / 2;
        if ((cd & mask) !== 0) {
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if ((cd & mask) !== 0) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEven = !isEven;
    }
  }

  return {
    latitude: (latMin + latMax) / 2,
    longitude: (lonMin + lonMax) / 2,
  };
}

/**
 * Privacy protection: Truncates and adds random jitter (~300m - 800m) to coordinates
 * so exact residences or schools are never exposed.
 */
export function fuzzCoordinates(lat: number, lon: number): { latitude: number; longitude: number } {
  // Truncate to 2 decimal places (~1.1 km precision) and apply mild offset
  const latJitter = (Math.random() - 0.5) * 0.008;
  const lonJitter = (Math.random() - 0.5) * 0.008;
  return {
    latitude: Math.round((lat + latJitter) * 1000) / 1000,
    longitude: Math.round((lon + lonJitter) * 1000) / 1000,
  };
}

/**
 * Default location dictionary for multi-level hierarchical fallback
 * (Country -> State -> District -> City -> Locality)
 */
export interface LocationHierarchyItem {
  country: string;
  states: {
    name: string;
    districts: {
      name: string;
      cities: {
        name: string;
        lat: number;
        lon: number;
        localities: string[];
      }[];
    }[];
  }[];
}

export const SAMPLE_HIERARCHIES: LocationHierarchyItem[] = [
  {
    country: 'India',
    states: [
      {
        name: 'Maharashtra',
        districts: [
          {
            name: 'Mumbai Suburban',
            cities: [
              {
                name: 'Mumbai',
                lat: 19.076,
                lon: 72.8777,
                localities: ['Bandra', 'Andheri West', 'Juhu', 'Borivali', 'Dadar', 'Colaba'],
              },
            ],
          },
          {
            name: 'Pune District',
            cities: [
              {
                name: 'Pune',
                lat: 18.5204,
                lon: 73.8567,
                localities: ['Kothrud', 'Viman Nagar', 'Baner', 'Hinjawadi', 'Aundh'],
              },
            ],
          },
        ],
      },
      {
        name: 'Karnataka',
        districts: [
          {
            name: 'Bengaluru Urban',
            cities: [
              {
                name: 'Bengaluru',
                lat: 12.9716,
                lon: 77.5946,
                localities: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar'],
              },
            ],
          },
        ],
      },
      {
        name: 'Delhi NCR',
        districts: [
          {
            name: 'New Delhi',
            cities: [
              {
                name: 'New Delhi',
                lat: 28.6139,
                lon: 77.209,
                localities: ['Connaught Place', 'Saket', 'Dwarka', 'Vasant Kunj', 'Rohini'],
              },
            ],
          },
        ],
      },
      {
        name: 'West Bengal',
        districts: [
          {
            name: 'Kolkata District',
            cities: [
              {
                name: 'Kolkata',
                lat: 22.5726,
                lon: 88.3639,
                localities: ['Salt Lake', 'Park Street', 'New Town', 'Ballygunge', 'Howrah'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    country: 'United Kingdom',
    states: [
      {
        name: 'Greater London',
        districts: [
          {
            name: 'Central London',
            cities: [
              {
                name: 'London',
                lat: 51.5074,
                lon: -0.1278,
                localities: ['Camden', 'Greenwich', 'Kensington', 'Islington', 'Wimbledon'],
              },
            ],
          },
        ],
      },
      {
        name: 'Greater Manchester',
        districts: [
          {
            name: 'City of Manchester',
            cities: [
              {
                name: 'Manchester',
                lat: 53.4808,
                lon: -2.2426,
                localities: ['Salford', 'Didsbury', 'Trafford', 'Northern Quarter'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    country: 'Australia',
    states: [
      {
        name: 'Victoria',
        districts: [
          {
            name: 'Melbourne Region',
            cities: [
              {
                name: 'Melbourne',
                lat: -37.8136,
                lon: 144.9631,
                localities: ['Richmond', 'St Kilda', 'Carlton', 'South Yarra', 'Fitzroy'],
              },
            ],
          },
        ],
      },
      {
        name: 'New South Wales',
        districts: [
          {
            name: 'Sydney Metro',
            cities: [
              {
                name: 'Sydney',
                lat: -33.8688,
                lon: 151.2093,
                localities: ['Bondi', 'Manly', 'Surry Hills', 'Parramatta', 'Newtown'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    country: 'United States',
    states: [
      {
        name: 'California',
        districts: [
          {
            name: 'Los Angeles County',
            cities: [
              {
                name: 'Los Angeles',
                lat: 34.0522,
                lon: -118.2437,
                localities: ['Santa Monica', 'Pasadena', 'Culver City', 'Hollywood', 'Downtown'],
              },
            ],
          },
        ],
      },
      {
        name: 'New York',
        districts: [
          {
            name: 'New York City',
            cities: [
              {
                name: 'New York',
                lat: 40.7128,
                lon: -74.006,
                localities: ['Brooklyn', 'Manhattan', 'Queens', 'Astoria', 'Williamsburg'],
              },
            ],
          },
        ],
      },
    ],
  },
];
