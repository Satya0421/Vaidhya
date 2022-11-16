const express = require("express");
const app = express();
const fileupload = require("express-fileupload");
app.use(fileupload({ safeFileNames: true, preserveExtension: true }));
app.patch("/upload_profile_image/:_id", async (req, res) => {
    console.log(req.files)
    let image = req.files.img
    image.mv('./uploads/DoctorsImage/' + req.params._id + ".jpg")
    return res.status(200).json();
});
module.exports = app;