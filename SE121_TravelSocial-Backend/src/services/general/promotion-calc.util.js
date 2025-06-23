// Utility to calculate best promotion event discount for a location
const { getActivePromotionsForLocation } = require('./location-promotion.util');

/**
 * Get the best promotion event discount for a location and total price
 * @param {string} locationId
 * @param {number} totalPrice
 * @returns {Promise<{discount: number, event: any}>}
 */
async function getBestPromotionEventDiscount(locationId, totalPrice) {
  const events = await getActivePromotionsForLocation(locationId);
  let bestDiscount = 0;
  let bestEvent = null;
  for (const event of events) {
    if (event.minOrderValue && totalPrice < event.minOrderValue) continue;
    let discount = 0;
    if (event.discount.type === 'PERCENT') {
      discount = (totalPrice * event.discount.amount) / 100;
    } else if (event.discount.type === 'AMOUNT') {
      discount = event.discount.amount;
    }
    if (event.maxDiscount) discount = Math.min(discount, event.maxDiscount);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestEvent = event;
    }
  }
  return { discount: bestDiscount, event: bestEvent };
}

module.exports = { getBestPromotionEventDiscount };
