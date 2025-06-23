const Location = require('../../models/general/location.model');
const PromotionEvent = require('../../models/booking/promotion-event.model');

// Lấy danh sách location kèm các promotion event đang áp dụng
module.exports.getLocationsWithPromotionEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy location
    const [locations, total] = await Promise.all([
      Location.find().skip(skip).limit(limit),
      Location.countDocuments()
    ]);

    // Lấy tất cả promotion event đang active
    const now = new Date();
    const activePromotions = await PromotionEvent.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    // Gắn promotion event vào từng location
    const locationsWithPromotions = locations.map(loc => {
      const activePromotionEvents = activePromotions.filter(ev =>
        ev.locationIds.some(id => id.toString() === loc._id.toString())
      );
      return {
        ...loc.toObject(),
        activePromotionEvents
      };
    });

    res.status(200).json({
      isSuccess: true,
      data: {
        data: locationsWithPromotions,
        total,
        page,
        limit
      },
      error: null
    });
  } catch (error) {
    next(error);
  }
};
