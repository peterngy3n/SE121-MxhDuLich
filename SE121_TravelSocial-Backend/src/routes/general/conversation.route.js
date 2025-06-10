const {Router} = require('express')
const authController = require('../../controllers/general/conversation.controller')
const { checkUser } = require('../../middleware/auth.middleware')
const router = Router()

router.get('/conversation/:userId', authController.findUserConversation)
//router.get('/conversation/:firstId/:secondId', authController.findConversations)
router.post('/conversation', checkUser, authController.createConversation)

module.exports = router