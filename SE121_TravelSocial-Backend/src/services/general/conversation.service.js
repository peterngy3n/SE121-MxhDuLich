const c = require('config');
const { ForbiddenError, NotFoundException, BadRequest } = require('../../errors/exception');
const Conversation = require('../../models/general/conversation.model');
const { CONV_TYPE } = require('../../enum/chat.enum');
const mongoose = require('mongoose');

// const getAllConversations = async ({firstId, secondId}) => {
//     const result = await Conversation.find({member: {$all: [firstId, secondId]}})
//     if(result.length !== 0) {
//         return result
//     }
//     throw new NotFoundException('Conversation not found')
// }

const getUserConversation = async (userId) => {
    const conversations = await Conversation
    .find({
        member: {$in: [userId]}
    })
    .populate({
        path: 'member',         // populate trường 'member'
        select: 'userName userAvatar'  // chỉ lấy các field cần thiết
    })
    .sort({updatedAt: -1});

    if(!conversations) {throw new NotFoundException()}
    
    const results = conversations.map(conv => {
        let name = conv.name;
        let avatar = null;

        if (conv.type === CONV_TYPE.PRIVATE) {
            // Tìm đối phương trong member list
            const otherUser = conv.member.find(m => m._id.toString() !== userId);
            name = otherUser?.userName || 'Người dùng không tồn tại';
            avatar = otherUser?.avatar || null;
        } else if (conv.type === CONV_TYPE.GROUP) {
            if (!name || name.trim() === '') {
                // Nếu chưa có tên nhóm, tạo từ tên các thành viên
                const memberNames = conv.member.map(u => u.userName);
                name = memberNames.join(', ');
            }
            avatar = conv.avatar
        }

        return {
            _id: conv._id,
            name,
            avatar,
            type: conv.type,
            members: conv.member,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            lastMessage: conv.lastMessage || 'Hãy gửi lời chào đến bạn bè của bạn',
        };
    });

    return results;
}

const createConversation = async (conversationData) => {
    const { memberIds, name, type, avatar} = conversationData;
    
    if (!Array.isArray(memberIds) || memberIds.length < 2) {
        throw new BadRequest();
    }
    console.log(memberIds.length + '\n' + avatar)
    
    if (memberIds.length === 2 && avatar !== null) { throw new BadRequest() }

    // Sắp xếp để đảm bảo thứ tự không ảnh hưởng
    const sortedMemberIds = memberIds.map(id => new mongoose.Types.ObjectId(id)).sort();

    // Tìm conversation đã tồn tại (cùng 2 user)
    const existing = await Conversation.findOne({
        member: sortedMemberIds,
    });

    if (existing) {
        return existing;
    }

    // Nếu chưa tồn tại, tạo mới
    const newConversation = await Conversation.create({
        member: sortedMemberIds,
        name: name || '',
        type: type || CONV_TYPE.PRIVATE,
        avatar: avatar || null,
    });

    return newConversation;
}

const updateConversation = async (conversationId, lastMessage) => {
    // Tìm conversation theo ID
    const result = await Conversation.findById(
        conversationId,
    );

    if (!result) {
        throw new NotFoundException('Conversation not found');
    }

    // Cập nhật trường lastMessage
    result.lastMessage = lastMessage;
    result.updatedAt = new Date();
    await result.save();

    return result;
}

module.exports = {
    //getAllConversations,
    getUserConversation,
    createConversation,
    updateConversation
}