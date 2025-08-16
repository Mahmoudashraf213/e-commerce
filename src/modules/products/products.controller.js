import { products } from "../../../db/models/products.model.js";
import { AppError } from "../../utils/appError.js";
import cloudinary, { deleteCloudImage } from "../../utils/cloud.js";
import { messages } from "../../utils/constant/messages.js";

// Add products
export const addProducts = async (req, res, next) => {
  const { name, price, quantity, description, size, color, coupon } = req.body;

  // Convert name to lowercase for consistency
  const formattedName = name?.toLowerCase();

  // Check if the products item already exists (same name & size)
  const existingProducts = await products.findOne({ name: formattedName, size });
  if (existingProducts) {
    return next(new AppError(messages.products.alreadyExist, 400));
  }

  // Validate price
  if (!price || isNaN(price) || price <= 0) {
    return next(new AppError(messages.products.invalidPrice, 400));
  }

  // Validate quantity
  if (!quantity || isNaN(quantity) || quantity < 0) {
    return next(new AppError(messages.products.invalidQuantity, 400));
  }

  // Validate size
  if (!size) {
    return next(new AppError(messages.products.invalidSize, 400));
  }


  // Format with currency
  const priceWithCurrency = `${numericPrice} EGP`;
  const finalPriceWithCurrency = `${finalPrice.toFixed(2)} EGP`;

  // Handle image upload
  let Image = { secure_url: "", public_id: "" };
  if (req.files?.Image) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.Image[0].path,
      { folder: "products" }
    );
    Image = { secure_url, public_id };
    req.failImages = [public_id];
  }

  // Prepare products data
  const products = new products({
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

  // Save the new products item
  const newProducts = await products.save();
  if (!newProducts) {
    if (req.files?.Image) {
      await deleteCloudImage(req.failImages[0]); // Rollback if save fails
    }
    return next(new AppError(messages.products.failToCreate, 500));
  }

  // Send response
  res.status(201).json({
    success: true,
    message: messages.products.created,
    data: newProducts,
  });
};


// Update products
export const updateProducts = async (req, res, next) => {
  const { productsId } = req.params;
  const { name, price, quantity, description, size, color, coupon } = req.body;

  // Convert name to lowercase if provided
  const formattedName = name ? name.toLowerCase() : undefined;

  // Find existing products item
  const products = await products.findById(productsId);
  if (!products) {
    return next(new AppError(messages.products.notExist, 404));
  }

  // Check for duplicate name
  if (formattedName) {
    const existingProducts = await products.findOne({
      name: formattedName,
      _id: { $ne: productsId },
    });
    if (existingProducts) {
      return next(new AppError(messages.products.alreadyExist, 400));
    }
  }

  req.failImages = [];

  // Handle image update
  if (req.files?.Image) {
    if (products.Image?.public_id) {
      await deleteCloudImage(products.Image.public_id);
    }
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.Image[0].path,
      { folder: "products" }
    );
    products.Image = { secure_url, public_id };
    req.failImages.push(public_id);
  }

  // Update fields
  if (formattedName) products.name = formattedName;
  if (price !== undefined) products.price = `${price} EGP`;
  if (quantity !== undefined) products.quantity = quantity;
  if (description) products.description = description;
  if (size) products.size = size;
  if (color) products.color = color;

  // Coupon update
  if (coupon) {
    if (coupon.code && coupon.discount !== undefined) {
      if (isNaN(Number(coupon.discount)) || coupon.discount < 0 || coupon.discount > 100) {
        return next(new AppError(messages.products.invalidCouponDiscount, 400));
      }
      products.coupon = {
        code: coupon.code.trim(),
        discount: Number(coupon.discount),
      };
    } else {
      products.coupon = undefined;
    }
  }

  // Calculate finalPrice
  const numericPrice = parseFloat(
    (price !== undefined ? price : products.price).toString().replace(" EGP", "")
  );
  const discount = products.coupon?.discount || 0;
  const finalPrice = numericPrice - (numericPrice * (discount / 100));
  products.finalPrice = `${finalPrice.toFixed(2)} EGP`;

  // Save
  const updatedProducts = await products.save();
  if (!updatedProducts) {
    return next(new AppError(messages.products.failToUpdate, 500));
  }

  return res.status(200).json({
    message: messages.products.updated,
    success: true,
    data: updatedProducts,
  });
};

// get all products
export const getAllProducts = async (req, res, next) => {
    const products = await products.find()

    if (!products || products.length === 0) {
        return next(new AppError(messages.products.failToFetch, 404));
    }

    res.status(200).json({
        success: true,
        message: messages.products.fetchedSuccessfully,
        count: products.length,
        data: products,

    })
}


// get products by id
export const getProductsById = async (req, res, next) => {
    const { productsId } = req.params;
    
    // Find products by ID
    const products = await products.findById(productsId);
    if (!products) {
        return next(new AppError(messages.products.notExist, 404));
    }

    res.status(200).json({
        success: true,
        message: messages.products.fetchedSuccessfully,
        data: products,
    });
}


// delete products 
export const deleteProductsById = async (req, res, next) => {
  const { productsId } = req.params;

  // Ensure productsId is provided
  if (!productsId) {
    return next(new AppError(messages.products.notExist, 400));
  }

  // Find the products item by ID
  const products = await products.findById(productsId);
  if (!products) {
    return next(new AppError(messages.products.notExist, 404));
  }

  // Delete the associated image from Cloudinary (if exists)
  if (products.Image?.public_id) {
    await deleteCloudImage(products.Image.public_id);
  }

  // Delete the products item from the database
  await products.deleteOne();

  // Send response
  res.status(200).json({
    message: messages.products.deleted,
    success: true,
  });
};