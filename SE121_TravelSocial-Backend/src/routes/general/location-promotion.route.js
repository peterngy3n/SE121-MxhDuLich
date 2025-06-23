const Router = require('express');
const locationPromotionController = require('../../controllers/general/location-promotion.controller');
const locationPromotionByIdsController = require('../../controllers/general/location-promotion-by-ids.controller');
const { asyncHandler } = require('../../middleware/asyncFunction');
const router = Router();

// API lấy danh sách location kèm promotion event đang áp dụng
router.get('/locations-with-promotion', asyncHandler(locationPromotionController.getLocationsWithPromotionEvents));

// API nhận danh sách locationId, trả về location kèm promotion
router.post('/locations-with-promotion-by-ids', asyncHandler(locationPromotionByIdsController.getLocationsWithPromotionByIds));

module.exports = router;
