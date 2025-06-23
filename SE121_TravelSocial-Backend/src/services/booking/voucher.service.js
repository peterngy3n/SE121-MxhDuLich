const Voucher = require('../../models/booking/voucher.model')
const Location = require('../../models/general/location.model')
const Room = require('../../models/booking/room.model')
const VoucherUser = require('../../models/booking/voucher-user.model')
const previewBookingService = require('../../services/booking/preview-booking.service')
const {NotFoundException, ForbiddenError} = require('../../errors/exception')
const { default: mongoose } = require('mongoose')
const { VOUCHER_SOURCE, VOUCHER_USER, DISCOUNT_TYPE, VOUCHER_STATUS } = require('../../enum/voucher.enum')
const promotionEventService = require('./promotion-event.service')

const getAllVouchers = async (skip, limit) => {
    const vouchers = await Voucher.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    
    if(vouchers.length !== 0)
        return vouchers
    else
        throw new NotFoundException('Không tìm thấy voucher nào')
}

const getVoucherById = async (voucherId) => {
    const result = await Voucher.findById(voucherId)
    if(result)
        return result
    else
        throw new NotFoundException('Không tìm thấy voucher')
}
//TODO: Lấy voucher của hệ thống

const getVoucherByLocationId = async (locationId) => {
    const result = await Voucher.find({ locationId: locationId })
    if(result.length !== 0)
        return result
    else
        throw new NotFoundException('Địa điểm này chưa có voucher nào')
}

const getVoucherByCode = async (code) => {
    const result = await Voucher.findOne({ code: code })
    if(result)
        return result
    else
        throw new NotFoundException('Không tìm thấy mã voucher')
}

const createVoucher = async (voucher, userId) => {
    const {
        source, locationId,description, discount, maxDiscount,
        code,startDate,endDate,maxUse,maxUsePerUser,
        minOderValue,productApplied,status
    } = voucher

    // Kiểm tra mã voucher đã tồn tại chưa
    const existingVoucher = await Voucher.find({code: code})
    if(existingVoucher.length !== 0) {
        throw new ForbiddenError('Mã voucher đã tồn tại')
    }
        
    // Kiểm tra xem locationId có tồn tại không
    const locationIdObj = new mongoose.Types.ObjectId(locationId)
    if(source !== VOUCHER_SOURCE.SYSTEM) {
        const location = Location.findById(locationId)
        if(!location)
            throw new NotFoundException('Không tìm thấy địa điểm')

        if(location.ownerId !== userId) 
            throw new ForbiddenError('Bạn không có quyền tạo voucher cho địa điểm này')
    }
    // Kiểm tra xem productApplied có tồn tại không
    if(productApplied && productApplied.length > 0) {
        const products = await Room.find({ _id: { $in: productApplied } })
        if(products.length !== productApplied.length)
            throw new NotFoundException('Một hoặc nhiều sản phẩm không tồn tại')
    }
    const voucherData = new Voucher(voucher)
    const savedVoucher = await voucherData.save()
    if(savedVoucher)
        return savedVoucher
    else
        throw new ForbiddenError('Tạo voucher thất bại')
}

const updateVoucher = async (voucherId, voucherData, session = null) => {
    const result = await Voucher.findByIdAndUpdate(voucherId, voucherData, {new: true, runValidators: true})
    if(result)
        return result
    else
        throw new ForbiddenError('Cập nhật thất bại')
}

const deleteVoucher = async (voucherId) => {
    const result = await Voucher.findByIdAndDelete(voucherId)
    if(result)
        return result
    else
        throw new ForbiddenError('Xóa thất bại')
}

