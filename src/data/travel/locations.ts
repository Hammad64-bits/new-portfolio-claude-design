export type TravelPhoto = {
  src: string;
  alt: string;
};

export type TravelLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  category: "city" | "motorcycle" | "hike";
  visitDate?: string;
  photos: TravelPhoto[];
  route?: {
    label: string;
    coordinates: [longitude: number, latitude: number][];
    approximate: true;
  };
};

// Coordinates are approximate seed locations, not GPS tracks or verified visits.
export const travelLocations: TravelLocation[] = [
  {
    id: "islamabad",
    name: "Islamabad",
    latitude: 33.6844,
    longitude: 73.0479,
    description: "A starting point for trips north, with the Margalla Hills always close by.",
    category: "city",
    photos: [
      { src: "/images/pics/isl-e11.jpg", alt: "Street scene in Islamabad's E-11 sector" },
      { src: "/images/pics/isl_rain.JPG", alt: "Rain falling in Islamabad" },
    ],
  },
  {
    id: "rawalpindi",
    name: "Rawalpindi",
    latitude: 33.5651,
    longitude: 73.0169,
    description: "A city of busy streets, old bazaars, and the road out toward the north.",
    category: "city",
    photos: [
      { src: "/images/pics/piindi.JPG", alt: "Street in Rawalpindi" },
      { src: "/images/pics/pindi-chowk.JPG", alt: "A chowk in Rawalpindi" },
    ],
  },
  {
    id: "jhelum",
    name: "Jhelum",
    latitude: 32.9345,
    longitude: 73.731,
    description: "A stop along the river corridor between the Potohar plateau and Punjab.",
    category: "motorcycle",
    photos: [],
  },
  {
    id: "bhimber",
    name: "Bhimber",
    latitude: 32.9746,
    longitude: 74.079,
    description: "A quieter stretch of road near the foothills and the edge of Azad Kashmir.",
    category: "motorcycle",
    photos: [
      { src: "/images/pics/bhimber.jpg", alt: "View from Bhimber" },
      { src: "/images/pics/bhimber-city.jpg", alt: "Bhimber city" },
      { src: "/images/pics/bhimber-night.jpg", alt: "Bhimber at night" },
      { src: "/images/pics/bhimber-cig.jpg", alt: "Evening in Bhimber" },
      { src: "/images/pics/bhimber-shooting-star.jpg", alt: "Night sky near Bhimber" },
    ],
    route: {
      label: "Illustrative road corridor · approximate, not GPS-verified",
      coordinates: [[73.0479, 33.6844], [73.0169, 33.5651], [73.731, 32.9345], [74.079, 32.9746]],
      approximate: true,
    },
  },
  {
    id: "kel",
    name: "Kel, AJK",
    latitude: 34.8047,
    longitude: 73.907,
    description: "A mountain settlement in the Neelum Valley, surrounded by steep green slopes.",
    category: "hike",
    photos: [],
  },
  {
    id: "chitta-katha-lake",
    name: "Chitta Katha Lake",
    latitude: 34.8228,
    longitude: 74.5738,
    description: "A high alpine lake in the Shounter Valley. The marker is an approximate map reference.",
    category: "hike",
    photos: [],
  },
];
