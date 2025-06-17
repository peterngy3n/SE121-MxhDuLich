const mongoose = require('mongoose');
const { NotFoundException } = require('../../errors/exception');

/**
 * Tạo thông báo mới và emit socket event nếu có io
 * @param {Object} notificationData - Dữ liệu thông báo
 * @param {Object} [io] - Socket.IO server instance (optional)
 */
const createNotification = async (notificationData, io = null) => {
    try {
        // Kiểm tra xem model đã được định nghĩa chưa
        let Notification;
        try {
            Notification = mongoose.model('Notification');
        } catch (error) {
            // Nếu model chưa được định nghĩa, tạo model mới
            const notificationSchema = new mongoose.Schema({
                type: {
                    type: String,
                    enum: ['LIKE', 'COMMENT', 'FOLLOW', 'FRIEND_REQUEST'],
                    required: true
                },
                sender: {
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: 'User',
                    required: true
                },
                recipient: {
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: 'User',
                    required: true
                },
                read: {
                    type: Boolean,
                    default: false
                },
                postId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Post',
                    required: function() {
                        return this.type === 'LIKE' || this.type === 'COMMENT';
                    }
                },
                status: {
                    type: String,
                    enum: ['pending', 'accepted', 'rejected'],
                    default: 'pending'
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }, { collection: 'Notification' });

            Notification = mongoose.model('Notification', notificationSchema);
        }

        const notification = new Notification(notificationData);
        await notification.save();

        // Emit socket event nếu có io (realtime notification)
        if (io && notificationData.recipient) {
            // Gửi vào room notification riêng biệt (user_notification_{userId})
            const roomId = `user_notification_${notificationData.recipient}`;
            io.to(roomId).emit('new-notification', {
                type: notificationData.type,
                notification: notification.toObject(),
            });
        }
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

/**
 * Lấy tất cả thông báo của một người dùng
 * @param {String} userId - ID của người dùng
 */
const getNotificationsByUserId = async (userId) => {
    try {
        // Kiểm tra xem model đã được định nghĩa chưa
        let Notification;
        try {
            Notification = mongoose.model('Notification');
        } catch (error) {
            console.error('Notification model not defined:', error);
            return [];
        }

        // Lấy thông báo và populate thông tin người gửi
        const notifications = await Notification.find({ recipient: userId })
            .populate('sender', 'userName userEmail userAvatar')
            .populate('postId', 'images') // Nếu có postId, populate ảnh post
            .sort({ createdAt: -1 }) // Sắp xếp mới nhất trước
            .lean();

        // Xử lý dữ liệu để phù hợp với format frontend cần
        const processedNotifications = notifications.map(notification => {
            const result = {
                ...notification,
                // Nếu có post, lấy ảnh đầu tiên làm postImage
                postImage: notification.postId && notification.postId.images && notification.postId.images.length > 0
                    ? notification.postId.images[0].url
                    : null
            };
            
            return result;
        });

        return processedNotifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

/**
 * Đánh dấu thông báo đã đọc
 * @param {String} notificationId - ID của thông báo
 */
const markAsRead = async (notificationId) => {
    try {
        const Notification = mongoose.model('Notification');
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { read: true },
            { new: true }
        );
        
        if (!notification) {
            throw new NotFoundException('Notification not found');
        }
        
        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Cập nhật trạng thái của thông báo kết bạn
 * @param {String} notificationId - ID của thông báo
 * @param {String} status - Trạng thái mới (accepted/rejected)
 */
const updateFriendRequestNotification = async (notificationId, status) => {
    try {
        const Notification = mongoose.model('Notification');
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { status },
            { new: true }
        );
        
        if (!notification) {
            throw new NotFoundException('Notification not found');
        }
        
        return notification;
    } catch (error) {
        console.error('Error updating friend request notification:', error);
        throw error;
    }
};

/**
 * Xóa thông báo
 * @param {String} notificationId - ID của thông báo
 */
const deleteNotification = async (notificationId) => {
    try {
        const Notification = mongoose.model('Notification');
        const notification = await Notification.findByIdAndDelete(notificationId);
        
        if (!notification) {
            throw new NotFoundException('Notification not found');
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

/**
 * Tạo thông báo khi có người gửi lời mời kết bạn
 * @param {String} senderId - ID người gửi lời mời
 * @param {String} recipientId - ID người nhận lời mời
 */
const createFriendRequestNotification = async (senderId, recipientId) => {
    try {
        return await createNotification({
            type: 'FRIEND_REQUEST',
            sender: senderId,
            recipient: recipientId,
            status: 'pending'
        });
    } catch (error) {
        console.error('Error creating friend request notification:', error);
        // Suppress error, notification is not critical
        return null;
    }
};

/**
 * Tạo thông báo khi có người theo dõi bạn
 * @param {String} followerId - ID người theo dõi
 * @param {String} userId - ID người được theo dõi
 */
const createFollowNotification = async (followerId, userId) => {
    try {
        return await createNotification({
            type: 'FOLLOW',
            sender: followerId,
            recipient: userId,
            status: 'accepted' // Follow notifications are always accepted
        });
    } catch (error) {
        console.error('Error creating follow notification:', error);
        // Suppress error, notification is not critical
        return null;
    }
};

/**
 * Tạo thông báo khi có người bình luận vào bài viết
 * @param {String} commenterId - ID người bình luận
 * @param {String} postOwnerId - ID chủ bài viết
 * @param {String} postId - ID bài viết
 * @param {Object} [io] - Socket.IO server instance (optional)
 */
const createCommentNotification = async (commenterId, postOwnerId, postId, io = null) => {
    try {
        // Không tạo thông báo nếu người bình luận chính là chủ bài viết
        if (commenterId.toString() === postOwnerId.toString()) {
            return null;
        }
        return await createNotification({
            type: 'COMMENT',
            sender: commenterId,
            recipient: postOwnerId,
            postId: postId,
            status: 'accepted' // Comment notifications are always accepted
        }, io);
    } catch (error) {
        console.error('Error creating comment notification:', error);
        // Suppress error, notification is not critical
        return null;
    }
};

/**
 * Xóa thông báo kết bạn khi hủy lời mời
 * @param {String} senderId - ID người gửi lời mời
 * @param {String} recipientId - ID người nhận lời mời
 */
const deleteFriendRequestNotification = async (senderId, recipientId) => {
    try {
        const Notification = mongoose.model('Notification');
        const notification = await Notification.findOneAndDelete({
            type: 'FRIEND_REQUEST',
            sender: senderId,
            recipient: recipientId,
            status: 'pending'
        });
        
        return notification;
    } catch (error) {
        console.error('Error deleting friend request notification:', error);
        // Suppress error, notification is not critical
        return null;
    }
};

module.exports = {
    createNotification,
    getNotificationsByUserId,
    markAsRead,
    updateFriendRequestNotification,
    deleteNotification,
    createFriendRequestNotification,
    createFollowNotification,
    createCommentNotification,
    deleteFriendRequestNotification
};