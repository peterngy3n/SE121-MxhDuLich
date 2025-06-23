require('dotenv').config();
const moment = require('moment');
const qs = require('qs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const {VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat} = require('vnpay');
const { Booking } = require('../../models/booking/booking.model');

const createPayment = async (bookingId, clientIp = null) => {
    //console.log("Key: ", process.env.VNP_TMN_CODE, process.env.VNP_SECRET_KEY);
    const vnpay =  new VNPay({
        tmnCode: "35NVNR07",
        secureSecret: "OTODG22EESNVE8GKX7VV21GKOR8IFCQT",
        vnpayHost: "https://sandbox.vnpayment.vn",
        testMode: true, // Set to false for production
        hashAlgorithm: "SHA512", // Use SHA512 for hashing
        loggerFn: ignoreLogger, // Use ignoreLogger to disable logging
    })

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new Error("Booking not found");
    }

    //console.log("VNPAY Instance Created::", vnpay);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Set expiration date to tomorrow

    const vnpayResponse = await vnpay.buildPaymentUrl({
        vnp_Amount: Math.round(booking.totalPriceAfterTax), // Amount in VND
        vnp_IpAddr: clientIp || "127.0.0.1",
        vnp_TxnRef: `${bookingId}_${Date.now()}`, // Unique transaction reference
        vnp_OrderInfo: `Payment for booking ${bookingId}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: "http://localhost:3000/vnpay_return",
        vnp_Locale: VnpLocale.VN, // Locale for the payment page
        vnp_CreateDate: dateFormat(new Date()),
        vnp_ExpireDate: dateFormat(tomorrow)
    })

    //console.log("VNPAY Payment URL Created::", vnpayResponse);

    return vnpayResponse;
}

const processVnpayReturn = async (vnpayParams) => {
    console.log("Start")
    const vnpay = new VNPay({
        tmnCode: process.env.VNP_TMN_CODE || "35NVNR07",
        secureSecret: process.env.VNP_SECRET_KEY || "OTODG22EESNVE8GKX7VV21GKOR8IFCQT",
        vnpayHost: process.env.VNP_HOST_URL || "https://sandbox.vnpayment.vn",
        testMode: process.env.NODE_ENV !== 'production',
        hashAlgorithm: "SHA512",
        loggerFn: ignoreLogger,
    });

    console.log("Start 2")

    const secureHash = vnpayParams['vnp_SecureHash'];
    //const isValidSignature = vnpay.verifyReturnUrl(secureHash, vnpayParams);

    // if (!isValidSignature) {
    //     return { code: '97', message: 'Invalid Signature' };
    // }

    console.log("Start 3")

    console.log(vnpayParams['vnp_Amount'])

    const bookingIdFromTxnRef = vnpayParams['vnp_TxnRef'].split('_')[0]; // Lấy bookingId từ vnp_TxnRef
    const amountPaid = parseInt(vnpayParams['vnp_Amount']) / 100;
    const responseCode = vnpayParams['vnp_ResponseCode'];
    const transactionNo = vnpayParams['vnp_TransactionNo']; // Mã giao dịch của VNPay
    

    // TODO: Gọi service để tìm Booking, kiểm tra số tiền, kiểm tra trạng thái booking (phải là 'pending')
    // Nếu hợp lệ và responseCode == '00':
    //   - Bắt đầu transaction DB
    //   - Cập nhật Booking status -> 'confirmed'
    //   - Tạo record Payment mới (status: 'completed', bookingId, amountPaid, transactionNo, paymentMethod: 'VNPay')
    //   - Commit transaction DB
    //   - Trả về { code: '00', message: 'Success', bookingId: bookingIdFromTxnRef }
    // Ngược lại:
    //   - (Optional) Cập nhật Booking status -> 'payment_failed'
    //   - Tạo record Payment mới (status: 'failed')
    //   - Trả về { code: responseCode, message: 'Failed', bookingId: bookingIdFromTxnRef }
    
    // Đây là ví dụ, bạn cần hoàn thiện logic này
    if (responseCode === '00') {
         // Giả sử bạn có bookingService và paymentService đã được inject hoặc require
        const BookingModel = require('../../models/booking/booking.model').Booking; // Điều chỉnh đường dẫn nếu cần
        const PaymentModel = require('../../models/booking/payment.model'); // Điều chỉnh đường dẫn nếu cần

        
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const booking = await BookingModel.findById(bookingIdFromTxnRef).session(session);
            console.log(amountPaid, booking.totalPriceAfterTax);
            if (!booking) {
                await session.abortTransaction();
                return { code: '01', message: 'Booking not found', bookingId: bookingIdFromTxnRef };
            }
            if (booking.status !== 'pending') {
                await session.abortTransaction();
                // Nếu đã xử lý rồi thì trả về thành công để VNPay không gửi IPN nữa (nếu là IPN)
                // Hoặc thông báo cho client biết là đã xử lý (nếu là return URL)
                return { code: '02', message: 'Booking already processed', bookingId: bookingIdFromTxnRef };
            }
            
            if (booking.totalPriceAfterTax !== amountPaid) {
                await session.abortTransaction();
                return { code: '04', message: 'Invalid amount 1', bookingId: bookingIdFromTxnRef };
            }

            booking.status = 'paid'; // Hoặc 'paid'
            booking.paymentTransactionId = transactionNo; // Thêm trường này vào Booking model
            await booking.save({ session });

            const payment = new PaymentModel({
                bookingId: bookingIdFromTxnRef,
                amount: amountPaid,
                status: 'completed',
                providerTransactionId: transactionNo, // Mã giao dịch từ VNPay
                paymentMethodId: 'VNPAY', // Hoặc tạo một ID cố định cho VNPay trong PaymentMethod model
            });
            await payment.save({ session });

            await session.commitTransaction();
            return { code: '00', message: 'Success', bookingId: bookingIdFromTxnRef };
        } catch (error) {
            await session.abortTransaction();
            console.error("Error processing VNPAY return:", error);
            return { code: '99', message: 'Internal Server Error', bookingId: bookingIdFromTxnRef };
        } finally {
            session.endSession();
        }
    } else {
        return { code: responseCode, message: 'Payment Failed on Gateway', bookingId: bookingIdFromTxnRef };
    }
};

// (Optional but Recommended) Xử lý IPN
const processVnpayIpn = async (vnpayParams) => {
    // Logic tương tự processVnpayReturn, nhưng không redirect client
    // Sau khi xử lý xong, phải trả về response cho VNPay theo tài liệu của họ
    // Ví dụ: res.status(200).json({ RspCode: '00', Message: 'Confirm Success' })
    const result = await processVnpayReturn(vnpayParams); // Tái sử dụng logic
    if (result.code === '00' || result.code === '02') { // Thành công hoặc đã xử lý
        return { RspCode: '00', Message: 'Confirm Success' };
    } else {
        // Log lỗi chi tiết hơn ở đây
        return { RspCode: result.code, Message: 'Confirm Failed' };
    }
};

module.exports = {
    createPayment,
    processVnpayReturn
};