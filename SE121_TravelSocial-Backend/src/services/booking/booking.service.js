const Booking = require('../../models/booking/booking.model').Booking
const ServiceBooked = require('../../models/booking/booking.model').ServiceBooked
const Location = require('../../models/general/location.model')
const Service = require('../../models/booking/service.model')
const roomService = require('../../services/booking/room.service')
const voucherService = require('../../services/booking/voucher.service')
const previewBookingService = require('../../services/booking/preview-booking.service')
const voucherUserService = require('../../services/booking/voucher-user.service')
const Room = require('../../models/booking/room.model')
const {NotFoundException, ForbiddenError} = require('../../errors/exception')
const { default: mongoose } = require('mongoose')
const BookingBuilder = require('../../components/builder/booking.builder')
const locationPromotionUtil = require('../general/location-promotion.util')

const updateStatusBooking = async (bookingId, amountPayed) => {
    const booking = await Booking.findById(bookingId);
    if(!booking)
        throw new NotFoundException('Cannot found booking to calculate')
    booking.amountPaid = amountPayed
    // Kiểm tra nếu ngày checkout bằng ngày hiện tại thì cập nhật trạng thái thành finish
    if (booking.checkoutDate) {
        const today = new Date();
        const checkout = new Date(booking.checkoutDate);
        // So sánh ngày/tháng/năm
        if (
            checkout.getFullYear() === today.getFullYear() &&
            checkout.getMonth() === today.getMonth() &&
            checkout.getDate() === today.getDate()
        ) {
            booking.status = 'complete';
        }
    }
    await booking.save()
}

const getAllBooking = async () => {
    const result = await Booking.find().sort({ dateBooking: -1 });
    if(result.length !== 0)
        return result
    else
        throw new NotFoundException('Not found')
    
}
const getBookingById = async (id) => {
    console.log('id: ', id);    
    const result = await Booking.findById(id)
    .populate({
        path: 'items.roomId',
        select: 'name'
    })
    .populate({
        path: 'services.serviceId',
        select: 'name'
    }) 
    if(result)
        return result
    else
        throw new NotFoundException('Not found specific booking')
}

const getBookingByUserId = async (userId) => {
    const result = await Booking.find({userId : userId}).sort({ dateBooking: -1 })
    if(result.length !== 0)
        return result
    else
        throw new NotFoundException('Not found')
}

const getBookingByLocationId = async (locationId) => {
    const result = await Booking.aggregate([
        { $unwind: "$items" },

        {$lookup: {
            from: "Room",
            localField: "items.roomId",
            foreignField: "_id",
            as: "BookedRoom"
        }},

        { $unwind: "$BookedRoom"},
            // Lọc các tài liệu chỉ chứa roomId tương ứng
        { $match: { "BookedRoom.locationId": new mongoose.Types.ObjectId(locationId) } },
        {
            $group: {
                _id: "$_id", // Group theo booking ID
                userId: { $first: "$userId" },
                dateBooking: { $first: "$dateBooking" },
                checkinDate: { $first: "$checkinDate" },
                checkoutDate: { $first: "$checkoutDate" },
                totalPrice: { $first: "$totalPrice" },
                status: { $first: "$status" },
                items: {
                    $push: {
                        roomId: "$items.roomId",
                        quantity: "$items.quantity",
                        roomDetails: {
                            name: "$BookedRoom.name",
                            pricePerNight: "$BookedRoom.pricePerNight",
                        },
                    },
                },
            },
        },
    ]);
    if(result.length !== 0)
        return result
    else
        throw new NotFoundException('Not found')
}

