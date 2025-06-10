const messageSvc = require('../../services/general/message.service')
const socketChatService = require('../../socket/handlers/chat.handler')
const conversationService = require('../../services/general/conversation.service')
const Conversation = require('../../models/general/conversation.model')
module.exports.ping = async (req, res, next) => {
    // io = req.io
    //messageSvc.sendMessage(req.io)
    req.io.emit('ping', 'ping')
    res.status(200).json({"mess": "success"})
}

module.exports.getMessageByConvId = async (req, res, next) => {
    const conversationId = req.params.conversationId
    try {
        const result = await messageSvc.getMessageByConvId(conversationId)
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

module.exports.createMessage = async (req, res, next) => {
    const {conversationId, message, videos, images,} = req.body
    try {
        const messageData = {
            conversationId,
            senderId: res.locals.user._id,
            message,
            videos,
            images,
        }

        const conversationData = new Conversation({
            lastMessage: message
        })
        // Saved database
        const result = await messageSvc.createMessage(messageData)
        console.log("Message created:", result)
        // Update last message in conversation
        
        await conversationService.updateConversation(conversationId, message )
        console.log("Conversation updated with last message:", conversationData)
        // Emit to all user members room 
        await socketChatService.emitUserListHandler(messageData, req.io)
        console.log("Emitted to user list room:", messageData)
        // Emit to conv room 
        await socketChatService.emitMessageToConversationRoomHandler(messageData, req.io)
        console.log("Emitted to conversation room:", messageData)


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