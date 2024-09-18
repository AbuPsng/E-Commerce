import { TryCatch } from "../middlewares/error.js";
import Product from "../models/productModel.js";
import ErrorHandler from "../utils/utilityClass.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/feature.js";
export const newProduct = TryCatch(async (req, res, next) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    if (!photo)
        return next(new ErrorHandler("Please add photo", 400));
    if (!name || !price || !stock || !category) {
        rm(photo.path, () => {
            console.log("Photo deleted");
        });
        return next(new ErrorHandler("Please enter all fields", 400));
    }
    await Product.create({
        name,
        price,
        stock,
        category: category.toLocaleLowerCase(),
        photo: photo?.path,
    });
    await invalidatesCache({ product: true, admin: true });
    return res.status(201).json({
        success: true,
        message: "Product created successfully",
    });
});
//Revalidate on create,update,delete and order
export const getLatestProduct = TryCatch(async (req, res, next) => {
    let latestProduct = [];
    if (myCache.has("latest-product")) {
        latestProduct = JSON.parse(myCache.get("latest-product"));
    }
    else {
        latestProduct = await Product.find({})
            .sort({
            createdAt: -1,
        })
            .limit(5);
        myCache.set("latest-product", JSON.stringify(latestProduct));
    }
    return res.status(201).json({
        success: true,
        products: latestProduct,
    });
});
//Revalidate on create,update,delete and order
export const getAllCategory = TryCatch(async (req, res, next) => {
    let allCategories = [];
    if (myCache.has("all-categories")) {
        allCategories = JSON.parse(myCache.get("all-categories"));
    }
    else {
        allCategories = await Product.distinct("category");
        myCache.set("all-categories", JSON.stringify(allCategories));
    }
    return res.status(200).json({
        success: true,
        categories: allCategories,
    });
});
//Revalidate on create,update,delete and order
export const getAdminProducts = TryCatch(async (req, res, next) => {
    let allProducts = [];
    if (myCache.has("all-products")) {
        allProducts = JSON.parse(myCache.get("all-products"));
    }
    else {
        allProducts = await Product.find({});
        myCache.set("all-products", JSON.stringify(allProducts));
    }
    return res.status(200).json({
        success: true,
        products: allProducts,
    });
});
export const getSingleProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    let product;
    if (myCache.has(`product-${id}`)) {
        product = JSON.parse(myCache.get(`product-${id}`));
    }
    else {
        if (!id)
            return next(new ErrorHandler("Please provide a Id ", 401));
        product = await Product.findById(id);
        if (!product)
            return next(new ErrorHandler("Please provide a valid Id ", 401));
        myCache.set(`product-${id}`, JSON.stringify(product));
    }
    return res.status(201).json({
        success: true,
        product,
    });
});
export const updateProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    if (!id)
        return next(new ErrorHandler("Please provide a Id ", 401));
    const { name, stock, price, category } = req.body;
    const photo = req.file;
    const product = await Product.findById(id);
    if (!product)
        return next(new ErrorHandler("Please provide a valid Id ", 401));
    if (photo) {
        rm(product.photo, (err) => {
            if (err) {
                console.error("Failed to remove previous photo:", err);
            }
            else {
                console.log("Previous photo of product is removed");
            }
        });
        product.photo = photo.path;
    }
    if (name)
        product.name = name;
    if (price)
        product.price = price;
    if (stock)
        product.stock = stock;
    if (category)
        product.category = category;
    await product.save();
    await invalidatesCache({
        product: true,
        admin: true,
        productId: String(product._id),
    });
    return res.status(200).json({
        success: true,
        message: "Product update successfully",
    });
});
export const deleteProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    if (!id)
        return next(new ErrorHandler("Please provide a Id ", 401));
    const product = await Product.findById(id);
    if (!product)
        return next(new ErrorHandler("Product not found ", 401));
    rm(product.photo, (err) => {
        if (err) {
            console.error("Failed to remove previous photo:", err);
        }
        else {
            console.log("Previous photo of product is removed");
        }
    });
    await product.deleteOne();
    invalidatesCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });
    return res.status(201).json({
        success: true,
        message: "Your item has been deleted successfully",
    });
});
export const getAllFilterProduct = TryCatch(async (req, res, next) => {
    const { search, sort, category, price } = req.query;
    const limit = Number(process.env.PRODUCT_PER_PAGE || 8);
    const page = Number(req.query.page) || 1;
    const skip = limit * (page - 1);
    const baseQuery = {};
    if (search) {
        baseQuery.name = {
            $regex: search,
            $options: "i",
        };
    }
    if (price) {
        baseQuery.price = {
            $lte: Number(price),
        };
    }
    if (category) {
        baseQuery.category = category;
    }
    //Using Promise.all for query both funtion at the same time
    const [queryProducts, allQeuryProducts] = await Promise.all([
        Product.find(baseQuery)
            .sort(sort && { price: sort === "asc" ? 1 : -1 })
            .skip(skip)
            .limit(limit),
        Product.find(baseQuery),
    ]);
    const totalPage = Math.ceil(allQeuryProducts.length / limit);
    return res.status(201).json({
        success: true,
        data: {
            products: queryProducts,
            totalPage,
        },
    });
});
