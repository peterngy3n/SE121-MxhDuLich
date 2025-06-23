const PromotionEvent = require('../../models/booking/promotion-event.model');
const promotionEventService = require('../../services/booking/promotion-event.service');
const { OK, CREATED } = require('../../constants/httpStatusCode');

// Tạo sự kiện khuyến mãi mới
exports.createPromotionEvent = async (req, res, next) => {
  try {
    const event = await promotionEventService.createPromotionEvent(req.body);
    res.status(CREATED).json({ isSuccess: true, data: event, error: null });
  } catch (error) {
    next(error);
  }
};

// Lấy tất cả sự kiện khuyến mãi
exports.getAllPromotionEvents = async (req, res, next) => {
  try {
    const events = await PromotionEvent.find();
    res.status(OK).json({ isSuccess: true, data: events, error: null });
  } catch (error) {
    next(error);
  }
};

// Lấy sự kiện khuyến mãi đang hoạt động
exports.getActivePromotionEvents = async (req, res, next) => {
  try {
    const now = new Date();
    const events = await promotionEventService.getActivePromotionEvents(now);
    res.status(OK).json({ isSuccess: true, data: events, error: null });
  } catch (error) {
    next(error);
  }
};

// Lấy sự kiện khuyến mãi theo location
exports.getPromotionEventsByLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const now = new Date();
    const events = await promotionEventService.getPromotionEventsByLocation(locationId, now);
    res.status(OK).json({ isSuccess: true, data: events, error: null });
  } catch (error) {
    next(error);
  }
};

// Lấy sự kiện khuyến mãi theo ngày đặc biệt
exports.getPromotionEventsBySpecialDate = async (req, res, next) => {
  try {
    const { date } = req.query; // yyyy-mm-dd
    const targetDate = date ? new Date(date) : new Date();
    const events = await PromotionEvent.find({
      isActive: true,
      specialDates: { $elemMatch: { $eq: targetDate.toISOString().slice(0, 10) } },
    });
    res.status(OK).json({ isSuccess: true, data: events, error: null });
  } catch (error) {
    next(error);
  }
};

// Lấy sự kiện khuyến mãi theo khung giờ đặc biệt
exports.getPromotionEventsBySpecialTime = async (req, res, next) => {
  try {
    const { time } = req.query; // HH:mm
    const now = new Date();
    const events = await PromotionEvent.find({
      isActive: true,
      specialTimes: { $elemMatch: { $eq: time } },
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    res.status(OK).json({ isSuccess: true, data: events, error: null });
  } catch (error) {
    next(error);
  }
};

// Cập nhật sự kiện khuyến mãi
exports.updatePromotionEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await PromotionEvent.findByIdAndUpdate(id, req.body, { new: true });
    res.status(OK).json({ isSuccess: true, data: event, error: null });
  } catch (error) {
    next(error);
  }
};

// Xóa sự kiện khuyến mãi
exports.deletePromotionEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    await PromotionEvent.findByIdAndDelete(id);
    res.status(OK).json({ isSuccess: true, data: 'Deleted', error: null });
  } catch (error) {
    next(error);
  }
};
