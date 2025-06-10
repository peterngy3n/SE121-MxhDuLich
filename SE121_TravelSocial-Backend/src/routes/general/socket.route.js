const Router = require('express')
const socketController = require('../../controllers/general/socket.controller')
const { checkUser } = require('../../middleware/auth.middleware')
const {asyncHandler} = require('../../middleware/asyncFunction')
const router = new Router()

router.post('/join/user-room', checkUser, asyncHandler(socketController.joinUserRoom))
router.post('/join/conv-room', checkUser, asyncHandler(socketController.joinConversationRoom))
router.post('/leave/user-room', checkUser, asyncHandler(socketController.leaveUserRoom))
router.post('/leave/conv-room', checkUser, asyncHandler(socketController.leaveConversationRoom))

module.exports = router
