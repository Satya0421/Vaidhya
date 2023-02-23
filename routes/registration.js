const express = require("express");
var fs = require('fs');
const bcrypt = require('bcryptjs');
var router = express.Router();
var collection = require("../config/collections");
var db = require("../config/connection");
const ObjectID = require("mongodb").ObjectID;
let path = require('path');
const { Console } = require("console");


//// *************** Hospital ***************************///
router.get('/hospital',  async (req, res) => {
  res.render('registrations/hospitalRegistration')
})
router.post('/hospital',  async (req, res) => {
  // console.log(req?.files?.img)
  var image2=req?.files?.img
  await  image2.mv('./uploads/regImages/'+ req.body.name+ ".png");
  const image =await  fs.readFileSync('./uploads/regImages/'+ req.body.name+ ".png");
  const base64Data = Buffer.from(image).toString('base64');
  fs.unlink('./uploads/regImages/' + req.body.name+ ".png", (err, done) => {  // deleting image of the product  
  })
  await db.get()
    .collection(collection.HOSPITAL_COLLECTION)
    .insertOne(
      {
        hospitalName: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        email: req.body.email,
        image: base64Data,
        status:"inActive"
      }
    )
    .then(async (result) => {
      // if (result.acknowledged) {
      //   if (req?.files?.img) {
      //     sharp(req.files.img.data)
      //     .jpeg({ quality: 50 })
      //       .toFile('./uploads/complaint_image/' + result.insertedId + ".jpg", (err, info) => {     
      //       }); 
      //   }
      // }
      res.redirect('back');
    })

})
module.exports = router;
