// Định nghĩa tất cả các sự kiện Socket.IO trong ứng dụng
const EVENTS = {
    // Sự kiện kết nối
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    
    // Sự kiện chat
    CHAT: {
        PRIVATE_MESSAGE: 'private message',
        BROADCAST_MESSAGE: 'broadcast message',
        MESSAGE_SENT: 'message sent',
        MESSAGE: 'chat message',
        TYPING: 'typing',
        STOP_TYPING: 'stop typing',
        NEW_MESSAGE: 'new message',
    },
    
    // Sự kiện người dùng
    USER: {
        USERLIST: 'user list',
        JOINED: 'user joined',
        LEFT: 'user left',
        STATUS: 'user status',
        USER_CONNECTED: 'user connected'
    },
    
    // Sự kiện phòng chat
    ROOM: {
      JOIN_USER: 'join user room',
      LEAVE_USER: 'leave user room',
      JOIN_CONVERSATION: 'join conversation room',
      LEAVE_CONVERSATION: 'leave conversation room',
    }
  };
  
  module.exports = EVENTS;