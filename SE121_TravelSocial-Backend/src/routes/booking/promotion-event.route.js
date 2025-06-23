const Router = require('express');
const promotionEventController = require('../../controllers/booking/promotion-event.controller');
const { asyncHandler } = require('../../middleware/asyncFunction');
const router = Router();

// CRUD
router.post('/promotion-event', asyncHandler(promotionEventController.createPromotionEvent));
router.get('/promotion-event', asyncHandler(promotionEventController.getAllPromotionEvents));
router.get('/promotion-event/active', asyncHandler(promotionEventController.getActivePromotionEvents));
router.get('/promotion-event/location/:locationId', asyncHandler(promotionEventController.getPromotionEventsByLocation));
router.get('/promotion-event/special-date', asyncHandler(promotionEventController.getPromotionEventsBySpecialDate));
router.get('/promotion-event/special-time', asyncHandler(promotionEventController.getPromotionEventsBySpecialTime));
router.put('/promotion-event/:id', asyncHandler(promotionEventController.updatePromotionEvent));
router.delete('/promotion-event/:id', asyncHandler(promotionEventController.deletePromotionEvent));

module.exports = router;
