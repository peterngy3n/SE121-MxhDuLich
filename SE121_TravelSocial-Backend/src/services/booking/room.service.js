const Room = require("../../models/booking/room.model")
const {Booking} = require("../../models/booking/booking.model")
const Location = require('../../models/general/location.model');

const {NotFoundException, ForbiddenError} = require("../../errors/exception")
const { findByIdAndUpdate } = require("../../models/general/business.model")
const { default: mongoose } = require("mongoose")

const getAllRoom = async () => {
    const rooms = await Room.find()
    if(rooms.length !== 0)
        return rooms
    else
        throw new NotFoundException('Khong tim thay phong nao')
}
const getRoomById = async (roomId) => {
    const result = await Room.findById(roomId)
    if(result)
        return result
    else
        throw new NotFoundException('Not found this business')
}

const getRoomByLocationId = async(locationId) => {
    const result = await Room.find({ locationId: locationId });

    if(result.length !== 0)
        return result
    else
        throw new NotFoundException('Dia diem nay chua co phong nao')
}

const getRoomAvailable = async (rooms, checkinDate, checkoutDate, session = null) => {
    // rooms: Danh sách các phòng cần đặt
    // roomData: Thông tin về các phòng cần đặt được lấy lên từ database
    // bookedRoom: Thông tin các phòng được đặt từ checkInDate - checkOutDate

    // Lấy thông tin tổng số lượng phòng từ dtb
    const roomData = await Room.find(
        { _id: { $in: rooms.map(r => new mongoose.Types.ObjectId(r.roomId)) } },
        { _id: 1, quantity: 1 }
    ).then(data => {
        return new Map(data.map(r => [r._id.toString(), r.quantity]))
    })

    // Lấy thông tin các phòng đã được book trong khoảng 
    // thời gian từ checkinDate đến checkoutDate
    const roomIds = rooms.map(r => new mongoose.Types.ObjectId(r.roomId))

    const bookedRooms = await Booking.aggregate([
        {
            $match: {
                roomId: { $in: roomIds },
                status: { $in: ['pending', 'confirmed'] },
                $or: [
                {
                    checkinDate: { $lt: new Date(checkoutDate) },
                    checkoutDate: { $gt: new Date(checkinDate) }
                }
                ]
            }
        },
        {
            $group: {
                _id: '$roomId',
                totalBooked: { $sum: '$quantity' }
            }
        }
      ]).session(session)
      .then(data => { return new Map(data.map(r => [r._id.toString(), r.totalBooked])) });

    // Check: hasOne(rooms).belongTo(bookedRooms) ? 
    // Nếu có thì: totalQuantity - totalBooked >= rooms.quantity ? OK : Room is not available
    // : totalQuantity >= rooms.quantity ? OK : Room is not enough

    for (const room of rooms) {
        const totalQuantity = roomData.get(room.roomId.toString())
        const totalBooked = bookedRooms.get(room.roomId.toString()) || 0
        const remainingQuantity = totalQuantity - totalBooked
        if (remainingQuantity < room.quantity) {
            return false;
        }
    }

    return true;
}

const createRoom = async (roomData) => {
    const savedRoom = await roomData.save();
    if(savedRoom) {
        // Sau khi tạo phòng, cập nhật minPrice cho location
        const locationId = savedRoom.locationId;
        const rooms = await Room.find({ locationId });
        if (rooms && rooms.length > 0) {
            const minPrice = Math.min(...rooms.map(r => r.pricePerNight));
            await Location.findByIdAndUpdate(locationId, { minPrice });
        }
        return savedRoom;
    } else {
        throw new ForbiddenError('Tao phong that bai')
    }
}

const updateRoom = async (roomId, roomData, session = null) => {
    const result = await Room.findByIdAndUpdate(roomId, roomData, {new: true, runValidators: true})
    if(result)
        return result
    else
        throw new ForbiddenError('Cap nhat that bai')
}

const deteleRoom = async (roomId) => {
    const result = await Room.findByIdAndDelete(roomId)
    if(result)
        return result
    else
        throw new ForbiddenError('Xoa that bai')
}

module.exports = {
    getAllRoom,
    getRoomById,
    getRoomByLocationId,
    getRoomAvailable,
    createRoom,
    updateRoom,
    deteleRoom,
}