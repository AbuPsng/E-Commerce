import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder, } from "../controllers/orderController.js";
const app = express.Router();
app.post("/new", newOrder);
app.get("/my-orders", myOrders);
app.get("/all-orders", adminOnly, allOrders);
app
    .route("/:id")
    .get(getSingleOrder)
    .put(adminOnly, processOrder)
    .delete(adminOnly, deleteOrder);
export default app;