const verifyVoucher = async (code, previewBookingId, userId, session = null) => {
    // Lấy lại preview booking từ redis
    const previewBooking = await previewBookingService.getBookingPreview(userId, previewBookingId)

    console.log("Preview booking: ", previewBooking)

    const totalPrice = previewBooking.totalPrice
    const rooms = previewBooking.items

    const voucher = await Voucher.findOne({ code: code }).session(session)
    if(!voucher)
        throw new NotFoundException('Không tìm thấy mã voucher')
    
    //Kiểm tra trạng thái voucher
    if(voucher.status !== VOUCHER_STATUS.ACTIVE)
        throw new ForbiddenError('Mã voucher không hợp lệ')

    // Kiểm tra thời hạn voucher
    const currentDate = new Date()
    if(currentDate < voucher.startDate || currentDate > voucher.endDate)
        throw new ForbiddenError('Mã voucher không hợp lệ trong thời gian này')
    
    // Kiểm tra đã đạt giới hạn sử dụng chưa
    if(voucher.usesCount >= voucher.maxUse)
        throw new ForbiddenError('Mã voucher đã đạt giới hạn sử dụng')

    // Kiểm tra các sản phẩm hiện tại có trong danh sách áp dụng không
    //TODO: lấy roomids
    if(voucher.productApplied && voucher.productApplied.length > 0) {
        //const isValid = roomIds.every(roomId => voucher.productApplied.includes(roomId))
        const isValid = rooms.every(room => voucher.productApplied.includes(room.roomId.toString()))
        if(!isValid)
            throw new ForbiddenError('Mã voucher không áp dụng cho sản phẩm này')   
    }
    // Check bill có đạt điều kiện sử dụng hay chưa
    // TODO: Lấy totalPrice
    if(voucher.minOderValue && totalPrice < voucher.minOderValue)
        throw new ForbiddenError('Giá trị đơn hàng không đủ điều kiện sử dụng mã voucher này')

    // Check xem user hiện tại có quá số lần sử dụng voucher hay không
    if(voucher.maxUsePerUser && voucher.maxUsePerUser > 0) {
        const voucherUseCount = await VoucherUser.countDocuments({
            userId: userId,
            voucherId: voucher._id,
            status: VOUCHER_USER.USED
        }).session(session)
        if(voucherUseCount >= voucher.maxUsePerUser)
            throw new ForbiddenError('Bạn đã sử dụng mã voucher này quá số lần cho phép')
    }

    //Tính số tiền được giảm
    let discountAmount = 0
    if(voucher.discount.type === DISCOUNT_TYPE.PERCENT) {
        discountAmount = (totalPrice * voucher.discount.amount) / 100
    }
    else if(voucher.discount.type === DISCOUNT_TYPE.DIRECT) {
        discountAmount = voucher.discount.amount
    }
    
    console.log("Max discount: ", voucher.maxDiscount)
    // Kiểm tra xem số tiền giảm có lớn hơn maxDiscount không
    discountAmount = Math.min(discountAmount, voucher.maxDiscount)

    // Always fetch locationId from the first room's roomId
    let locationId = null;
    if (rooms && rooms.length > 0 && rooms[0].roomId) {
        const firstRoom = await Room.findById(rooms[0].roomId);
        if (!firstRoom) throw new NotFoundException('Không tìm thấy phòng');
        locationId = firstRoom.locationId;
    } else {
        throw new NotFoundException('Không tìm thấy phòng để xác định địa điểm');
    }
    // Bổ sung hàm tính khuyến mãi từ event
    async function getBestPromotionEventDiscount(userId, locationId, totalPrice, now = new Date()) {
        const events = await promotionEventService.getPromotionEventsByLocation(locationId, now);
        console.log("User ID: ", userId)
        console.log("Location ID: ", locationId)
        console.log("Events: ", events)
        let bestDiscount = 0;
        let bestEvent = null;
        for (const event of events) {
            // Kiểm tra điều kiện đơn hàng tối thiểu
            if (event.minOrderValue && totalPrice < event.minOrderValue) continue;
            let discount = 0;
            if (event.discount.type === 'PERCENT') {
                discount = (totalPrice * event.discount.amount) / 100;
            } else if (event.discount.type === 'AMOUNT') {
                discount = event.discount.amount;
            }
            if (event.maxDiscount) discount = Math.min(discount, event.maxDiscount);
            if (discount > bestDiscount) {
                bestDiscount = discount;
                bestEvent = event;
            }
        }
        return { bestDiscount, bestEvent };
    }

    const { bestDiscount, bestEvent } = await getBestPromotionEventDiscount(userId, locationId, totalPrice);

    console.log("Best discount from promotion event: ", bestDiscount)
    const voucherDiscountAmount = discountAmount;
    const promotionDiscountAmount = bestDiscount || 0;

    return {
        totalPrice,
        voucherDiscountAmount,
        promotionDiscountAmount,
        totalPriceAfterDiscount: totalPrice - voucherDiscountAmount - promotionDiscountAmount,
        bestPromotionEvent: bestEvent // Optionally return event details for frontend
    }
}

//Hàm này sẽ được gọi trong transaction khi người dùng xác nhận đặt phòng
const applyVoucher = async (userId, voucherId) => {
    // Check số lượng
    // Check ngày hết hạn
}

module.exports = {
    getAllVouchers,
    getVoucherById,
    getVoucherByLocationId,
    getVoucherByCode,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    verifyVoucher
}