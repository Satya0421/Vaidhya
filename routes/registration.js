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
    .collection(collection.HOSPITAL_COLLECTION).findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] }, async (err, result) => {
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
              Name: req.body.name,
              phone: req.body.phone,
              address: req.body.address,
              email: req.body.email,
              website: req.body.website,
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

router.get('/pharmacy', async (req, res) => {
  res.render('registrations/pharmacyRegistration')
})
router.post('/pharmacy', async (req, res) => {
  await db.get()
    .collection(collection.PHARMACY_COLLECTION).findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] }, async (err, result) => {
      if (err) {
        // //console.log(err)
        res.render('registrations/pharmacyRegistration', { fmsg: "Error to process... Try once more" });

      }
      if (result) {
        res.render('registrations/pharmacyRegistration', { fmsg: "Pharmacy Already exist" });
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
          .collection(collection.PHARMACY_COLLECTION)
          .insertOne(
            {
              Name: req.body.name,
              phone: req.body.phone,
              address: req.body.address,
              email: req.body.email,
              website: req.body.website,
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
              res.render('registrations/pharmacyRegistration', { smsg: "Success" });
              // req.session.registrationSuccess = true;
              // res.redirect('/');
            }
            else
              res.render('registrations/pharmacyRegistration', { fmsg: "pharmacy Registration  is Failed. Please try later" });
          })
      }
    })

})
router.get('/lab', async (req, res) => {
  res.render('registrations/labRegistration')
})
router.post('/lab', async (req, res) => {
  await db.get()
    .collection(collection.LABS_COLLECTION).findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] }, async (err, result) => {
      if (err) {
        // //console.log(err)
        res.render('registrations/labRegistration', { fmsg: "Error to process... Try once more" });

      }
      if (result) {
        res.render('registrations/labRegistration', { fmsg: "Lab Already exist" });
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
          .collection(collection.LABS_COLLECTION)
          .insertOne(
            {
              Name: req.body.name,
              phone: req.body.phone,
              address: req.body.address,
              email: req.body.email,
              website: req.body.website,
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
              res.render('registrations/labRegistration', { smsg: "Success" });
              // req.session.registrationSuccess = true;
              // res.redirect('/');
            }
            else
              res.render('registrations/labRegistration', { fmsg: "Lab Registration  is Failed. Please try later" });
          })
      }
    })

})
router.get('/nurse', async (req, res) => {
  res.render('registrations/nurseRegistration')
})
router.post('/nurse', async (req, res) => {
  await db.get()
    .collection(collection.NURSE_COLLECTION).findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] }, async (err, result) => {
      if (err) {
        // //console.log(err)
        res.render('registrations/nurseRegistration', { fmsg: "Error to process... Try once more" });

      }
      if (result) {
        res.render('registrations/nurseRegistration', { fmsg: "Home Nurse Already exist" });
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
          .collection(collection.NURSE_COLLECTION)
          .insertOne(
            {
              Name: req.body.name,
              phone: req.body.phone,
              address: req.body.address,
              email: req.body.email,
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
              res.render('registrations/nurseRegistration', { smsg: "Success" });
              // req.session.registrationSuccess = true;
              // res.redirect('/');
            }
            else
              res.render('registrations/nurseRegistration', { fmsg: "nurse Registration  is Failed. Please try later" });
          })
      }
    })

})
router.get('/ambulance', async (req, res) => {
  res.render('registrations/ambulanceRegistration')
})
router.post('/ambulance', async (req, res) => {
  await db.get()
    .collection(collection.AMBULANCE_COLLECTION).findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] }, async (err, result) => {
      if (err) {
        // //console.log(err)
        res.render('registrations/ambulanceRegistration', { fmsg: "Error to process... Try once more" });

      }
      if (result) {
        res.render('registrations/ambulanceRegistration', { fmsg: "Ambulance Already exist" });
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
          .collection(collection.AMBULANCE_COLLECTION)
          .insertOne(
            {
              Name: req.body.name,
              phone: req.body.phone,
              address: req.body.address,
              email: req.body.email,
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
              res.render('registrations/ambulanceRegistration', { smsg: "Success" });
              // req.session.registrationSuccess = true;
              // res.redirect('/');
            }
            else
              res.render('registrations/ambulanceRegistration', { fmsg: "Ambulance Registration  is Failed. Please try later" });
          })
      }
    })

})

router.get('/apk', (req, res) => {
  // Set the appropriate headers for the download
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename=${'./assets/apk/user.apk'}`);

  // Send the APK file to the client
  res.download('./assets/apk/user.apk', (err) => {
    if (err) {
      // Handle any errors that occur during the download
      console.error('Error while downloading APK:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// router.post('/multiinsert', async (req, res) => { 
//   console.log("hello")
//   const image = await fs.readFileSync('./uploads/regImages/1.png');
// const base64Data = Buffer.from(image).toString('base64');

//   for (let i = 0; i < 100; i++) 
// {
//   db.get()
//     .collection(collection.HOSPITAL_COLLECTION)
//     .insertOne(
//       {
//         Name: "Sibin",
//         phone: "12345",
//         address: "adnnfs",
//         email: "sibin.james@email",
//         image: base64Data,
//         status: "inActive",
//         location: {
//           type: "Point",
//           coordinates: [
//             parseFloat(12.9564672),
//             parseFloat(77.594624),
//           ]
//         }
//       }
//     )
// }
// })
module.exports = router;
