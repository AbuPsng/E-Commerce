import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { deleteProduct, getAdminProducts, getAllCategory, getAllFilterProduct, getLatestProduct, getSingleProduct, newProduct, updateProduct, } from "../controllers/productController.js";
import { singleUpload } from "../middlewares/multer.js";
const app = express.Router();
app.post("/new", adminOnly, singleUpload, newProduct);
app.get("/query-prdouct", getAllFilterProduct);
app.get("/latest", getLatestProduct);
app.get("/categories", getAllCategory);
app.get("/admin-product", adminOnly, getAdminProducts);
app
    .route("/:id")
    .get(getSingleProduct)
    .put(adminOnly, singleUpload, updateProduct)
    .delete(adminOnly, deleteProduct);
export default app;
