import multer from "multer";
import path from "path";
import fs from "fs";
import {ErrorResponse} from "../utils/errorResponse.js";

// if (!fs.existsSync("public/uploads")) fs.mkdirSync("public/uploads");
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "public/uploads")
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
//     }
// })

const fileFilter = (req, file, cb) => {
    const acceptedFileTypes = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype);
    if (!acceptedFileTypes) return cb(new ErrorResponse('Hanya gambar dengan format jpeg/jpg/png', 400));
    cb(null, true)
}

export const imageUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {fileSize: 5 * 10234 * 1024}
}).single("image");