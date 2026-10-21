const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const Journey = require('../models/Journey');
const AccommodationBooking = require('../models/AccommodationBooking');
const User = require('../models/User');
const { deleteJourney } = require('../controllers/journeyController');

(async () => {
  await connectDB();
  let user = await User.findOne({ email: 'test_pilgrim_temp@pilgrimiq.com' });
  if (!user) {
    user = await User.create({
      name: 'Temp Pilgrim',
      email: 'test_pilgrim_temp@pilgrimiq.com',
      password: 'HashedPassword123!',
      phoneNumber: '9876543210',
      role: 'user',
    });
  }

  const centerId = new mongoose.Types.ObjectId();
  const journey = await Journey.create({
    userId: user._id,
    pilgrimageCenterId: centerId,
    journeyDate: new Date(Date.now() + 86400000 * 5),
    returnDate: new Date(Date.now() + 86400000 * 7),
    transportMode: 'Car',
    totalPilgrims: 2,
  });

  const booking = await AccommodationBooking.create({
    userId: user._id,
    journeyId: journey._id,
    bookingReference: 'PIQ-ACC-JTEST-01',
    placeId: 'test_jplace_01',
    accommodationName: 'Journey Test Ashram',
    roomType: 'STANDARD_NON_AC',
    roomTitle: 'Standard Room',
    checkInDate: new Date(Date.now() + 86400000 * 5),
    checkOutDate: new Date(Date.now() + 86400000 * 7),
    numberOfNights: 2,
    numberOfRooms: 1,
    leadGuest: { name: 'Temp Pilgrim', phone: '9876543210', email: 'test_pilgrim_temp@pilgrimiq.com' },
    pricing: { pricePerNight: 950, roomSubtotal: 1900, taxAmount: 228, totalAmount: 2128 },
    bookingStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
  });

  // Call deleteJourney
  const req = { user, params: { id: journey._id.toString() } };
  const res = { status: () => ({ json: (data) => console.log('Journey deletion response:', data.message) }) };
  await deleteJourney(req, res, (err) => { if (err) console.error(err); });

  const updatedBooking = await AccommodationBooking.findById(booking._id);
  console.log('✓ Associated Booking Status after journey deletion:', updatedBooking.bookingStatus);
  console.log('✓ Associated Booking Refund Status:', updatedBooking.refundStatus);
  console.log('✓ Associated Booking Refund Amount:', updatedBooking.refundDetails.amount);

  // Clean up
  await AccommodationBooking.deleteOne({ _id: booking._id });
  await User.deleteOne({ _id: user._id });
  console.log('✓ Test cleanup complete.');
  process.exit(0);
})();
