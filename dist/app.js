import express from "express";
import NodeCache from "node-cache";
//importing Routes
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/statRoutes.js";
import { errorMiddleware } from "./middlewares/error.js";
import { connectDb } from "./utils/feature.js";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";
config({ path: "./.env" });
const port = process.env.PORT || 3000;
connectDb(process.env.MONGODBURL || "");
const stripeKey = process.env.STRIPE_KEY || "";
export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.get("/", (req, res) => {
    res.send("Welcome to e-commerce");
});
//Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});
