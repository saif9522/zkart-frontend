/** Rough India bounding box — catches swapped or mistyped latitude/longitude. */
export const inIndia = (lat: number, lng: number) => lat >= 6 && lat <= 37.6 && lng >= 68 && lng <= 97.5
