'use strict';

const EVENTS = require("../events");
const messageService = require('../../services/general/message.service');
const Conversation = require("../../models/general/conversation.model");
const { NotFoundException } = require("../../errors/exception");


// Emit: { userId, conversationId, message }
// user connected vào socket => socket.id
const emitUserListHandler = async (messageData, io) => {
    const { senderId, message, conversationId, images, videos } = messageData;
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
        throw new NotFoundException();
    }
    console.log("Conversation members:", conversation.member);
    const memberIds = conversation.member.map(member => member._id.toString());

    memberIds.forEach(memberId => {
        if(memberId !== senderId) {
            const roomId = `user_${memberId}`;
            io.to(roomId).emit(EVENTS.CHAT.NEW_MESSAGE, {
                from: senderId,
                message: message,
                conversationId: conversationId,
                images: images,
                videos: videos
            });
        }
    })
    
}

const emitMessageToUserRoomHandler = async (messageData, io) => {
    const { senderId, message, conversationId, images, videos } = messageData;
    //console.log(`Tin nhắn riêng từ ${socket.id} đến ${targetId}: ${message}`);
    const roomId = `user_${senderId}`;

    io.to(roomId).emit(EVENTS.CHAT.PRIVATE_MESSAGE, {
        from: senderId,
        message: message,
        conversationId: conversationId,
        images: images,
        videos: videos
    })
}

const emitMessageToConversationRoomHandler = async (messageData, io) => {
    const { senderId, message, conversationId, images, videos } = messageData;
    //console.log(`Tin nhắn riêng từ ${socket.id} đến ${targetId}: ${message}`);
    const roomId = `conv_${conversationId}`;

    io.to(roomId).emit(EVENTS.CHAT.PRIVATE_MESSAGE, {
        from: senderId,
        message: message,
        conversationId: conversationId,
        images: images,
        videos: videos
    })
}

const listenPrivateChatHandler = (io, socket, connectedUsers) => {
    socket.on(EVENTS.CHAT.PRIVATE_MESSAGE, (data) => {
        const { targetId, message, conversationId, images, videos } = data;
        console.log(`Tin nhắn riêng từ ${socket.id} đến ${targetId}: ${message}`);
        
        // Logic lưu tin nhắn xuống database
        messageService.createMessage({conversationId, senderId, message, images, videos})
        
        // Kiểm tra nếu user đích tồn tại
        if (connectedUsers[targetId]) {
            // Gửi tin nhắn đến user đích
            connectedUsers[targetId].emit(EVENTS.CHAT.PRIVATE_MESSAGE, {
                from: socket.id,
                message: message
            });

            // Phản hồi cho người gửi biết tin nhắn đã được gửi
            socket.emit(EVENTS.CHAT.MESSAGE_SENT, {
                to: targetId,
                message: message,
                status: 'delivered'
            });
        } else {
            // Thông báo nếu user đích không tồn tại
            socket.emit(EVENTS.CHAT.MESSAGE_SENT, {
                to: targetId,
                message: message,
                status: 'failed',
                error: 'User không tồn tại hoặc đã ngắt kết nối'
            });
        }
    });
}

const listenBroadcastChatHandler = (io, socket) => {
    socket.on(EVENTS.CHAT.BROADCAST_MESSAGE, (message) => {
        console.log(`Broadcast từ ${socket.id}: ${message}`);
        
        // Gửi tin nhắn đến tất cả trừ người gửi
        socket.broadcast.emit('broadcast message', {
        from: socket.id,
        message: message
        });
    });
}

const emitChatSentHandler = (io, socket) => {

}

module.exports = {
    emitUserListHandler,
    emitMessageToUserRoomHandler,
    emitMessageToConversationRoomHandler,
    listenPrivateChatHandler,
    listenBroadcastChatHandler,
    emitChatSentHandler
}