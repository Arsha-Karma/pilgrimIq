const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const PilgrimageCenter = require("../models/PilgrimageCenter");

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/pilgrimlq";

const centersData = [
  {
    name: "Ajmer Sharif Dargah",
    religion: "Islam",
    location: { city: "Ajmer", state: "Rajasthan", country: "India", address: "Ajmer Sharif Dargah, Ajmer, Rajasthan 305001", latitude: 26.4561, longitude: 74.6282 },
    description: "Sufi shrine of the revered Sufi saint Moinuddin Chishti located at Ajmer, Rajasthan.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Akshardham Temple",
    religion: "Hinduism",
    location: { city: "New Delhi", state: "Delhi", country: "India", address: "Noida Mor, Pandav Nagar, New Delhi, Delhi 110092", latitude: 28.6127, longitude: 77.2773 },
    description: "Spiritual and cultural campus displaying traditional Hindu and Indian culture, spirituality, and architecture.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Baidyanath Dham",
    religion: "Hinduism",
    location: { city: "Deoghar", state: "Jharkhand", country: "India", address: "Baidyanath Dham Temple, Deoghar, Jharkhand 814112", latitude: 24.4925, longitude: 86.7001 },
    description: "One of the twelve Jyotirlingas, the most sacred abodes of Shiva.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "July to August, October to March", climate: "Moderate", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Banke Bihari Temple",
    religion: "Hinduism",
    location: { city: "Vrindavan", state: "Uttar Pradesh", country: "India", address: "Godowlia, Vrindavan, Mathura, Uttar Pradesh 281121", latitude: 27.5813, longitude: 77.7002 },
    description: "Hindu temple dedicated to Lord Krishna in the holy city of Vrindavan.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Basilica of Bom Jesus",
    religion: "Christianity",
    location: { city: "Old Goa", state: "Goa", country: "India", address: "Old Goa Road, Bainguinim, Old Goa, Goa 403402", latitude: 15.5009, longitude: 73.9116 },
    description: "UNESCO World Heritage Site holding the mortal remains of St. Francis Xavier.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "November to February", climate: "Tropical", crowdLevel: "Moderate" },
    isActive: true
  },
  {
    name: "Basilica of Our Lady of Good Health",
    religion: "Christianity",
    location: { city: "Velankanni", state: "Tamil Nadu", country: "India", address: "Velankanni Shrine, Nagapattinam District, Tamil Nadu 611111", latitude: 10.6803, longitude: 79.8497 },
    description: "Catholic Marian shrine and major pilgrimage center in Velankanni.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "August to September, November to February", climate: "Coastal", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Beemapally Masjid",
    religion: "Islam",
    location: { city: "Thiruvananthapuram", state: "Kerala", country: "India", address: "Beemapally, Thiruvananthapuram, Kerala 695008", latitude: 8.4552, longitude: 76.9377 },
    description: "Historic mosque famous for the Chandanakudam festival and shrine of Syedunnisa Beema Beevi.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Coastal", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Bibi Ka Maqbara",
    religion: "Islam",
    location: { city: "Chhatrapati Sambhajinagar", state: "Maharashtra", country: "India", address: "Begumpura, Chhatrapati Sambhajinagar, Maharashtra 431004", latitude: 19.9014, longitude: 75.3203 },
    description: "Famous mausoleum commissioned by Aurangzeb in 1660 in memory of his wife Dilras Banu Begum.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "Moderate" },
    isActive: true
  },
  {
    name: "Chhatarpur Temple",
    religion: "Hinduism",
    location: { city: "New Delhi", state: "Delhi", country: "India", address: "Main Chhatarpur Rd, Chhatarpur, New Delhi, Delhi 110074", latitude: 28.5028, longitude: 77.1812 },
    description: "Temple complex dedicated to Goddess Katyayani, one of the largest temple complexes in India.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Dhamma Chakra Stupa",
    religion: "Buddhism",
    location: { city: "Nagpur", state: "Maharashtra", country: "India", address: "Deekshabhoomi, Nagpur, Maharashtra 440010", latitude: 21.1278, longitude: 79.0669 },
    description: "Sacred monument of Navayana Buddhism where Dr. B.R. Ambedkar embraced Buddhism.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Dilwara Jain Temples",
    religion: "Jainism",
    location: { city: "Mount Abu", state: "Rajasthan", country: "India", address: "Dilwara, Mount Abu, Rajasthan 307501", latitude: 24.6033, longitude: 72.7225 },
    description: "World-famous Svetambara Jain temples known for stunning marble carvings.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "November to March", climate: "Cool Hill", crowdLevel: "Moderate" },
    isActive: true
  },
  {
    name: "Dwarkadhish Temple",
    religion: "Hinduism",
    location: { city: "Dwarka", state: "Gujarat", country: "India", address: "Dwarka, Gujarat 361335", latitude: 22.2376, longitude: 68.9674 },
    description: "Char Dham pilgrimage site dedicated to Lord Krishna as Dwarkadhish.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Coastal", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Golden Temple",
    religion: "Sikhism",
    location: { city: "Amritsar", state: "Punjab", country: "India", address: "Golden Temple Rd, Amritsar, Punjab 143006", latitude: 31.6200, longitude: 74.8765 },
    description: "Sri Harmandir Sahib, the spiritual center of Sikhism and home to Guru Granth Sahib.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Guruvayoor Sree Krishna Temple",
    religion: "Hinduism",
    location: { city: "Guruvayur", state: "Kerala", country: "India", address: "Guruvayur, Thrissur, Kerala 680101", latitude: 10.5946, longitude: 76.0407 },
    description: "Revered Hindu temple dedicated to Lord Guruvayurappan (Krishna).",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Tropical", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Haji Ali Dargah",
    religion: "Islam",
    location: { city: "Mumbai", state: "Maharashtra", country: "India", address: "Dargah Rd, Haji Ali, Mumbai, Maharashtra 400026", latitude: 18.9827, longitude: 72.8089 },
    description: "Mosque and dargah located on an islet off the coast of Worli in Mumbai.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "November to February", climate: "Coastal", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Hazrat Nizamuddin Dargah",
    religion: "Islam",
    location: { city: "New Delhi", state: "Delhi", country: "India", address: "Boali Gate Rd, Nizamuddin, New Delhi, Delhi 110013", latitude: 28.5908, longitude: 77.2415 },
    description: "World-renowned Sufi shrine of Nizamuddin Auliya in New Delhi.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Hemkund Sahib",
    religion: "Sikhism",
    location: { city: "Chamoli", state: "Uttarakhand", country: "India", address: "Hemkund Sahib Trek, Chamoli, Uttarakhand 246443", latitude: 30.6994, longitude: 79.6175 },
    description: "High altitude Sikh pilgrimage site devoted to Guru Gobind Singh Ji.",
    difficulty: { walking: "High", climbing: "High" },
    visitingInformation: { bestSeason: "June to October", climate: "Cold Alpine", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Jagannath Temple",
    religion: "Hinduism",
    location: { city: "Puri", state: "Odisha", country: "India", address: "Grand Road, Puri, Odisha 752001", latitude: 19.8135, longitude: 85.8312 },
    description: "Char Dham temple sacred to Lord Jagannath, famous for the annual Rath Yatra.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March, June to July (Rath Yatra)", climate: "Coastal", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Kanchipuram Temples",
    religion: "Hinduism",
    location: { city: "Kanchipuram", state: "Tamil Nadu", country: "India", address: "Kanchipuram Town, Tamil Nadu 631501", latitude: 12.8342, longitude: 79.7036 },
    description: "Historic City of Temples featuring Kamakshi Amman, Ekambareswarar, and Varadharaja Perumal temples.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Kashi Vishwanath Temple",
    religion: "Hinduism",
    location: { city: "Varanasi", state: "Uttar Pradesh", country: "India", address: "Lahori Tola, Varanasi, Uttar Pradesh 221001", latitude: 25.3109, longitude: 83.0107 },
    description: "One of the most famous Jyotirlinga Hindu temples located on the western bank of holy Ganga.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Kedarnath Temple",
    religion: "Hinduism",
    location: { city: "Kedarnath", state: "Uttarakhand", country: "India", address: "Kedarnath Dham, Rudraprayag, Uttarakhand 246445", latitude: 30.7346, longitude: 79.0669 },
    description: "Revered Chota Char Dham Jyotirlinga temple situated high in the Garhwal Himalayas.",
    difficulty: { walking: "High", climbing: "High" },
    visitingInformation: { bestSeason: "May to June, September to October", climate: "Cold Alpine", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Mahabodhi Temple",
    religion: "Buddhism",
    location: { city: "Bodh Gaya", state: "Bihar", country: "India", address: "Bodh Gaya, Gaya, Bihar 824231", latitude: 24.6960, longitude: 84.9914 },
    description: "UNESCO World Heritage site marking the spot where Lord Buddha attained enlightenment.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "November to February", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Mahakaleshwar Temple",
    religion: "Hinduism",
    location: { city: "Ujjain", state: "Madhya Pradesh", country: "India", address: "Jaisinghpura, Ujjain, Madhya Pradesh 456006", latitude: 23.1827, longitude: 75.7682 },
    description: "Sacred Jyotirlinga temple famous for Bhasma Aarti on the banks of Shipra river.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Mahaparinirvana Temple",
    religion: "Buddhism",
    location: { city: "Kushinagar", state: "Uttar Pradesh", country: "India", address: "Kushinagar, Uttar Pradesh 274403", latitude: 26.7397, longitude: 83.8894 },
    description: "Buddhist pilgrimage temple holding the 6-meter reclining Buddha statue.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "November to March", climate: "Moderate", crowdLevel: "Moderate" },
    isActive: true
  },
  {
    name: "Mansa Devi Temple",
    religion: "Hinduism",
    location: { city: "Haridwar", state: "Uttarakhand", country: "India", address: "Bilwa Parvat, Haridwar, Uttarakhand 249401", latitude: 29.9577, longitude: 78.1633 },
    description: "Holy Hindu temple dedicated to Goddess Mansa Devi atop Bilwa Parvat in Haridwar.",
    difficulty: { walking: "Moderate", climbing: "Moderate" },
    visitingInformation: { bestSeason: "October to April", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Meenakshi Amman Temple",
    religion: "Hinduism",
    location: { city: "Madurai", state: "Tamil Nadu", country: "India", address: "Madurai, Tamil Nadu 625001", latitude: 9.9195, longitude: 78.1193 },
    description: "Historic Dravidian temple complex dedicated to Goddess Meenakshi and Lord Sundareswarar.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Warm", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Nagore Dargah",
    religion: "Islam",
    location: { city: "Nagore", state: "Tamil Nadu", country: "India", address: "Nagore, Nagapattinam, Tamil Nadu 611002", latitude: 10.8174, longitude: 79.8436 },
    description: "Historic Sufi shrine of Shahul Hamid in Nagore, Tamil Nadu.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Coastal", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Omkareshwar Temple",
    religion: "Hinduism",
    location: { city: "Khandwa", state: "Madhya Pradesh", country: "India", address: "Mandhata, Omkareshwar, Khandwa, Madhya Pradesh 450554", latitude: 22.2464, longitude: 76.1518 },
    description: "Sacred Jyotirlinga shrine located on Mandhata island in Narmada river.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Palitana Jain Temples",
    religion: "Jainism",
    location: { city: "Palitana", state: "Gujarat", country: "India", address: "Shatrunjaya Hill, Palitana, Bhavnagar, Gujarat 364270", latitude: 21.5036, longitude: 71.8286 },
    description: "Massive complex of over 800 marble-carved Svetambara Jain temples on Shatrunjaya hill.",
    difficulty: { walking: "High", climbing: "High" },
    visitingInformation: { bestSeason: "November to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Prayagraj (Mahakumbh 2025)",
    religion: "Hinduism",
    location: { city: "Prayagraj", state: "Uttar Pradesh", country: "India", address: "Triveni Sangam, Prayagraj, Uttar Pradesh 211005", latitude: 25.4358, longitude: 81.8463 },
    description: "Triveni Sangam confluence of Ganga, Yamuna, and Saraswati rivers, host to the Mahakumbh Mela.",
    difficulty: { walking: "High", climbing: "Low" },
    visitingInformation: { bestSeason: "January to March (Kumbh)", climate: "Cool", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Ram Mandir",
    religion: "Hinduism",
    location: { city: "Ayodhya", state: "Uttar Pradesh", country: "India", address: "Ram Janmabhoomi Path, Ayodhya, Uttar Pradesh 224123", latitude: 26.7956, longitude: 82.1943 },
    description: "Magnificent grand Hindu temple built at Shri Ram Janmabhoomi birthplace of Lord Rama.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Ramanathaswamy Temple",
    religion: "Hinduism",
    location: { city: "Rameswaram", state: "Tamil Nadu", country: "India", address: "Rameswaram, Ramanathapuram, Tamil Nadu 623526", latitude: 9.2881, longitude: 79.3174 },
    description: "Char Dham and Jyotirlinga temple famous for its 22 holy water wells and longest corridor.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to April", climate: "Coastal", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Sabarimala Temple",
    religion: "Hinduism",
    location: { city: "Pathanamthitta", state: "Kerala", country: "India", address: "Sabarimala Sree Dharma Sastha Temple, Pathanamthitta, Kerala 689662", latitude: 9.4344, longitude: 77.0811 },
    description: "Ancient forest hill shrine dedicated to Lord Ayyappa in Periyar Tiger Reserve.",
    difficulty: { walking: "High", climbing: "High" },
    visitingInformation: { bestSeason: "November to January", climate: "Tropical Forest", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Sarnath",
    religion: "Buddhism",
    location: { city: "Varanasi", state: "Uttar Pradesh", country: "India", address: "Sarnath, Varanasi, Uttar Pradesh 221007", latitude: 25.3762, longitude: 83.0227 },
    description: "Sacred site where Lord Buddha gave his first sermon after enlightenment.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "Moderate" },
    isActive: true
  },
  {
    name: "Sheikh Salim Chishti Dargah",
    religion: "Islam",
    location: { city: "Fatehpur Sikri", state: "Uttar Pradesh", country: "India", address: "Fatehpur Sikri, Agra, Uttar Pradesh 283110", latitude: 27.0945, longitude: 77.6680 },
    description: "Mausoleum of Sufi saint Salim Chishti inside Mughal emperor Akbar's palace complex.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "Moderate" },
    isActive: true
  },
  {
    name: "Shirdi Sai Baba Temple",
    religion: "Hinduism",
    location: { city: "Shirdi", state: "Maharashtra", country: "India", address: "Taluka Rahata, Shirdi, Ahmednagar, Maharashtra 423109", latitude: 19.7667, longitude: 74.4764 },
    description: "Spiritual shrine dedicated to revered saint Shirdi Sai Baba.",
    difficulty: { walking: "Moderate", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Shravanabelagola",
    religion: "Jainism",
    location: { city: "Hassan", state: "Karnataka", country: "India", address: "Vindhyagiri Hill, Shravanabelagola, Hassan, Karnataka 573135", latitude: 12.8587, longitude: 76.4862 },
    description: "Historic Jain center famous for the 57-foot monolithic statue of Lord Bahubali Gommateshwara.",
    difficulty: { walking: "Moderate", climbing: "High" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Somnath Temple",
    religion: "Hinduism",
    location: { city: "Veraval", state: "Gujarat", country: "India", address: "Somnath Mandir, Prabhas Patan, Veraval, Gujarat 362268", latitude: 20.8880, longitude: 70.4012 },
    description: "First among the twelve holy Jyotirlinga shrines of Lord Shiva situated on the Arabian Sea coast.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Coastal", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Sree Padmanabhaswamy Temple",
    religion: "Hinduism",
    location: { city: "Thiruvananthapuram", state: "Kerala", country: "India", address: "East Fort, Thiruvananthapuram, Kerala 695023", latitude: 8.4828, longitude: 76.9436 },
    description: "Ancient wealth-renowned temple dedicated to Lord Vishnu in Anantha Sayanam posture.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Coastal", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "St. Andrew's Basilica (Arthunkal Church)",
    religion: "Christianity",
    location: { city: "Arthunkal", state: "Kerala", country: "India", address: "Arthunkal, Cherthala, Alappuzha, Kerala 688530", latitude: 9.6841, longitude: 76.2954 },
    description: "Historic major Christian basilica in Kerala famous for the feast of St. Sebastian.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "November to January", climate: "Coastal", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "TTD, Tirupati",
    religion: "Hinduism",
    location: { city: "Tirupati", state: "Andhra Pradesh", country: "India", address: "Tirumala Hills, Tirupati, Andhra Pradesh 517504", latitude: 13.6833, longitude: 79.3472 },
    description: "Venkateswara Temple at Tirumala, the world's most visited Hindu pilgrimage shrine.",
    difficulty: { walking: "Moderate", climbing: "Moderate" },
    visitingInformation: { bestSeason: "September to March", climate: "Moderate", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Takht Sri Hazur Sahib",
    religion: "Sikhism",
    location: { city: "Nanded", state: "Maharashtra", country: "India", address: "Nanded, Maharashtra 431601", latitude: 19.1528, longitude: 77.3188 },
    description: "One of the five Takhts of Sikhism where Guru Gobind Singh Ji breathed his last.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Takht Sri Keshgarh Sahib",
    religion: "Sikhism",
    location: { city: "Anandpur Sahib", state: "Punjab", country: "India", address: "Anandpur Sahib, Rupnagar, Punjab 140118", latitude: 31.2355, longitude: 76.4988 },
    description: "Historic Sikh Takht where Khalsa Panth was founded by Guru Gobind Singh Ji in 1699.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March (Hola Mohalla)", climate: "Moderate", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Takht Sri Patna Sahib",
    religion: "Sikhism",
    location: { city: "Patna", state: "Bihar", country: "India", address: "Harmandir Gali, Patna Sahib, Patna, Bihar 800008", latitude: 25.6083, longitude: 85.2281 },
    description: "Takht Sri Harmandir Ji, birthplace of the 10th Sikh Guru, Guru Gobind Singh Ji.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Vaishno Devi",
    religion: "Hinduism",
    location: { city: "Katra", state: "Jammu and Kashmir", country: "India", address: "Bhavan, Katra, Reasi, Jammu and Kashmir 182301", latitude: 33.0308, longitude: 74.9490 },
    description: "Holy cave shrine dedicated to Mata Vaishno Devi in Trikuta mountains.",
    difficulty: { walking: "High", climbing: "High" },
    visitingInformation: { bestSeason: "March to October", climate: "Cool Mountain", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Vallarpadam Basilica",
    religion: "Christianity",
    location: { city: "Kochi", state: "Kerala", country: "India", address: "Vallarpadam Island, Ernakulam, Kochi, Kerala 682504", latitude: 9.9881, longitude: 76.2625 },
    description: "National shrine basilica dedicated to Our Lady of Ransom in Kochi.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "September to January", climate: "Coastal", crowdLevel: "High" },
    isActive: true
  },
  {
    name: "Velankanni Shrine",
    religion: "Christianity",
    location: { city: "Velankanni", state: "Tamil Nadu", country: "India", address: "Velankanni, Nagapattinam, Tamil Nadu 611111", latitude: 10.6803, longitude: 79.8497 },
    description: "Sacred Marian pilgrimage center known as the Lourdes of the East.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "August to September, November to February", climate: "Coastal", crowdLevel: "Very High" },
    isActive: true
  },
  {
    name: "Vishnupad Temple",
    religion: "Hinduism",
    location: { city: "Gaya", state: "Bihar", country: "India", address: "Chand Chaura, Gaya, Bihar 824001", latitude: 24.7788, longitude: 85.0076 },
    description: "Ancient temple featuring 40 cm long footprint of Lord Vishnu etched in solid rock.",
    difficulty: { walking: "Low", climbing: "Low" },
    visitingInformation: { bestSeason: "October to March (Pitru Paksha)", climate: "Moderate", crowdLevel: "High" },
    isActive: true
  }
];

async function seedAll48Centers() {
  try {
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Atlas!");

    const religionMap = {
      "Hinduism": "Hindu",
      "Hindu": "Hindu",
      "Christianity": "Christian",
      "Christian": "Christian",
      "Islam": "Muslim",
      "Muslim": "Muslim",
      "Buddhism": "Buddhist",
      "Buddhist": "Buddhist",
      "Jainism": "Jain",
      "Jain": "Jain",
      "Sikhism": "Sikh",
      "Sikh": "Sikh"
    };

    let upsertCount = 0;
    for (const rawData of centersData) {
      const c = JSON.parse(JSON.stringify(rawData));
      c.religion = religionMap[c.religion] || "Other";
      if (!c.location.postalCode) {
        c.location.postalCode = "000000";
      }
      if (!c.timings) {
        c.timings = { openingTime: "05:00 AM", closingTime: "09:00 PM" };
      } else {
        if (!c.timings.openingTime) c.timings.openingTime = "05:00 AM";
        if (!c.timings.closingTime) c.timings.closingTime = "09:00 PM";
      }
      if (!c.visitingInformation) {
        c.visitingInformation = { bestSeason: "October to March", climate: "Moderate", crowdLevel: "Moderate" };
      } else {
        if (!c.visitingInformation.bestSeason) c.visitingInformation.bestSeason = "October to March";
        if (!c.visitingInformation.climate) c.visitingInformation.climate = "Moderate";
      }
      if (!c.difficulty) {
        c.difficulty = { walking: "Moderate", climbing: "Low" };
      } else {
        if (!c.difficulty.walking) c.difficulty.walking = "Moderate";
        if (!c.difficulty.climbing) c.difficulty.climbing = "Low";
      }

      const regex = new RegExp(`^${c.name.trim()}$`, "i");
      let existing = await PilgrimageCenter.findOne({ name: regex });

      if (existing) {
        existing.location = { ...existing.location.toObject(), ...c.location };
        existing.religion = c.religion;
        existing.description = c.description || existing.description;
        existing.difficulty = { ...existing.difficulty.toObject(), ...c.difficulty };
        existing.visitingInformation = { ...existing.visitingInformation.toObject(), ...c.visitingInformation };
        if (!existing.timings || !existing.timings.openingTime) {
          existing.timings = c.timings;
        }
        existing.isActive = true;
        await existing.save();
        console.log(`[UPDATED] ${c.name} (ID: ${existing._id}) - Lat: ${c.location.latitude}, Lon: ${c.location.longitude}`);
      } else {
        const newCenter = await PilgrimageCenter.create(c);
        console.log(`[CREATED] ${c.name} (ID: ${newCenter._id}) - Lat: ${c.location.latitude}, Lon: ${c.location.longitude}`);
      }
      upsertCount++;
    }

    console.log(`\n✅ SUCCESSFULLY PROCESSED ALL ${upsertCount} PILGRIMAGE CENTRES!`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding centres:", err);
    process.exit(1);
  }
}

seedAll48Centers();
