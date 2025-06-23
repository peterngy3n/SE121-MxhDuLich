const Location = require('../../models/general/location.model');
const {NotFoundException} = require('../../errors/exception');
const cloudinary = require('../../config/cloudinary.config');
const { slugify } = require('../../utils/normalizeString');
const { getActivePromotionsForLocations } = require('./location-promotion.util');

const createLocation = async (locationData) => {
    const savedLocation = await locationData.save();
    if(savedLocation)
        return savedLocation;
    else
        throw new NotFoundException('Cannot create new location');
}

const createLocationWithImage = async (locationData) => {
    // const imageUrls = []
    // if(imageFiles && imageFiles.length > 0) {
    //     for(let image of imageFiles) {
    //         const buffer = await image.toBuffer()
    //         const upload = await new Promise((resolve, reject) => {
    //             cloudinary.uploader.upload_stream({folder: 'travel-social'}, (error, result) => {
    //                 if(error)
    //                     return reject(new NotFoundException('Cannot upload'))
    //                 resolve(result)
    //             }).end(buffer)
    //         })
    //         imageUrls.push(upload.secure_url)
    //     }
    // }
    // locationData.image = imageUrls
    const slug = slugify(locationData.name + locationData.address);
    locationData.slug = slug
    const savedLocation = await locationData.save();
    if(savedLocation)
        return savedLocation;
    else {
        // for (let image of images) {
        //     await cloudinary.uploader.destroy(image.url)
        // }
        throw new NotFoundException('Cannot create new location');
    }
}

const getAllLocation = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
  
    const [allLocation, total] = await Promise.all([
      Location.find().skip(skip).limit(limit),
      Location.countDocuments()
    ]);

    // Lấy promotion event cho tất cả location (nếu có)
    const locationIds = allLocation.map(loc => loc._id);
    console.log('Location IDs:', locationIds);
    const promotions = await getActivePromotionsForLocations(locationIds);
    console.log('Promotions:', promotions);
    // Map locationId -> promotions
    const promotionMap = {};
    promotions.forEach(promo => {
      promo.locationIds.forEach(locId => {
        const key = locId.toString();
        if (!promotionMap[key]) promotionMap[key] = [];
        promotionMap[key].push(promo);
        console.log(`Promotion ${promo._id} added to location ${key}`);
      });
    });
    // Gắn promotion vào từng location
    const allLocationWithPromotion = allLocation.map(loc => {
      const locObj = loc.toObject ? loc.toObject() : loc;
      return {
        ...locObj,
        promotions: promotionMap[loc._id.toString()] || []
      };
    });

    if (allLocationWithPromotion.length !== 0) {
      return {
        data: allLocationWithPromotion,
        total,
        page,
        limit,
      };
    } else {
      throw new NotFoundException('Not found any location in database');
    }
};

// const getAllLocation = async () => {
//     const allLocation = await Location.find();
//     // for (const location of allLocation) {
//     //     const slug = createSlug(location.name, location.address); // Tạo slug

//     //     // Cập nhật trường slug cho tài liệu hiện tại
//     //     await Location.updateOne(
//     //         { _id: location._id }, // Điều kiện: tài liệu theo _id
//     //         { $set: { slug } } // Cập nhật trường slug
//     //     );
//     // }
//     if(allLocation.length !== 0)
//         return allLocation;
//     else
//         throw new NotFoundException('Not found any location in database');
// }


const getLocationByCategory = async (categoryId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
  
    const [locations, total] = await Promise.all([
      Location.find({ 'category.id': categoryId }).skip(skip).limit(limit),
      Location.countDocuments({ 'category.id': categoryId }),
    ]);
  
    // Return empty data array instead of throwing exception when no locations found
    return {
      data: locations,
      total,
      page,
      limit,
    };
  };

const getLocationByUserId = async (userId) => {
    const locations = await Location.find({ownerId: userId});
    if(locations.length != 0)
        return locations;
    else
        throw new Error('Not found this user location');
}

const removeDiacritics = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const getLocationByName = async (name) => {
    const normalizedInput = removeDiacritics(name).toLowerCase();
    console.log(normalizedInput);
    const locations = await Location.find(
            { 
                slug: { 
                    $regex: new RegExp(normalizedInput, 'i') 
                } 
            }
        );
    if(locations.length !== 0)
        return locations;
    else
        throw new NotFoundException('Not found this location');
    //Thêm chức năng tìm kiếm không dấu: thêm một trường tên không dấu trong database.
    //Tìm kiếm không theo thứ tự: tìm hiểu TFIDF
    //VN core nlp
}

const getLocationById = async (locationId) => {
    const location = await Location.findById(locationId);
    if(location)
        return location;
    else
        throw new NotFoundException('Not found this location');
}

const updateLocation = async(locationId, updateData) => {
    const updatedLocation = await Location.findByIdAndUpdate(locationId, updateData, {new: true, runValidators: true})
    if(updatedLocation)
        return updatedLocation
    else
        throw new NotFoundException('Not found location to update')
}

const deleteLocation = async(locationId) => {
    const deletedLocation = await Location.findByIdAndDelete(locationId)
    if(deletedLocation)
        return deletedLocation
    else
        throw new NotFoundException('Not found location to delete')
}

module.exports = {
    getAllLocation, 
    createLocation,
    createLocationWithImage,
    getLocationByCategory,
    getLocationByUserId,
    getLocationByName,
    getLocationById,
    updateLocation,
    deleteLocation
}