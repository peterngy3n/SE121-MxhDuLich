// bookingPreview.service.js
const PreviewBookingBuilder = require('../../components/builder/preview-booking.builder');
const getRedisClient = require('../../databases/init.redis');
const { v4: uuidv4 } = require('uuid');

const PREVIEW_TTL_SECONDS = 10 * 60; // 10 phút

/**
 * Lưu preview vào Redis và trả về previewId
 */
async function createBookingPreview(userId, previewData) {
    const redis = await getRedisClient();
    const { rooms, services } = previewData;
    const builder = new PreviewBookingBuilder();
    await builder.setUserId(userId).setRooms(rooms);
    await builder.setServices(services);
    const preview = await builder.build();

    const previewId = uuidv4();
    const userIdStr = userId.toString();
    const key = `booking_preview:${userIdStr}:${previewId}`;

    console.log('Preview::', preview)
    // Thêm metadata
    const payload = {
        previewId,
        userId,
        ...preview,
        createdAt: Date.now(),
        expiresAt: Date.now() + PREVIEW_TTL_SECONDS * 1000
    };

    console.log('Booking preview payload:', payload);

    // Lưu JSON string với TTL
    const previewSaved = await redis.set(key, JSON.stringify(payload), 'EX', PREVIEW_TTL_SECONDS);
    console.log('Booking preview saved:', previewSaved);

    return previewId;
}

/**
 * Lấy preview từ Redis
 */
async function getBookingPreview(userId, previewId) {
    const redis = await getRedisClient();
    const userIdStr = userId.toString();
    const key = `booking_preview:${userIdStr}:${previewId}`;
    console.log('Getting booking preview with key:', key);
    const raw = await redis.get(key);
    if (!raw) return null;
    const payload = JSON.parse(raw);

    // Bảo mật: đảm bảo đúng user
    if (payload.userId !== userIdStr) return null;
    return payload;
}

module.exports = { createBookingPreview, getBookingPreview };
