const Conversation = require('../../models/general/conversation.model');
const conversationSvc = require('../../services/general/conversation.service')

// module.exports.findConversations = async (req, res, next) => {
//     const {firstId, secondId} = req.params
//     try {
//         const result = await conversationSvc.getAllConversations({firstId, secondId})
//         res.status(200).json({
//             isSuccess: true,
//             data: result,
//             error: null,
//         });
//     }
//     catch(error) {
//         next(error)
//     }
// }

module.exports.findUserConversation = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const result = await conversationSvc.getUserConversation(userId)
        //console.log("User Conversations:", result);
        res.status(200).json({
            isSuccess: true,
            data: result,
            error: null,
        });
    }
    catch(error) {
        next(error)
    }
}

module.exports.createConversation = async (req, res, next) => {
    try {
        const {memberIds, type, name, avatar} = req.body
        const result = await conversationSvc.createConversation({memberIds, type,
             name, avatar: avatar || null})
        res.status(200).json({
            isSuccess: true,
            data: result,
            error: null,
        });
    }
    catch(error) {
        next(error)
    }
}