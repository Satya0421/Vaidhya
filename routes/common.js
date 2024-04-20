const express = require("express");
const app = express();
app.use(express.json());
var request=require('request');
app.use(express.urlencoded({ extended: true }));
var db = require('../config/connection');
var collection = require("../config/collections")
const crypto = require('crypto');
const config = require("../jwtconfig");
const jwt = require("jsonwebtoken");
// const fileupload = require("express-fileupload");
// app.use(fileupload({ safeFileNames: true, preserveExtension: true }));
require('dotenv').config();
let middleware = require("../middleware");
const bcrypt = require('bcryptjs');
const { Collection, ObjectId } = require("mongodb");
const cron = require("node-cron");
// const sharp = require("sharp");
// const upload = multer({ dest: "uploads/" });
const fast2sms = require('fast-two-sms');
const ObjectID = require("mongodb").ObjectID
var body_parser = require('body-parser');
app.use(body_parser.urlencoded({ extended: false }));
var multer = require('multer');
const upload = multer();

const generateOTP = () => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    return otp;
  };
  

app.post('/entry', async (req, res) => {
    const phone = req.body.phone;

    try {
        const eCommon = await db.get().collection(collection.COMMON).findOne({ phone: phone });
        const eUser = await db.get().collection(collection.USERS).findOne({ phone: phone });
        const eDoctor = await db.get().collection(collection.DOCTORS).findOne({ phone: phone });
        // const eHospital = await db.get().collection(collection.HOSPITAL_COLLECTION).findOne({ phone: phone });
        // const eLabs = await db.get().collection(collection.LABS_COLLECTION).findOne({ phone: phone });
        // const ePharmacy = await db.get().collection(collection.PHARMACY_COLLECTION).findOne({ phone: phone });
        // const eAmbulance = await db.get().collection(collection.AMBULANCE_COLLECTION).findOne({ phone: phone });
        // const eNurse = await db.get().collection(collection.NURSE_COLLECTION).findOne({ phone: phone });
        
        if (eDoctor) { 
            const code = generateOTP();
                await db.get().collection(collection.DOCTORS).updateOne(
                    { phone: phone },
                    { $set: { code: code } }
                )
                .then((result) => {
                  if (result.acknowledged) {
                    request.get('https://www.fast2sms.com/dev/bulkV2?authorization='+process.env.API_KEY+'&route=otp&variables_values='+ code +'&flash=0&numbers='+(req.body.phone),function(err,res,body){
                        if (!err && res.statusCode === 200) {
                            // console.log(body) // Print the google web page.
                          } 
                        //   console.log(res) 
                      })
                    //   console.log(eDoctor._id.toString())
                      return res.status(200).json({ msg: "OTP sent successful", id: eDoctor._id.toString(), db: collection.DOCTORS })
                    // fast2sms.sendMessage({ authorization: process.env.API_KEY, message: 'Welcome To Vaidhya Mobile Application .\n  your code is :' + code + "\n ", numbers: [parseInt(req.body.phone)] })
                   }
                }).catch(()=> {
                  res.status(500).json({ msg: "Failed to send OTP via SMS" });
                });      
        } 

        if (eUser) { 
            const code = generateOTP();
                await db.get().collection(collection.USERS).updateOne(
                    { phone: phone },
                    { $set: { code: code } }
                )
                .then((result) => {
                  if (result.acknowledged) {
                    request.get('https://www.fast2sms.com/dev/bulkV2?authorization='+process.env.API_KEY+'&route=otp&variables_values='+ code +'&flash=0&numbers='+(req.body.phone),function(err,res,body){
                        if (!err && res.statusCode === 200) {
                            // console.log(body) // Print the google web page.
                          } 
                        //   console.log(res) 
                      })
                    //   console.log(eUser._id.toString())
                      return res.status(200).json({ msg: "OTP sent successful", id: eUser._id.toString(), db: collection.USERS })
                    // fast2sms.sendMessage({ authorization: process.env.API_KEY, message: 'Welcome To Vaidhya Mobile Application .\n  your code is :' + code + "\n ", numbers: [parseInt(req.body.phone)] })
                   }
                }).catch(()=> {
                  res.status(500).json({ msg: "Failed to send OTP via SMS" });
                }); 
        } 

        if(!eDoctor && !eUser) {
            if(eCommon){
                const code = generateOTP();
                await db.get().collection(collection.COMMON).updateOne(
                    { phone: phone },
                    { $set: { code: code } }
                )
                .then((result) => {
                  if (result.acknowledged) {
                    request.get('https://www.fast2sms.com/dev/bulkV2?authorization='+process.env.API_KEY+'&route=otp&variables_values='+ code +'&flash=0&numbers='+(req.body.phone),function(err,res,body){
                        if (!err && res.statusCode === 200) {
                            // console.log(body) // Print the google web page.
                          } 
                        //   console.log(res) 
                      })
                      console.log(eCommon._id.toString())
                      return res.status(200).json({ msg: "OTP sent successful",id: eCommon._id.toString(), db:collection.COMMON})
                    // fast2sms.sendMessage({ authorization: process.env.API_KEY, message: 'Welcome To Vaidhya Mobile Application .\n  your code is :' + code + "\n ", numbers: [parseInt(req.body.phone)] })
                   }
                }).catch(()=> {
                  res.status(500).json({ msg: "Failed to send OTP via SMS" });
                });      

               } 

               else 
               
               {

                const code = generateOTP();
                await db.get().collection(collection.COMMON).insertOne(
                    {
                        phone: phone,
                        code: code
                    }
                )
                .then((result) => {
                    if (result.acknowledged) {
                      request.get('https://www.fast2sms.com/dev/bulkV2?authorization='+process.env.API_KEY+'&route=otp&variables_values='+ code +'&flash=0&numbers='+(req.body.phone),function(err,res,body){
                          if (!err && res.statusCode === 200) {
                              console.log(body) // Print the google web page.
                            } 
                          //   console.log(res) 
                      })
                        // console.log("test")
                        // fast2sms.sendMessage({ authorization: process.env.API_KEY, message: 'Welcome To Vaidhya Mobile Application .\n  your code is :' + code + "\n ", numbers: [parseInt(req.body.phone)] })
                        // console.log(result.insertedId.toString())
                        return res.status(200).json({ msg: "OTP sent successful", id: result.insertedId.toString(), db:collection.COMMON})
                     }
                  }).catch(()=> {
                    res.status(500).json({ msg: "Failed to send OTP via SMS" });
                  });   
            }

        } 
    
        
    } catch (error) {
        console.error("Error authenticating user:", error);
        return res.status(500).json({ msg: "Error authenticating user" });
    }
});