const createBooking = async (bookingData, preview_bookingId) => {
    const { userId, dateBooking, checkinDate, checkoutDate, voucherId } = bookingData;
    const previewBooking = await previewBookingService.getBookingPreview(userId, preview_bookingId)
    // const voucher = await voucherService.getVoucherById(voucherId) // Không cần lấy voucher nếu không có

    console.log('previewBooking: ', previewBooking)

    const booking = new BookingBuilder()
    .setUserId(userId)    
    .setDateBooking(dateBooking)
    .setRooms(previewBooking.items, checkinDate, checkoutDate)
    .setServices(previewBooking.services)
    .setVoucherId(voucherId)
    .setPrice(previewBooking.totalPrice)
    console.log('Booking data before transaction: ', booking.booking);

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        // 1. Kiểm tra & trừ số lượng phòng
        if(await roomService.getRoomAvailable(previewBooking.items, checkinDate, checkoutDate, session) === false) {
            throw new Error('Phòng đã được đặt')
        }
        // 2. Áp dụng voucher và promotion event (cộng dồn, không loại trừ)
        let voucherDiscount = 0;
        let promotionDiscount = 0;
        // Lấy locationId từ phòng đầu tiên
        const firstRoom = previewBooking.items && previewBooking.items[0];
        let locationId = null;
        if (firstRoom && firstRoom.roomId) {
            const room = await Room.findById(firstRoom.roomId);
            if (room && room.locationId) {
                locationId = room.locationId;
                const events = await locationPromotionUtil.getActivePromotionsForLocation(locationId);
                let bestDiscount = 0;
                for (const event of events) {
                    if (event.minOrderValue && previewBooking.totalPrice < event.minOrderValue) continue;
                    let discount = 0;
                    if (event.discount.type === 'PERCENT') {
                        discount = (previewBooking.totalPrice * event.discount.amount) / 100;
                    } else if (event.discount.type === 'AMOUNT') {
                        discount = event.discount.amount;
                    }
                    if (event.maxDiscount) discount = Math.min(discount, event.maxDiscount);
                    if (discount > bestDiscount) {
                        bestDiscount = discount;
                    }
                }
                promotionDiscount = bestDiscount;
                if (promotionDiscount > 0) {
                    console.log('Best promotion discount: ', promotionDiscount);
                }
            }
        }
        if(voucherId) {
            const voucher = await voucherService.getVoucherById(voucherId);
            const {totalPrice, voucherDiscountAmount: vDiscount, promotionDiscountAmount: pDiscount, totalPriceAfterDiscount} 
                = await voucherService.verifyVoucher(voucher.code, preview_bookingId, userId, session)
            booking.setVoucherId(new mongoose.Types.ObjectId(voucherId))
            voucherDiscount = vDiscount;
            promotionDiscount = pDiscount; // Cộng dồn với discount từ promotion event
        }
        // Tổng discount là tổng của voucher và promotion
        const totalDiscount = (voucherDiscount || 0) + (promotionDiscount || 0);
        booking.setDiscount(totalDiscount);
        booking.setTax(0.08)
        console.log('Booking data before build: ', booking.booking);
        // 3. Tạo booking
        booking.build()
        console.log('Booking data: ', booking.booking);
        const bookingDataDoc = new Booking(booking.booking)
        const savedBooking = await bookingDataDoc.save({ session });
        // 4. Update các bên liên quan nếu có voucher
        if (voucherId) {
            await voucherService.updateVoucher(
                voucherId,
                { $inc: { usesCount: 1 } }, // tăng 1 lượt dùng
                session);
            const voucher = await voucherService.getVoucherById(voucherId);
            await voucherUserService.addVoucherUsage(userId, voucher.code, session);
        }
        await session.commitTransaction();
        return savedBooking;
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
}

const updateBooking = async (bookingId, bookingData) => {
    console.log('booking: ', await Booking.findById(bookingId));
    const result = await Booking.findByIdAndUpdate(bookingId, bookingData, {new: true, runValidators: true})
    if(result)
        return result
    else
        throw new NotFoundException('Not allow to update')
}

const addServices = async (bookingId, serviceId) => {
    const booking = await Booking.findById(bookingId)
    if(!booking)
        throw new NotFoundException('Not found booking to add service')
    const service = await Service.findById(serviceId)
    if(!service)
        throw new NotFoundException('Not found service')
    const newService = new ServiceBooked({
        serviceId: service.id,
        price: service.price
    })
    booking.services.push(newService)
    const result = await booking.save()
    if(result)
        return result
    else
        throw new ForbiddenError('Cannot add service')
}

const deleteBooking = async (bookingId) => {
    const result = Booking.findByIdAndDelete(bookingId)
    if(result)
        return result
    else
        throw new NotFoundException('Not allow to delete')
}

