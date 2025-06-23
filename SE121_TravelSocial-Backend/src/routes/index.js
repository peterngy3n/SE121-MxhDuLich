const express = require('express')
const app = express()
//const {io} = require('../app')
//Booking route


const roomRoute = require('./booking/room.route')
const bookingRoute = require('./booking/booking.route')
const recommendationRoute = require('./booking/recommendation.route')
const invoiceRoute = require('./booking/invoice.route')
const paymentRoute = require('./booking/payment.route')
const serviceRoute = require('./booking/service.route')
const reviewRoute = require('./booking/review.route')
const VNPayRoute = require('./booking/vnpay.route')
const voucherRoute = require('./booking/voucher.route')
const vnpayRoute = require('./booking/vnpay.route')
const promotionEventRoute = require('./booking/promotion-event.route')

//Social route

const postRoute = require('./social/post.route')
const hashTagRoute = require('./social/hashtag.route')
const reactRoute = require('./social/react.route')

//General

const authRoute = require('./general/auth.route')
const locationRoute = require('./general/location.route')
const businessRoute = require('./general/business.route')
const userCollectionRoute = require('./general/user-collection.route')
const uploadImageRoute = require('./general/upload-image.route')
const conversationRoute = require('./general/conversation.route')
const messageRoute = require('./general//message.route')
const executeCronJobRoute = require('./general/execute-cronjob.route')
const commentRoute = require('./social/comment.route')
const reactCommentRoute = require('./social/react-comment.route')
const relationRoute = require('./social/relation.route')
const socketRoute = require('./general/socket.route')
const notificationRoute = require('./general/notification.route')
const emailRoute = require('./general/email.route')
const locationPromotionRoute = require('./general/location-promotion.route')

const router = express.Router();
//const io = app.get('io')

router.use('/', roomRoute)
router.use('/', bookingRoute)
router.use('/', recommendationRoute)
router.use('/', invoiceRoute)
router.use('/', paymentRoute)
router.use('/', serviceRoute)
router.use('/', reviewRoute)
router.use('/', VNPayRoute)
router.use('/', postRoute)
router.use('/', authRoute)
router.use('/', locationRoute)
router.use('/', businessRoute)
router.use('/', userCollectionRoute)
router.use('/', uploadImageRoute)
router.use('/', conversationRoute)
router.use('/', messageRoute)
router.use('/', executeCronJobRoute)
router.use('/', hashTagRoute)
router.use('/', reactRoute)
router.use('/', commentRoute)
router.use('/', reactCommentRoute)
router.use('/', relationRoute)
router.use('/', socketRoute)
router.use('/', voucherRoute)
router.use('/', emailRoute)
router.use('/', vnpayRoute)
router.use('/', notificationRoute)
router.use('/', locationPromotionRoute)
router.use('/', promotionEventRoute)


module.exports = router

