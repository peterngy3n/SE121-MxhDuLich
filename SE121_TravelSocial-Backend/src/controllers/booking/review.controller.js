const Review = require('../../models/booking/review.model')
const reviewSvc = require('../../services/booking/review.service')

module.exports.getAllReviews = async (req, res, next) => {
    try {
        const result = await reviewSvc.getAllReviews()
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

module.exports.getReviewById = async (req, res, next) => {
    try {
        const id = req.params.id
        const result = await reviewSvc.getReviewById(id)
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

module.exports.getReviewByLocationId = async (req, res, next) => {
    try {
        const locationId = req.params.locationId
        const result = await reviewSvc.getReviewByLocationId(locationId)
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

module.exports.createReview = async (req, res, next) => {
    try {
        console.log("BODY: ",req.body)
        const {locationId, rating, review, image} = req.body
        // const images = req.files ? req.files.map((file) => ({
        //     url: file.path,
        //     publicId: file.filename,
        // })) : [];
        const reviewData = new Review({
            locationId: locationId,
            senderId: res.locals.user._id,
            rating: rating,
            review: review,
            image: image,
        })
        const result = await reviewSvc.createReview(reviewData)
        res.status(200).json({
            isSuccess: true,
            data: result,
            error: null,
        });
    }
    catch(error) {
        if (req.files) {
            req.files.map(async (file) => {
                try {
                    await cloudinary.uploader.destroy(file.filename);
                    console.log(`Deleted: ${file.filename}`);
                } catch (err) {
                    console.error(`Failed to delete ${file.filename}:`, err.message);
                }
            });
        }
        next(error)
    }
}
module.exports.updateReview = async (req, res, next) => {
    const id = req.params.id
    const {reviewData}  = req.body
    try {
        const result = await reviewSvc.updateReview(id, reviewData)
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
module.exports.deleteReview = async (req, res, next) => {
    try {
        const id = req.params.id
        const result = await reviewSvc.deleteReview(id)
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