const getBookingByBusinessId = async (businessId) => {
    const locations = await Location.find({ ownerId: businessId });
    console.log('locations: ',locations)
    const locationIds = locations.map(location => location._id);
    const rooms = await Room.find({ locationId: { $in: locationIds } });
    console.log('rooms: ', rooms);
    const roomIds = rooms.map(room => room._id);
    console.log('roomId: ',roomIds);
    const bookings = await Booking.find({
        items: {
            $elemMatch: {
                roomId: { $in: roomIds }, 
            },
        },
    });
    return bookings;
};

const calculateTotalWithPromotion = async (rooms, services) => {
    console.log('Rooms:', rooms);
    let totalServicePrice = 0;
    let totalRoomPrice = 0;
    let locationId = null;
    try {
        if (rooms && rooms.length > 0) {
            console.log('Calculating room prices...');
            const roomIds = rooms.map(r => new mongoose.Types.ObjectId(r.roomId));
            const roomData = await Room.find({ _id: { $in: roomIds } }, { _id: 1, pricePerNight: 1, locationId: 1 });
            const roomMap = new Map();
            roomData.forEach(r => roomMap.set(r._id.toString(), { price: r.pricePerNight, locationId: r.locationId }));
            for (const r of rooms) {
                const roomInfo = roomMap.get(r.roomId);
                if (!roomInfo) throw new NotFoundException('Cannot found room');
                totalRoomPrice += roomInfo.price * r.quantity * r.nights;
                if (!locationId) locationId = roomInfo.locationId;
                console.log('Location ID:', roomInfo.locationId);
            }
        }
        if (services && services.length > 0) {
            const serviceIds = services.map(s => new mongoose.Types.ObjectId(s.serviceId));
            const serviceData = await Service.find({ _id: { $in: serviceIds } }, { _id: 1, price: 1 });
            const serviceMap = new Map();
            serviceData.forEach(s => serviceMap.set(s._id.toString(), s.price));
            for (const s of services) {
                const servicePrice = serviceMap.get(s.serviceId);
                if (!servicePrice) throw new NotFoundException('Cannot found service');
                totalServicePrice += servicePrice * s.quantity;
            }
        }
        const total = totalRoomPrice + totalServicePrice;
        // Áp dụng promotion event cho location nếu có
        let promotionDiscount = 0;
        let promotionEvent = null;
        if (locationId) {
            const now = new Date();
            const events = await locationPromotionUtil.getActivePromotionsForLocation(locationId);
            console.log('Promotion events:', events);
            for (const event of events) {
                if (event.minOrderValue && total < event.minOrderValue) continue;
                let discount = 0;
                if (event.discount.type === 'PERCENT') {
                    discount = (total * event.discount.amount) / 100;
                } else if (event.discount.type === 'AMOUNT') {
                    discount = event.discount.amount;
                }
                if (event.maxDiscount) discount = Math.min(discount, event.maxDiscount);
                if (discount > promotionDiscount) {
                    promotionDiscount = discount;
                    promotionEvent = event;
                }
            }
        }
        return { total, promotionDiscount, totalAfterPromotion: total - promotionDiscount, promotionEvent };
    } catch (err) {
        throw err;
    }
}

// Sửa lại hàm calculateTotalEstimatedPrice để áp dụng promotion event
const calculateTotalEstimatedPrice = async (rooms, services) => {
    const { total, promotionDiscount, totalAfterPromotion, promotionEvent } = await calculateTotalWithPromotion(rooms, services);
    return {
        totalRoomAndService: total,
        promotionDiscount,
        totalAfterPromotion,
        promotionEvent,
    };
}

const getRevenueByMonth = async (month, year) => {
    const startDate = new Date(year, month - 1, 1); // Ngày đầu tiên của tháng
    const endDate = new Date(year, month, 1); // Ngày đầu tiên của tháng tiếp theo

    const result = await Booking.aggregate([
        {
            $match: {
                dateBooking: {
                    $gte: startDate,
                    $lt: endDate,
                },
            },
        },
        {
            $group: {
                _id: null, 
                totalRevenue: { $sum: "$totalPriceAfterTax" }, 
                totalBookings: { $sum: 1 }, 
            },
        },
    ]);

    if (result.length > 0) {
        return {
            totalRevenue: result[0].totalRevenue,
            totalBookings: result[0].totalBookings,
        };
    } else {
        return {
            totalRevenue: 0,
            totalBookings: 0,
        };
    }
};

