const mongoose = require('mongoose');

const PromotionEventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['TIME_FRAME', 'SPECIAL_DAY'], required: true }, // TIME_FRAME: khung giờ, SPECIAL_DAY: ngày đặc biệt
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timeFrame: {
    startHour: { type: Number }, // 0-23
    endHour: { type: Number },   // 0-23
  },
  specialDates: [{ type: Date }], // Dùng cho SPECIAL_DAY
  discount: {
    amount: { type: Number, required: true },
    type: { type: String, enum: ['PERCENT', 'AMOUNT'], required: true },
  },
  maxDiscount: { type: Number },
  minOrderValue: { type: Number },
  locationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
  serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PromotionEvent', PromotionEventSchema);
