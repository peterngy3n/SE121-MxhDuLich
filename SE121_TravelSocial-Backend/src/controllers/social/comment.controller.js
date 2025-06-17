const { OK, CREATED } = require('../../constants/httpStatusCode');
const commentService = require('../../services/social/comment.service');


module.exports.createComment = async (req, res) => {
    const {content, postId, parentId, mention, images, videos} = req.body;
            
    const userId = res.locals.user._id;
    
    //Embbeding author, location, userTag
    const commentData = {
        content, postId, userId, parentId, 
        mention, images, videos}

    console.log("Comment data::", commentData);

    // Truyền req.io vào service để hỗ trợ realtime notification
    const result = await commentService.create(commentData, req.io);
    res.status(CREATED).json({
        isSuccess: true,
        result,
        error: null
    });
};

module.exports.getCommentsByPost = async (req, res) => {
    const { postId } = req.params;
    const data = await commentService.getByPostId(postId);

    res.status(OK).json({
        isSuccess: true,
        data,
        error: null
    });
};

module.exports.updateComment = async (req, res) => {
    const { commentId } = req.params;
    const updateData = req.body

    const updated = await commentService.update(commentId, updateData);

    res.status(OK).json({
        isSuccess: true,
        data: updated,
        error: null
    });
};

module.exports.deleteComment = async (req, res) => {
    const { commentId } = req.params;

    const result = await commentService.remove(commentId);

    res.status(OK).json({
        isSuccess: true,
        data: "Delete successfully",
        error: null
    });
};