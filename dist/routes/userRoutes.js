import express from "express";
import { deleteUser, getAllUser, getUser, newUser, } from "../controllers/userController.js";
import { adminOnly } from "../middlewares/auth.js";
const app = express.Router();
app.post("/new", newUser);
app.get("/all", adminOnly, getAllUser);
app.route("/:id").get(getUser).delete(adminOnly, deleteUser);
export default app;