// --------------- OTP Verification ------------------


// app.post("/verifyPhone", async (req, res) => {
//   //console.log(req.body)
//   await db.get()
//     .collection(collection.DOCTORS)
//     .updateOne(
//       { $and: [{ _id: ObjectID(req.body._id) }, { code: req.body.code }] },
//       {
//         $set: {
//           lvl: "2",
//           code: 0
//         },
//       }, (err, result) => {
//         if (err) return res.status(500).json({ msg: "Error to process... Try once more" });

//         if (result.modifiedCount == 1) {
//           return res.status(200).json({ msg: "Suceessfully verified" });
//         } else {
//           return res.status(500).json({ msg: "Code not match" });
//         }
//       },
//     );
// });

app.post("/verifyPhone", async (req, res) => {
  try {
      const phone = req.body.phone;
      const verificationCode = req.body.code;
      const mdb = req.body.mdb;
      // const id = req.body.id;

      if( mdb == collection.COMMON ) {
        const result = await db.get().collection(collection.COMMON).updateOne(
            { phone: phone, code: verificationCode },
            { $set: {code: "0"} }
        );

        if (result.modifiedCount === 1) {

          // await db.get()
          // .collection(collection.COMMON)
          // .deleteOne({
          // _id: ObjectID(id)
          // })
          // .then((result) => {
          //     if (result.deletedCount == 1) {
                
          //     }
          // })

          return res.status(200).json({ msg: "Successfully verified", new:true, lvl:"1", mdb: mdb});

        } else {
            return res.status(500).json({ msg: "Code does not match or user not found" });
        }


      }
      
      if( mdb == collection.DOCTORS ) {
        const result = await db.get().collection(collection.DOCTORS).updateOne(
            { phone: phone, code: verificationCode },
            { $set: {code: 0} }
        );
        if (result.modifiedCount === 1) {
            return res.status(200).json({ msg: "Successfully verified", lvl:"1" });
            // if (result.lvl == "6" && id.status == "active") {
            //     let token = await jwt.sign({ phone: req.body.phone, _id: id }, config.key);
            //     //console.log(token)
            //     res.json({
            //       token: token,
            //       msg: "sucess",
            //       lvl: result.lvl,
            //       _id: id
            //     })
  
            //   }
            //   else if (result.lvl == "5") {
            //     return res.status(403).json({ status: result.status, msg: " Your verification is under proccess , You can enjoy Vaidhya Soon" });
            //   }
            //   else if (result.lvl == "6" && result.status == "unSubscribe") {
            //     return res.status(403).json({ status: result.status, msg: " Your Subscription plan is over .Contact Vaidhya to extend it" });
            //   }
            //   else {
            //     return res.status(403).json({ status: result.status, msg: "Account is on inactive state,Contact support ", lvl: result.lvl, _id: result._id, phone: result.phone, name: result.name });
            //   }
            // }
            // else {
            //   return res.status(500).json({ msg: "username or password  incorrect" });
            // }
        } else {
            return res.status(500).json({ msg: "Code does not match or user not found" });
        }
      }


    //   await db.get()
    //     .collection(collection.COMMON)
    //     .deleteOne({
    //     _id: ObjectID(id)
    //     })
    //     .then((result) => {
    //         if (result.deletedCount == 1) {
    //         }
    //     })


    } catch (error) {
      console.error("Error verifying phone:", error);
      return res.status(500).json({ msg: "Error verifying phone" });
  }
});


// app.post("/register1", async (req, res) => {
//   try{
//      const phone = req.body.phone;
//      const num = generateOTP();
//     const service_provider = req.body.sprovider;
    
//       const user = await db.get().collection(collection.COMMON).findOne({phone:phone})  
//       // console.log(user)
//       if (user){
//         await db.get()
//               .collection(collection.COMMON)
//               .updateOne(
//                 {phone:phone},
//                 { 
//                   $set : {
//                             name: req.body.name,
//                             username: req.body.email, 
//                             gender:req.body.gender,
//                             dob: req.body.dob,
//                             lvl: "1",
//                             status: "inactive",
//                             referId: num
//                           }
//                 }
//               )
//               return res.status(200).json({ msg: "First Registration Completed" });
//       }

//   } catch (error) {
//       console.error("Error registering user:", error);
//       return res.status(500).json({ msg: "Error registering user" });
//   }

// });



module.exports = app;