const getBookingRevenueByMonthForBusiness = async (businessId, month, year) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('business ID: ', businessId);
  
    try {
      // Bước 1: Tìm tất cả các Room thuộc businessId qua Location
      const locations = await Location.find({ ownerId: businessId });
      console.log('Locations:', locations); // Kiểm tra nếu không có location
  
      const locationIds = locations.map(location => location._id);
      console.log('Location IDs:', locationIds);
  
      const rooms = await Room.find({ locationId: { $in: locationIds } });
      console.log('Rooms:', rooms); // Kiểm tra xem có phòng không
  
      const roomIds = rooms.map(room => room._id);
      console.log('Room IDs:', roomIds);
  
      // Bước 2: Tìm tất cả các Booking cho các Room của businessId trong tháng
      const bookings = await Booking.aggregate([
        { 
          $match: {
            dateBooking: {
              $gte: startDate,
              $lt: endDate,
            },
            "items.roomId": { $in: roomIds },
          }
        },
        // {
        //     $unwind: "$items", 
        // },
        // {
        //     $match: {
        //         "items.roomId": { $in: roomIds }, 
        //     },
        // },
        // {
        //     $group: {
        //       _id: "$_id", // Gom nhóm theo bookingId
        //         // totalRevenue: { $sum: "totalPriceAfterTax" }, // Tính tổng revenue cho mỗi booking
        //     },
        // },

        {
          $group: {
            _id: null,  
            totalRevenue: { $sum: "$totalPriceAfterTax" },
            totalBookings: { $sum: 1 },
          }
        }
      ]);

  
      console.log('Bookings Result:', bookings); 
  
      if (bookings.length > 0) {
        return {
          totalRevenue: bookings[0].totalRevenue,
          totalBookings: bookings[0].totalBookings,
        };
      } else {
        return {
          totalRevenue: 0,
          totalBookings: 0,
        };
      }
    } catch (error) {
      console.log('Error:', error);
      throw new Error("Error retrieving revenue data: " + error.message);
    }
};
// API mới: Lấy tất cả booking của business kèm thông tin user, room, location
const getFullBookingByBusinessId = async (businessId) => {
    // Lấy tất cả location thuộc business
    const locations = await Location.find({ ownerId: businessId });
    const locationIds = locations.map(location => location._id);
    // Lấy tất cả room thuộc các location này
    const rooms = await Room.find({ locationId: { $in: locationIds } });
    const roomIds = rooms.map(room => room._id);
    // Lấy tất cả booking liên quan đến các room này
    const bookings = await Booking.find({
        items: {
            $elemMatch: {
                roomId: { $in: roomIds },
            },
        },
    })
    .sort({ dateBooking: -1 }) // Sắp xếp theo ngày đặt
    .populate({
        path: 'userId',
        select: 'userName userAvatar',
    })
    .populate({
        path: 'items.roomId',
        select: 'name locationId',
        populate: {
            path: 'locationId',
            select: 'name image',
        }
    });
    // Định dạng lại dữ liệu cho FE
    const result = bookings.map(booking => {
        const firstRoom = booking.items[0]?.roomId;
        const location = firstRoom?.locationId;
        return {
            _id: booking._id,
            userId: booking.userId?._id,
            userName: booking.userId?.userName,
            userAvatar: booking.userId?.userAvatar,
            locationName: location?.name,
            locationImage: location?.image,
            dateBooking: booking.dateBooking,
            status: booking.status,
            ...booking._doc
        };
    });
    return result;
};
  
module.exports = {
    updateStatusBooking,
    getAllBooking,
    getBookingById,
    getBookingByUserId,
    getBookingByLocationId,
    getBookingByBusinessId,
    createBooking,
    updateBooking,
    addServices,
    deleteBooking,
    calculateTotalEstimatedPrice,
    getRevenueByMonth,
    getBookingRevenueByMonthForBusiness,
    getFullBookingByBusinessId,
}