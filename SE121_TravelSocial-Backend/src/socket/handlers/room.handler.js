'use strict'

const { NotFoundException } = require("../../errors/exception");
const EVENTS = require("../events");

const listenJoinConversationRoomHandler =  (io, socket) => {
    socket.on(EVENTS.ROOM.JOIN_CONVERSATION, (data) => {
        // Đảm bảo join room thành công
        console.log('Join conv-room::' + socket.id)
        socket.emit(EVENTS.ROOM.JOIN_CONVERSATION, {
            isSuccess: true,
            socket: socket.id,
        })

        const { conversationId } = data

        const roomId = `conv_${conversationId}`
        socket.join(roomId)
        
        io.on(EVENTS.ROOM.LEAVE_CONVERSATION, () => {
            console.log('Leave conv-room::'  + socket.id)
        })
    })
}   

const listenJoinUserRoomHandler =  (io, socket) => {
    socket.on(EVENTS.ROOM.JOIN_USER, () => {
        const userId = socket.userId

        // Đảm bảo join room thành công
        console.log('Join user-room::' + userId)
        socket.emit(EVENTS.ROOM.JOIN_USER, {
            isSuccess: true,
            socket: socket.id,
        })

        const roomId = `user_${userId}`
        socket.join(roomId)

        listenJoinConversationRoomHandler(io, socket)
        
        io.on(EVENTS.ROOM.LEAVE_USER, () => {
            console.log('Leave conv-room::'  + socket.id)
        })
    })
}

const joinUserRoom = (io, data) => {
    const { socketId, userId } = data
    const socket = io.sockets.sockets.get(socketId);

    if (!socket) {
        throw new NotFoundException() 
    }

    const roomId = `user_${userId}`;
    socket.join(roomId);
    return roomId
}

const leaveUserRoom = (io, data) => {
    const { socketId, userId } = data
    const socket = io.sockets.sockets.get(socketId);

    if (!socket) {
        throw new NotFoundException() 
    }

    const roomId = `user_${userId}`;
    socket.leave(roomId);
    return "leave room success"
}

const joinConversationRoom = (io, data) => {
    const { socketId, conversationId } = data
    const socket = io.sockets.sockets.get(socketId);
    console.log('Join conv-room::' + socket)
    if (!socket) {
        throw new NotFoundException() 
    }

    const roomId = `conv_${conversationId}`;
    socket.join(roomId);
    return roomId
}

const leaveConversationRomm = (io, data) => {
    const { socketId, conversationId } = data
    const socket = io.sockets.sockets.get(socketId);

    if (!socket) {
        throw new NotFoundException() 
    }

    const roomId = `conv_${conversationId}`;
    socket.leave(roomId);
    return roomId
}

module.exports = {
    listenJoinUserRoomHandler,
    listenJoinConversationRoomHandler,
    joinUserRoom,
    leaveUserRoom,
    joinConversationRoom,
    leaveConversationRomm
}