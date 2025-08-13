import { Clothes } from "../../../db/models/clothes.model.js";
import { AppError } from "../../utils/appError.js";
import cloudinary, { deleteCloudImage } from "../../utils/cloud.js";
import { messages } from "../../utils/constant/messages.js";

// Add Clothes
export const addClothes = async (req, res, next) => {
  const { name, price, quantity, description, size, color, coupon } = req.body;

  // Convert name to lowercase for consistency
  const formattedName = name?.toLowerCase();

  // Check if the clothes item already exists (same name & size)
  const existingClothes = await Clothes.findOne({ name: formattedName, size });
  if (existingClothes) {
    return next(new AppError(messages.clothes.alreadyExist, 400));
  }

  // Validate price
  if (!price || isNaN(price) || price <= 0) {
    return next(new AppError(messages.clothes.invalidPrice, 400));
  }

  // Validate quantity
  if (!quantity || isNaN(quantity) || quantity < 0) {
    return next(new AppError(messages.clothes.invalidQuantity, 400));
  }

  // Validate size
  if (!size) {
    return next(new AppError(messages.clothes.invalidSize, 400));
  }

  // Prepare coupon object if provided
  let couponData = {};
  if (coupon?.code && coupon?.discount !== undefined) {
    if (isNaN(Number(coupon.discount)) || coupon.discount < 0 || coupon.discount > 100) {
      return next(new AppError(messages.clothes.invalidCouponDiscount, 400));
    }
    couponData = {
      code: coupon.code.trim(),
      discount: Number(coupon.discount),
    };
  }

  // Calculate final price based on coupon
  let numericPrice = parseFloat(price);
  let finalPrice = numericPrice;
  if (couponData.discount) {
    finalPrice = numericPrice - (numericPrice * (couponData.discount / 100));
  }

  // Format with currency
  const priceWithCurrency = `${numericPrice} EGP`;
  const finalPriceWithCurrency = `${finalPrice.toFixed(2)} EGP`;

  // Handle image upload
  let Image = { secure_url: "", public_id: "" };
  if (req.files?.Image) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.Image[0].path,
      { folder: "clothes" }
    );
    Image = { secure_url, public_id };
    req.failImages = [public_id];
  }

  // Prepare clothes data
  const clothes = new Clothes({
    name: formattedName,
    price: priceWithCurrency,
    finalPrice: finalPriceWithCurrency,
    quantity,
    description,
    size,
    color,
    coupon: couponData,
    Image,
    // createdBy: req.authUser._id,
  });

  // Save the new clothes item
  const newClothes = await clothes.save();
  if (!newClothes) {
    if (req.files?.Image) {
      await deleteCloudImage(req.failImages[0]); // Rollback if save fails
    }
    return next(new AppError(messages.clothes.failToCreate, 500));
  }

  // Send response
  res.status(201).json({
    success: true,
    message: messages.clothes.created,
    data: newClothes,
  });
};


// Update Clothes
export const updateClothes = async (req, res, next) => {
  const { clothesId } = req.params;
  const { name, price, quantity, description, size, color, coupon } = req.body;

  // Convert name to lowercase if provided
  const formattedName = name ? name.toLowerCase() : undefined;

  // Find existing clothes item
  const clothes = await Clothes.findById(clothesId);
  if (!clothes) {
    return next(new AppError(messages.clothes.notExist, 404));
  }

  // Check for duplicate name
  if (formattedName) {
    const existingClothes = await Clothes.findOne({
      name: formattedName,
      _id: { $ne: clothesId },
    });
    if (existingClothes) {
      return next(new AppError(messages.clothes.alreadyExist, 400));
    }
  }

  req.failImages = [];

  // Handle image update
  if (req.files?.Image) {
    if (clothes.Image?.public_id) {
      await deleteCloudImage(clothes.Image.public_id);
    }
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.Image[0].path,
      { folder: "clothes" }
    );
    clothes.Image = { secure_url, public_id };
    req.failImages.push(public_id);
  }

  // Update fields
  if (formattedName) clothes.name = formattedName;
  if (price !== undefined) clothes.price = `${price} EGP`;
  if (quantity !== undefined) clothes.quantity = quantity;
  if (description) clothes.description = description;
  if (size) clothes.size = size;
  if (color) clothes.color = color;

  // Coupon update
  if (coupon) {
    if (coupon.code && coupon.discount !== undefined) {
      if (isNaN(Number(coupon.discount)) || coupon.discount < 0 || coupon.discount > 100) {
        return next(new AppError(messages.clothes.invalidCouponDiscount, 400));
      }
      clothes.coupon = {
        code: coupon.code.trim(),
        discount: Number(coupon.discount),
      };
    } else {
      clothes.coupon = undefined;
    }
  }

  // Calculate finalPrice
  const numericPrice = parseFloat(
    (price !== undefined ? price : clothes.price).toString().replace(" EGP", "")
  );
  const discount = clothes.coupon?.discount || 0;
  const finalPrice = numericPrice - (numericPrice * (discount / 100));
  clothes.finalPrice = `${finalPrice.toFixed(2)} EGP`;

  // Save
  const updatedClothes = await clothes.save();
  if (!updatedClothes) {
    return next(new AppError(messages.clothes.failToUpdate, 500));
  }

  return res.status(200).json({
    message: messages.clothes.updated,
    success: true,
    data: updatedClothes,
  });
};

// get all clothes
export const getAllClothes = async (req, res, next) => {
    const clothes = await Clothes.find()

    if (!clothes || clothes.length === 0) {
        return next(new AppError(messages.clothes.failToFetch, 404));
    }

    res.status(200).json({
        success: true,
        message: messages.clothes.fetchedSuccessfully,
        count: clothes.length,
        data: clothes,

    })
}


// get clothes by id
export const getClothesById = async (req, res, next) => {
    const { clothesId } = req.params;
    
    // Find clothes by ID
    const clothes = await Clothes.findById(clothesId);
    if (!clothes) {
        return next(new AppError(messages.clothes.notExist, 404));
    }

    res.status(200).json({
        success: true,
        message: messages.clothes.fetchedSuccessfully,
        data: clothes,
    });
}


// delete clothes 
export const deleteClothesById = async (req, res, next) => {
  const { clothesId } = req.params;

  // Ensure clothesId is provided
  if (!clothesId) {
    return next(new AppError(messages.clothes.notExist, 400));
  }

  // Find the clothes item by ID
  const clothes = await Clothes.findById(clothesId);
  if (!clothes) {
    return next(new AppError(messages.clothes.notExist, 404));
  }

  // Delete the associated image from Cloudinary (if exists)
  if (clothes.Image?.public_id) {
    await deleteCloudImage(clothes.Image.public_id);
  }

  // Delete the clothes item from the database
  await clothes.deleteOne();

  // Send response
  res.status(200).json({
    message: messages.clothes.deleted,
    success: true,
  });
};