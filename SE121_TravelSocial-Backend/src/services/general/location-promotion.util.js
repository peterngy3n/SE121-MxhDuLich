const PromotionEvent = require('../../models/booking/promotion-event.model');
const mongoose = require('mongoose');

/**
 * Lấy các promotion event đang áp dụng cho 1 location (theo thời gian hiện tại)
 * @param {string} locationId 
 * @returns {Promise<Array>} Danh sách promotion event
 */
async function getActivePromotionsForLocation(locationId) {
  const now = new Date();
  return PromotionEvent.find({
    isActive: true,
    locationIds: mongoose.Types.ObjectId.isValid(locationId) ? new mongoose.Types.ObjectId(locationId) : locationId,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
}

/**
 * Lấy tất cả promotion event đang áp dụng cho nhiều location (theo thời gian hiện tại)
 * @param {Array<string>} locationIds 
 * @returns {Promise<Array>} Danh sách promotion event
 */
async function getActivePromotionsForLocations(locationIds) {
  // Lọc và chuyển đổi sang ObjectId chỉ những id hợp lệ
  const objectIdArray = locationIds
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));
  console.log('ObjectId Array:', objectIdArray);
  const now = new Date();
  // if (objectIdArray.length === 0) return [];
  return PromotionEvent.find({
    isActive: true,
    locationIds: { $in: objectIdArray },
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
}

module.exports = {
  getActivePromotionsForLocation,
  getActivePromotionsForLocations,
};
