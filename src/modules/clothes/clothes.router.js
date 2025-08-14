import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { cloudUploads } from "../../utils/multer-cloud.js";
import { isValid } from "../../middleware/vaildation.js";
import { addClothes, deleteClothesById, getAllClothes, getClothesById, updateClothes } from "./clothes.controller.js";
import { addClothesVal, deleteClothesByIdVal, getClothesByIdVal, updateClothesVal } from "./clothes.validation.js";

const clothesRouter = Router();

//add a new clothes item
clothesRouter.post('/add',
    cloudUploads({}).fields([{ name : "Image" , maxCount: 1 }]),
    isValid(addClothesVal),
    asyncHandler(addClothes)
) 

// Update clothes item
clothesRouter.put('/update/:clothesId',
    cloudUploads({}).fields([{ name : "Image" , maxCount: 1 }]),
    isValid(updateClothesVal),
    asyncHandler(updateClothes)
);

// Get all clothes items
clothesRouter.get('/',
    asyncHandler(getAllClothes)
)

// Get clothes item by ID
clothesRouter.get('/:clothesId',
    isValid(getClothesByIdVal),
    asyncHandler(getClothesById)
);

// Delete clothes item by ID
clothesRouter.delete('/:clothesId',
    isValid(deleteClothesByIdVal),
    asyncHandler(deleteClothesById)
);

export default clothesRouter