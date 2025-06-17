'use strict'
const postModel = require("../../models/social/post.model");
const userModel = require("../../models/general/user.model");
const commentModel = require("../../models/social/comment.model");
const reactCommentModel = require("../../models/social/react-comment.model")
const commentRepository = require("../../repository/comment.repository")
const { NotFoundException, BadRequest } = require("../../errors/exception");
const notificationService = require("../general/notification.service");

const create = async (commentData, io = null) => {
    const { content, postId, userId, 
        parentId, mention, images, videos } = commentData;

    const [post, user] = await Promise.all([
        postModel.findById(postId),
        userModel.findById(userId),
    ]);

    if (!post || !user) throw new BadRequest("Post hoặc User không tồn tại");

    const comment = new commentModel({
        content,
        postId,
        userId,
        parentId: parentId || null,
        mention: mention || [],
        images: images || [],
        videos: videos || []
    });

    const savedComment = await comment.save();
    
    // Gửi thông báo cho chủ bài viết nếu người bình luận không phải là chủ bài viết
    await notificationService.createCommentNotification(userId, post.authorId, postId, io);
    
    return savedComment;
};

// 2. Get comments by postId
const getByPostId = async (postId) => {
    const comments = await commentModel.find({ postId })
        .populate('userId', 'userName userAvatar')
        .populate('mention', 'userName')
        .sort({ createdAt: -1 });

    const commentsWithReact = await Promise.all(comments.map(async (comment) => {
        const reactCount = await reactCommentModel.countDocuments({ commentId: comment._id });
        return {
            ...comment.toObject(),
            reactCount
        };
    }));

    return commentsWithReact;
};

// 3. Update comment
const update = async (commentId, updateData) => {
    const comment = await commentModel.findByIdAndUpdate(commentId, 
        updateData, {new: true, runValidators: true})
    if(!comment)
        throw new NotFoundException()
    return comment;
};

const remove = async (commentId, userId) => {
    const comment = await commentModel.findByIdAndDelete(commentId)
    if (!comment) 
        throw new NotFoundException()
};

module.exports = {
    create,
    getByPostId,
    update,
    remove,
};