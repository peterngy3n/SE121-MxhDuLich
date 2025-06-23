const { default: mongoose } = require("mongoose")
const Room = require("../../models/booking/room.model")
const Service = require("../../models/booking/service.model")
const { getBestPromotionEventDiscount } = require("../../services/general/promotion-calc.util");

class PreviewBookingBuilder {
    constructor() {
        this.booking = {
            userId: null,
            items: [], //roomId, quantity, nights
            services: [], //serviceId, quantity
            totalPrice: 0,
            tax: 0,
            voucherId: null,
            totalPriceAfterPromotion: 0,
            promotionDiscount: 0,
            totalPriceAfterTax: 0,
            amountPaid: 0
        }
    }

    setUserId(userId) {
        this.booking.userId = userId
        return this
    }

    async setRooms(rooms) {
        const roomMap = await Room.find(
            { _id: { $in: rooms.map(r => r.roomId) } },
            { _id: 1, pricePerNight: 1, name: 1, images: { $slice: 1} },
        ).then(data => {
            return new Map(data.map(r => [r._id.toString(), r.pricePerNight, r.name, r.images]));
        });

        this.booking.items = rooms.map(room => {
            const price = roomMap.get(room.roomId)
            const name = roomMap.get(room.name)
            const image = roomMap.get(room.images)
            if (!price) {
                throw new Error(`Room with id ${room.roomId} not found`)
            }
            return {
                roomId: room.roomId,
                price: price,
                quantity: room.quantity || 1,
                nights: room.nights || 1,
                image: image,
                name: name
            }
        })
        return this
    }

    async setServices(services) {
        if(services && services.length > 0) {
            const serviceMap = await Service.find(
                { _id: { $in: services.map(r => r.serviceId) } },
                { _id: 1, price: 1, name: 1 },
            ).then(data => {
                return new Map(data.map(r => [r._id.toString(), r.price, r.name]));
            });
    
            this.booking.services = services.map(service => {
                const price = serviceMap.get(service.serviceId)
                const name = serviceMap.get(service.name)
                if (!price) {
                    throw new Error(`service with id ${service.serviceId} not found`)
                }
                return {
                    serviceId: service.serviceId,
                    price: price,
                    quantity: service.quantity || 1,
                    name: name
                }
            })
        }
        
        return this
    }

    async build() {
        this.booking.totalPrice = caculatePrice(this.booking.items, this.booking.services);
        // Lấy locationId từ phòng đầu tiên
        let locationId = null;
        if (this.booking.items.length > 0) {
            const firstRoom = await Room.findById(this.booking.items[0].roomId);
            if (firstRoom && firstRoom.locationId) {
                locationId = firstRoom.locationId.toString();
            }
        }
        let promotionDiscount = 0;
        if (locationId) {
            // Tìm khuyến mãi tốt nhất cho location này
            const { discount } = await getBestPromotionEventDiscount(locationId, this.booking.totalPrice);
            console.log("Best promotion discount: ", discount);
            promotionDiscount = discount || 0;
        }
        this.booking.promotionDiscount = promotionDiscount;
        this.booking.totalPriceAfterPromotion = this.booking.totalPrice - promotionDiscount;
        this.booking.tax = this.booking.totalPriceAfterPromotion * 0.08;
        this.booking.totalPriceAfterTax = this.booking.totalPriceAfterPromotion + this.booking.tax;
        // if (this.booking.totalPriceAfterPromotion !== this.booking.totalPrice && this.booking.totalPriceAfterPromotion > 0) {
        //     this.booking.totalPrice = this.booking.totalPriceAfterPromotion;
        // }
        if(!this.booking.userId ||
            this.booking.items.length === 0 || !this.booking.totalPrice ||
            !this.booking.tax || !this.booking.totalPriceAfterTax) {
            throw new Error('Missing required fields')
        }
        console.log("Preview booking: ", this.booking);
        return this.booking;
    }
}

const caculatePrice = (items, services) => {
    let totalPrice = 0;
    items.forEach(item => {
        totalPrice += item.price * item.quantity * item.nights;
    });
    services.forEach(service => {
        totalPrice += service.price * service.quantity;
    });
    return totalPrice;
}

module.exports = PreviewBookingBuilder