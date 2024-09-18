import multer from "multer";
import { v4 } from "uuid";

const storage = multer.diskStorage({
  destination: (req, res, callback) => {
    callback(null, "uploads");
  },
  filename(req, file, callback) {
    const id = v4();
    const extName = file.originalname.split(".").pop();
    const newName = id + "." + extName;

    callback(null, newName);
  },
});

export const singleUpload = multer({ storage }).single("photo");
