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
    const voucher = await voucherService.getVoucherById(voucherId)

    console.log('previewBooking: ', previewBooking)

    const booking = new BookingBuilder()
    .setUserId(userId)    
    .setDateBooking(dateBooking)
    .setRooms(previewBooking.items, checkinDate, checkoutDate)
    .setServices(previewBooking.services)
    .setVoucherId(voucherId)
    .setPrice(previewBooking.totalPrice)

    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();
        // 1. Kiểm tra & trừ số lượng phòng
        if(await roomService.getRoomAvailable(previewBooking.items, checkinDate, checkoutDate, session) === false) {
            throw new Error('Phòng đã được đặt')
        }
        // 2. Validate lại voucher
        if(voucherId) {
            const {totalPrice, discountAmount, totalPriceAfterDiscount} 
            = await voucherService.verifyVoucher(voucher.code, preview_bookingId, userId, session)
            booking.setVoucherId(new mongoose.Types.ObjectId(voucherId))
            booking.setDiscount(discountAmount)
        }
        console.log('Here: ')
        
        booking.setTax(0.08)

        // 3. Tạo booking

        booking.build()
        
        const bookingData = new Booking(booking.booking)
        const savedBooking = await bookingData.save({ session });

        

        // 4. Update các bên liên quan
        await voucherService.updateVoucher(
            voucherId,
            { $inc: { usesCount: 1 } }, // tăng 1 lượt dùng
            session);
        await voucherUserService.addVoucherUsage(userId, voucher.code, session);

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

const calculateTotalEstimatedPrice = async (rooms, services) => {
    //Lấy thông tin của các phòng từ database
    let totalServicePrice = 0
    let totalRoomPrice = 0
    try {
        console.log('[BookingCalc] Input rooms:', JSON.stringify(rooms));
        console.log('[BookingCalc] Input services:', JSON.stringify(services));
        if (rooms) {
            const roomIds = rooms.map(r => new mongoose.Types.ObjectId(r.roomId))
            const roomData = await Room.find({ _id: { $in: roomIds } }, { _id: 1, pricePerNight: 1})
            //Đưa data vào map để tối ưu thời gian
            const roomMap = new Map()
            roomData.forEach(r => roomMap.set(r._id.toString(), r.pricePerNight))
            //Tính tổng giá các phòng
            for (const r of rooms) {
                const roomPrice = roomMap.get(r.roomId)
                console.log(`[BookingCalc] RoomId: ${r.roomId}, Price: ${roomPrice}, Qty: ${r.quantity}, Nights: ${r.nights}`);
                if(!roomPrice) {
                    console.error(`[BookingCalc] Room not found: ${r.roomId}`);
                    throw new NotFoundException('Cannot found room')
                }
                totalRoomPrice += roomPrice * r.quantity * r.nights
            }
        }
        //Lấy thông tin của các dịch vụ từ database
        if (services) {
            const serviceIds = services.map(s => new mongoose.Types.ObjectId(s.serviceId))
            const serviceData = await Service.find({ _id: { $in: serviceIds } }, { _id: 1, price: 1})
            //Đưa data vào map để tối ưu thời gian
            const serviceMap = new Map()
            serviceData.forEach(s => serviceMap.set(s._id.toString(), s.price))
            //Tính tổng giá các dịch vụ
            for (const s of services) {
                const servicePrice = serviceMap.get(s.serviceId)
                console.log(`[BookingCalc] ServiceId: ${s.serviceId}, Price: ${servicePrice}, Qty: ${s.quantity}`);
                if(!servicePrice) {
                    console.error(`[BookingCalc] Service not found: ${s.serviceId}`);
                    throw new NotFoundException('Cannot found service')
                }
                totalServicePrice += servicePrice * s.quantity
            }
        }
        console.log(`[BookingCalc] totalRoomPrice: ${totalRoomPrice}, totalServicePrice: ${totalServicePrice}`);
        return totalRoomPrice + totalServicePrice
    } catch (err) {
        console.error('[BookingCalc] Error in calculateTotalEstimatedPrice:', err);
        throw err;
    }
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