import { model, Schema } from "mongoose";
import { clothingSizes, clothingCategories, clothingBrands } from "../../src/utils/constant/enums.js";

// schema
const clothesSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      enum: Object.values(clothingSizes), // e.g., XS, S, M, L, XL, XXL
      required: true,
    },
    Image: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// model
export const Clothes = model("Clothes", clothesSchema);
