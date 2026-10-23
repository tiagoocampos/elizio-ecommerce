import multer from "multer"

export default ({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
        const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type, must be JPEG, PNG or WEBP"));
        }
    }
})
