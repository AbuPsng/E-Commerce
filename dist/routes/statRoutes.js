import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { getBarCharts, getDashBoardStats, getLineCharts, getPieCharts, } from "../controllers/statControllers.js";
const app = express.Router();
app.get("/stats", adminOnly, getDashBoardStats);
app.get("/pie-chart", adminOnly, getPieCharts);
app.get("/bar-chart", adminOnly, getBarCharts);
app.get("/line-chart", adminOnly, getLineCharts);
export default app;
