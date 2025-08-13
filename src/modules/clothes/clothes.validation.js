import joi from 'joi';
import { generalFields } from '../../middleware/vaildation.js';


// schema for adding clothes
export const addClothesVal = joi.object({
   name: generalFields.name.required(),
   price: generalFields.price.required(),
   quantity: generalFields.quantity.required(),
   description: generalFields.description.optional(),
   size: generalFields.size.required(),
   color : generalFields.color.required(),
   coupon: generalFields.coupon.optional(),
   finalPrice: generalFields.finalPrice,
})

// schema for updating clothes
export const updateClothesVal = joi.object({
    name: generalFields.name.optional(),
    price: generalFields.price.optional(),
    quantity: generalFields.quantity.optional(),
    description: generalFields.description.optional(),
    size: generalFields.size.optional(),
    color: generalFields.color.optional(),
    coupon: generalFields.coupon.optional(),
    finalPrice: generalFields.finalPrice.optional(),
    clothesId: generalFields.objectId.required(),

})

// schema for getting clothes by id
export const getClothesByIdVal = joi.object({
    clothesId: generalFields.objectId.required(),
});

// schema for deleting clothes 
export const deleteClothesByIdVal = joi.object({
    clothesId: generalFields.objectId.required(),
});