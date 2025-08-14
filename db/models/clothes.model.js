import { model, Schema } from "mongoose";
import { clothingSizes} from "../../src/utils/constant/enum.js";

// schema
const clothesSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    price: {
      type: String,
      required: true,
      trim: true,
    },
    finalPrice: {
      type: String,
      trim: true,
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
    coupon: {
      code: { type: String, trim: true }, // Example: "WINTER20"
      discount: { type: Number, min: 0, max: 100 }, // percentage discount
    },
    color: {
      type: String, 
      trim: true,
      required: true,
    },
    // createdBy: {
    //   type: Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
  },
  { timestamps: true }
);

// model
export const Clothes = model("Clothes", clothesSchema);
