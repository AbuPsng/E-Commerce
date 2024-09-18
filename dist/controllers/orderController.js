import { TryCatch } from "../middlewares/error.js";
import Order from "../models/orderModel.js";
import { invalidatesCache, reduceStock } from "../utils/feature.js";
import ErrorHandler from "../utils/utilityClass.js";
import { myCache } from "../app.js";
export const newOrder = TryCatch(async (req, res, next) => {
    const { shippingInfo, orderItems, user, subTotal, tax, shippingCharges, discount, total, } = req.body;
    console.log(shippingInfo);
    if (!shippingInfo ||
        !orderItems ||
        !user ||
        !subTotal ||
        !tax ||
        !shippingCharges ||
        !total) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }
    const order = await Order.create({
        shippingInfo,
        orderItems,
        user,
        subTotal,
        tax,
        shippingCharges,
        discount,
        total,
    });
    await reduceStock(orderItems);
    invalidatesCache({
        product: true,
        order: true,
        admin: true,
        userId: user,
        productId: order.orderItems.map((i) => String(i)),
    });
    return res.status(201).json({
        success: true,
        message: "Order place successfully",
    });
});
export const myOrders = TryCatch(async (req, res, next) => {
    const { id: user } = req.query;
    let orders = [];
    if (myCache.has(`${user}-orders`)) {
        orders = JSON.parse(myCache.get(`${user}-orders`));
    }
    else {
        orders = await Order.find({ user });
        myCache.set(`${user}-orders`, JSON.stringify(orders));
    }
    return res.status(200).json({
        success: true,
        orders,
    });
});
export const allOrders = TryCatch(async (req, res, next) => {
    let allOrders = [];
    if (myCache.has(`all-orders`)) {
        allOrders = JSON.parse(myCache.get(`all-orders`));
    }
    else {
        allOrders = await Order.find({}).populate("user", "name");
        myCache.set(`all-orders`, JSON.stringify(allOrders));
    }
    return res.status(200).json({
        success: true,
        orders: allOrders,
    });
});
export const getSingleOrder = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const key = `order-${id}`;
    let order;
    if (myCache.has(key)) {
        order = JSON.parse(myCache.get(key));
    }
    else {
        order = await Order.findById(id).populate("user", "name");
        if (!order)
            return next(new ErrorHandler("Order not found", 404));
        myCache.set(key, JSON.stringify(order));
    }
    return res.status(200).json({
        success: true,
        order,
    });
});
export const processOrder = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    console.log(req.params, "params");
    const order = await Order.findById(id);
    if (!order)
        return next(new ErrorHandler("Order not found", 404));
    console.log(order.user);
    if (order.status === "Processing") {
        order.status = "Shipped";
    }
    else {
        order.status = "Delivered";
    }
    await order.save();
    invalidatesCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
    });
    return res.status(201).json({
        success: true,
        message: "Order Status updated successfully",
    });
});
export const deleteOrder = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order)
        return next(new ErrorHandler("Order not found", 404));
    invalidatesCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
    });
    return res.status(200).json({
        success: true,
        message: "Order deleted successfully",
    });
});
