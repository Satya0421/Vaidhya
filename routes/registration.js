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
router.get('/hospital', async (req, res) => {
  res.render('registrations/hospitalRegistration')
})

router.post('/hospital', async (req, res) => {

  await db.get()
    .collection(collection.HOSPITAL_COLLECTION).findOne({ $or: [{ phone: req.body.phone }, { username: req.body.email }] }, async (err, result) => {
      if (err) {
        // //console.log(err)
        res.render('registrations/hospitalRegistration', { fmsg: "Error to process... Try once more" });
       
      }
      if (result) {
        res.render('registrations/hospitalRegistration', { fmsg: "Hospital Already exist" });
      }
      else {
        let lan;
        let lat;
        var image2 = req?.files?.img
        if (req.body.lat == "") {
          let loca = req.body.googleLocation.split("@").pop();
          lat = loca.split(",")[0];
          lan = loca.split(",")[1];
        }
        await image2.mv('./uploads/regImages/' + req.body.name + ".png");
        const image = await fs.readFileSync('./uploads/regImages/' + req.body.name + ".png");
        const base64Data = Buffer.from(image).toString('base64');
        fs.unlink('./uploads/regImages/' + req.body.name + ".png", (err, done) => {  // deleting image of the product  
        })
        await db.get()
          .collection(collection.HOSPITAL_COLLECTION)
          .insertOne(
            {
              hospitalName: req.body.name,
              phone: req.body.phone,
              address: req.body.address,
              email: req.body.email,
              websit: req.body.website,
              image: base64Data,
              status: "inActive",
              location: {
                type: "Point",
                coordinates: [
                  parseFloat(req.body.lat == "" ? lat : req.body.lat),
                  parseFloat(req.body.lan == "" ? lan : req.body.lan),
                ]
              }
            }
          )
          .then(async (result) => {
            if (result.acknowledged) {
              // res.redirect('back');
              res.render('registrations/hospitalRegistration', { smsg: "Success" });
              // req.session.registrationSuccess = true;
              // res.redirect('/');
            }
            else
              res.render('registrations/hospitalRegistration', { fmsg: "Hospital Register is Failed. Please try later" });
          })
      }
    })

})

module.exports = router;
