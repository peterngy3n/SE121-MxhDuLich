const Voucher = require('../../models/booking/voucher.model')
const voucherSvc = require('../../services/booking/voucher.service')

module.exports.getAllVouchers = async (req, res, next) => {
    let {page, limit} = req.query
    page = parseInt(page) || 1
    limit = parseInt(limit) || 10
    const skip = (page - 1) * limit

    console.log("Get all vouchers")
    try {
        const vouchers = await voucherSvc.getAllVouchers(skip, limit)
        res.status(200).json({
            isSuccess: true,
            data: vouchers,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports.getVoucherById = async (req, res, next) => {
    console.log("Get voucher by id::", req.params)
    const voucherId = req.params.voucherId
    try {
        const voucher = await voucherSvc.getVoucherById(voucherId)
        res.status(200).json({
            isSuccess: true,
            data: voucher,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports.getVoucherByLocationId = async (req, res, next) => {
    console.log("Get voucher by location id::", req.params)
    const {locationId} = req.params
    try {
        const vouchers = await voucherSvc.getVoucherByLocationId(locationId)
        res.status(200).json({
            isSuccess: true,
            data: vouchers,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports.getVoucherByCode = async (req, res, next) => {
    console.log("Get voucher by code::", req.params)
    const {code} = req.params
    try {
        const voucher = await voucherSvc.getVoucherByCode(code)
        res.status(200).json({
            isSuccess: true,
            data: voucher,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports.createVoucher = async (req, res, next) => {
    console.log("Create voucher::", req.body)
    const userId = res.locals.user_id;
    try {
        const result = await voucherSvc.createVoucher(req.body, userId)
        res.status(201).json({
            isSuccess: true,
            data: result,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports.updateVoucher = async (req, res, next) => {
    const voucherId = req.params.voucherId
    const voucherData = req.body
    try {
        const result = await voucherSvc.updateVoucher(voucherId, voucherData)
        res.status(200).json({
            isSuccess: true,
            data: result,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports.deleteVoucher = async (req, res, next) => {
    const {voucherId} = req.params
    try {
        const result = await voucherSvc.deleteVoucher(voucherId)
        res.status(200).json({
            isSuccess: true,
            data: result,
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports.verifyVoucher = async (req, res, next) => {
    const {code, preview_bookingId } = req.body
    const userId = res.locals.user._id
    console.log(userId)
    try {
        const result = await voucherSvc.verifyVoucher(code, preview_bookingId, userId)
        res.status(200).json({
            isSuccess: true,
            data: {
                totalPrice: result.totalPrice,
                voucherDiscount: result.voucherDiscountAmount,
                promotionDiscount: result.promotionDiscountAmount,
                totalPriceAfterDiscount: result.totalPriceAfterDiscount
            },
            error: null
        })
    }
    catch (error) {
        next(error)
    }
}