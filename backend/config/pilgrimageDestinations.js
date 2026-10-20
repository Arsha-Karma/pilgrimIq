/**
 * Pilgrimage Destination Known Coordinates and Mapping Registry
 * Used across Weather, PSI, and Journey Assistant to resolve coordinates for pilgrimage centers.
 */

const PILGRIMAGE_DESTINATION_MAP = [
  {
    name: "Sabarimala",
    keywords: ["sabarimala", "sabrimala", "sabari mala", "pamba", "sannidhanam", "dharma sastha"],
    latitude: 9.4321,
    longitude: 77.0820,
    city: "Pathanamthitta",
    state: "Kerala",
    address: "Sabarimala Sree Dharma Sastha Temple, Periyar Tiger Reserve, Pathanamthitta, Kerala 689662",
    googleMapsUrl: "https://maps.google.com/?q=9.4321,77.0820"
  },
  {
    name: "Velankanni",
    keywords: ["velankanni", "vailankanni", "velkanni", "velakkani", "velankani", "our lady of health", "velanganni", "shrine basilica"],
    latitude: 10.6797,
    longitude: 79.8441,
    city: "Velankanni",
    state: "Tamil Nadu",
    address: "Shrine Basilica of Our Lady of Health, Velankanni, Nagapattinam, Tamil Nadu 611111",
    googleMapsUrl: "https://maps.google.com/?q=10.6797,79.8441"
  },
  {
    name: "Tirupati",
    keywords: ["tirupati", "tirumala", "tirupathi", "venkateswara", "balaji"],
    latitude: 13.6288,
    longitude: 79.4192,
    city: "Tirupati",
    state: "Andhra Pradesh",
    address: "Tirumala Venkateswara Temple, Tirupati, Andhra Pradesh 517504",
    googleMapsUrl: "https://maps.google.com/?q=13.6288,79.4192"
  },
  {
    name: "Kedarnath",
    keywords: ["kedarnath", "kedar"],
    latitude: 30.7346,
    longitude: 79.0669,
    city: "Rudraprayag",
    state: "Uttarakhand",
    address: "Kedarnath Temple, Rudraprayag, Uttarakhand 246445",
    googleMapsUrl: "https://maps.google.com/?q=30.7346,79.0669"
  },
  {
    name: "Badrinath",
    keywords: ["badrinath", "badri"],
    latitude: 30.7433,
    longitude: 79.4938,
    city: "Chamoli",
    state: "Uttarakhand",
    address: "Badrinath Temple, Badrinath, Uttarakhand 246422",
    googleMapsUrl: "https://maps.google.com/?q=30.7433,79.4938"
  },
  {
    name: "Amarnath",
    keywords: ["amarnath", "amarnath cave"],
    latitude: 34.2155,
    longitude: 75.5038,
    city: "Anantnag",
    state: "Jammu and Kashmir",
    address: "Amarnath Cave Temple, Baltal-Pahlgam Route, Jammu and Kashmir 192231",
    googleMapsUrl: "https://maps.google.com/?q=34.2155,75.5038"
  },
  {
    name: "Varanasi",
    keywords: ["varanasi", "kashi", "banaras", "kashi vishwanath"],
    latitude: 25.3176,
    longitude: 82.9739,
    city: "Varanasi",
    state: "Uttar Pradesh",
    address: "Kashi Vishwanath Temple, Lahori Tola, Varanasi, Uttar Pradesh 221001",
    googleMapsUrl: "https://maps.google.com/?q=25.3176,82.9739"
  },
  {
    name: "Haridwar",
    keywords: ["haridwar", "hardwar", "har ki pauri"],
    latitude: 29.9457,
    longitude: 78.1642,
    city: "Haridwar",
    state: "Uttarakhand",
    address: "Har Ki Pauri, Haridwar, Uttarakhand 249401",
    googleMapsUrl: "https://maps.google.com/?q=29.9457,78.1642"
  },
  {
    name: "Golden Temple",
    keywords: ["golden temple", "amritsar", "harmandir sahib"],
    latitude: 31.6200,
    longitude: 74.8765,
    city: "Amritsar",
    state: "Punjab",
    address: "Golden Temple, Golden Temple Road, Amritsar, Punjab 143006",
    googleMapsUrl: "https://maps.google.com/?q=31.6200,74.8765"
  },
  {
    name: "Palani",
    keywords: ["palani", "dhandayuthapani"],
    latitude: 10.4500,
    longitude: 77.5200,
    city: "Palani",
    state: "Tamil Nadu",
    address: "Arulmigu Dhandayuthapani Swamy Temple, Palani, Dindigul, Tamil Nadu 624601",
    googleMapsUrl: "https://maps.google.com/?q=10.4500,77.5200"
  },
  {
    name: "Guruvayur",
    keywords: ["guruvayur", "guruvayoor"],
    latitude: 10.5946,
    longitude: 76.0369,
    city: "Guruvayur",
    state: "Kerala",
    address: "Guruvayur Temple, Guruvayur, Thrissur, Kerala 680101",
    googleMapsUrl: "https://maps.google.com/?q=10.5946,76.0369"
  },
  {
    name: "Madurai",
    keywords: ["madurai", "meenakshi temple", "meenakshi amman"],
    latitude: 9.9195,
    longitude: 78.1193,
    city: "Madurai",
    state: "Tamil Nadu",
    address: "Arulmigu Meenakshi Sundareswarar Temple, Madurai, Tamil Nadu 625001",
    googleMapsUrl: "https://maps.google.com/?q=9.9195,78.1193"
  },
  {
    name: "Rameshwaram",
    keywords: ["rameshwaram", "rameshwar", "ramanathaswamy"],
    latitude: 9.2876,
    longitude: 79.3129,
    city: "Rameshwaram",
    state: "Tamil Nadu",
    address: "Ramanathaswamy Temple, Rameswaram, Tamil Nadu 623526",
    googleMapsUrl: "https://maps.google.com/?q=9.2876,79.3129"
  },
  {
    name: "Puri Jagannath",
    keywords: ["puri", "jagannath", "puri jagannath"],
    latitude: 19.8135,
    longitude: 85.8312,
    city: "Puri",
    state: "Odisha",
    address: "Shree Jagannatha Temple, Puri, Odisha 752001",
    googleMapsUrl: "https://maps.google.com/?q=19.8135,85.8312"
  },
  {
    name: "Shirdi",
    keywords: ["shirdi", "sai baba"],
    latitude: 19.7667,
    longitude: 74.4762,
    city: "Shirdi",
    state: "Maharashtra",
    address: "Shree Saibaba Sansthan Temple, Shirdi, Ahmednagar, Maharashtra 423109",
    googleMapsUrl: "https://maps.google.com/?q=19.7667,74.4762"
  },
  {
    name: "Vaishno Devi",
    keywords: ["vaishno devi", "vaishnodevi", "katra"],
    latitude: 33.0308,
    longitude: 74.9490,
    city: "Katra",
    state: "Jammu and Kashmir",
    address: "Shri Mata Vaishno Devi Katra, Reasi, Jammu and Kashmir 182301",
    googleMapsUrl: "https://maps.google.com/?q=33.0308,74.9490"
  }
];

function findKnownDestination(searchString) {
  if (!searchString || typeof searchString !== "string") return null;
  const lower = searchString.toLowerCase().trim();
  for (const item of PILGRIMAGE_DESTINATION_MAP) {
    if (
      lower.includes(item.name.toLowerCase()) ||
      item.keywords.some((kw) => lower.includes(kw.toLowerCase()))
    ) {
      return item;
    }
  }
  return null;
}

module.exports = {
  PILGRIMAGE_DESTINATION_MAP,
  findKnownDestination,
};
