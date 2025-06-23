const Location = require('../../models/general/location.model');
const { getActivePromotionsForLocations } = require('../../services/general/location-promotion.util');

// POST /locations-with-promotion-by-ids
module.exports.getLocationsWithPromotionByIds = async (req, res, next) => {
  try {
    const { locationIds } = req.body;
    if (!Array.isArray(locationIds) || locationIds.length === 0) {
      return res.status(400).json({ isSuccess: false, error: 'locationIds is required and must be a non-empty array' });
    }
    // Lấy danh sách location theo ids
    const locations = await Location.find({ _id: { $in: locationIds } });
    // Batch lấy promotion cho các location
    const promotions = await getActivePromotionsForLocations(locationIds);
    // Gắn promotion vào từng location
    const locationsWithPromotions = locations.map(loc => {
      const locPromotions = promotions.filter(ev =>
        ev.locationIds.some(id => id.toString() === loc._id.toString())
      );
      return {
        ...loc.toObject(),
        promotions: locPromotions
      };
    });
    res.status(200).json({
      isSuccess: true,
      data: locationsWithPromotions,
      error: null
    });
  } catch (error) {
    next(error);
  }
};
