import mongoose from "mongoose";
import { trim } from "validator";

// const interface IProduct{

// }

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter prodcut name"],
    },
    photo: {
      type: String,
      required: [true, "Please enter product photo"],
    },
    price: {
      type: Number,
      required: [true, "Please enter product price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter product stock"],
    },
    category: {
      type: String,
      required: [true, "Please enter product category"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", schema);
export default Product;
