const mongoose = require('mongoose');
const PromotionEvent = require('../../models/booking/promotion-event.model');

// Tạo sự kiện khuyến mãi mới
async function createPromotionEvent(data) {
  const event = new PromotionEvent(data);
  return await event.save();
}

// Lấy tất cả sự kiện khuyến mãi đang hoạt động
async function getActivePromotionEvents(now = new Date()) {
  return await PromotionEvent.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
}

// Lấy sự kiện khuyến mãi theo location/service
async function getPromotionEventsByLocation(locationId, now = new Date()) {
  let objectId = locationId;
  if (typeof locationId === 'string' && mongoose.Types.ObjectId.isValid(locationId)) {
    objectId = new mongoose.Types.ObjectId(locationId);
  }
  return await PromotionEvent.find({
    isActive: true,
    locationIds: { $in: [objectId] },
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
}

module.exports = {
  createPromotionEvent,
  getActivePromotionEvents,
  getPromotionEventsByLocation,
};
