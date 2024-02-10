const express = require("express");
const app = express();
var request=require('request');
app.use(express.json());
var db = require('../config/connection');
var collection = require("../config/collections")
const config = require("../jwtconfig");
const jwt = require("jsonwebtoken");
require('dotenv').config();
let middleware = require("../middleware");
const bcrypt = require('bcryptjs');
const ObjectID = require("mongodb").ObjectID
// const Razorpay = require('razorpay');
const fast2sms = require('fast-two-sms');
// const razorpay = new Razorpay({
//     key_id: 'rzp_test_r9BjXS8K8XqlTm',
//     key_secret: 'rkQpfdaMOwfWoAo8v6qYH1nX',
// });
//// ***************Registration***************************///
app.post('/register', async (req, res) => {
    await db.get()
        .collection(collection.USERS).findOne({ $or: [{ phone: req.body.phone }, { username: req.body.email }] }, async (err, result) => {
            if (err) {
                //console.log(err)
                return res.status(500).json({ msg: "Error to process... Try once more" });
            }
            if (result) {
                return res.status(403).json({ msg: "User Already exist" });
            }
            else {
                var num = Math.floor(1000 + Math.random() * 9000)
                // var num = await crypto.randomBytes(Math.ceil(6)).toString('hex').slice(0, 6);
                var pass = await bcrypt.hash(req.body.password,8);
                await db.get()
                    .collection(collection.USERS)
                    .insertOne(
                        {
                            password: pass,
                            name: req.body.name,
                            phone: req.body.phone,
                            username: req.body.email,
                            gender: req.body.gender,
                            code: num,
                            dob: req.body.dob,
                            status: "inactive"
                        }
                    )
                    .then((result) => {
                        if (result.acknowledged) {
                            request.get('https://www.fast2sms.com/dev/bulkV2?authorization='+process.env.API_KEY+'&route=otp&variables_values='+ num +'&flash=0&numbers='+(req.body.phone),function(err,res,body){
                    if (!err && res.statusCode === 200) {
                        console.log(body) // Print the google web page.
                     } 
                     console.log(res) 
                  })
                            // fast2sms.sendMessage({ authorization: process.env.API_KEY, message: 'Welcome To Vaidhya Mobile Application .\n  your code is :' + num + "\n ", numbers: [parseInt(req.body.phone)] })
                            return res.status(200).json({ _id: result.insertedId })
                        }
                        else {
                            return res.status(500).json({ msg: "Error to process... Try once more" });
                        }
                    })
                    .catch((error) => {
                        // console.log(error)
                        return res.status(500).json({ msg: "Error to process... Try once more" });
                    });
            }
        });
})
app.post("/verifyPhone", async (req, res) => {
    //console.log(req.body)
    await db.get()
        .collection(collection.USERS)
        .updateOne(
            { $and: [{ _id: ObjectID(req.body._id) }, { code: req.body.code }] },
            {
                $set: {
                    lvl: "2",
                    //  code: 123,
                    status: "active"
                },
            }, (err, result) => {
                if (err) return res.status(500).json({ msg: "Error to process...Try once more" });

                if (result.modifiedCount == 1) {
                    db.get().collection(collection.USERSAPPOINTMENT).insertOne({ _id: ObjectID(req.body._id) })
                    return res.status(200).json({ msg: "Suceessfully verified" });

                } else {
                    return res.status(500).json({ msg: "code not match" });
                }
            },
        );
});
app.post('/resendCode', async (req, res) => {
    // console.log("hello")
     await db.get()
        .collection(collection.USERS)
        .findOne(
            { _id: ObjectID(req.body._id) },
            async (err, profile) => {
                console.log(profile.phone   )
                request.get('https://www.fast2sms.com/dev/bulkV2?authorization='+process.env.API_KEY+'&route=otp&variables_values='+ profile.code +'&flash=0&numbers='+(profile.phone),function(err,res,body){
                    if (!err && res.statusCode === 200) {
                        console.log(body) // Print the google web page.
                     } 
                     console.log(res) 
                  })
                  
            //  var result=await  fast2sms.sendMessage({ authorization: process.env.API_KEY, message: ' One time Verification Code is :' + profile.code + "\n ", numbers: [profile.phone] })
            
            // var result=await  fast2sms.sendMessage({ authorization: process.env.API_KEY, message: ' One time Verification Code is :' + profile.code + "\n ", numbers: [parseInt("9496473754")] })
          
            return res.status(200).json()
            },
        )
});
app.post('/forget_password', async (req, res) => {
    // var num = await crypto.randomBytes(Math.ceil(6)).toString('hex').slice(0, 6);
    //console.log(req.body)
   
    var num = Math.floor(1000 + Math.random() * 9000)
    await db.get()
        .collection(collection.USERS)
        .findOneAndUpdate(
            { username: req.body.username },
            {
                $set: {
                    code: num
                },
            },
            async (err, profile) => {
                if (profile.value == null) {
                    return res.status(403).json({ msg: "The email is not registred yet" });
                }
                if (err) {
                    return res.status(500).json({ msg: "Error to process...Try once more" });
                }
              
                request.get('https://www.fast2sms.com/dev/bulkV2?authorization='+process.env.API_KEY+'&route=otp&variables_values='+ num +'&flash=0&numbers='+(profile.value.phone),function(err,res,body){
                    if (!err && res.statusCode === 200) {
                        console.log(body) // Print the google web page.
                     } 
                     console.log(res) 
                  })
                // fast2sms.sendMessage({ authorization: process.env.API_KEY,route: otp, message: 'Greetings From Vaidhya .  One time code to reset your password is ' + num, numbers: parseInt(profile.value.phone) })
                // var mailOption = {
                //   from: 'pilasa.ae@gmail.com',
                //   to: req.body.username,
                //   subject: 'Pilasa one time code',
                //   html: `<h3>Greetings From Pilasa Family\n<br>
                //   One time code to reset your password is<h3><h1>` + num + '<h1>'
                // };
                // transport.sendMail(mailOption, function (error, info) {
                return res.status(200).json({ _id: profile.value._id });
                // });
            },
        )
});
app.post("/verifyforgetpassword", async (req, res) => {
    //console.log(req.body)
    await db.get()
        .collection(collection.USERS)
        .updateOne(
            { $and: [{ _id: ObjectID(req.body._id) }, { code: req.body.code }] },
            {
                $set: {
                    // lvl: "2",
                    code: 0
                },
            }, (err, result) => {
                //console.log(result)
                if (err) return res.status(500).json({ msg: "Error to process...Try once more" });

                if (result.modifiedCount == 1) {
                    return res.status(200).json({ msg: "Suceessfully verified" });
                } else {
                    return res.status(500).json({ msg: "code not match" });
                }
            },
        );
});
app.post('/reset-password', async (req, res) => {
    req.body.password = await bcrypt.hash(req.body.password, 8);
    await db.get()
        .collection(collection.USERS)
        .updateOne(
            { _id: ObjectID(req.body._id) },
            {
                $set: {
                    password: req.body.password,
                },
            }, (err, result) => {
                if (err) return res.status(500).json({ msg: "Error to process...Try once more" });
                if (result.modifiedCount == 1) {
                    return res.status(200).json({ msg: "Suceessfully verified" });
                }
            },
        )
});

//// ***************Main Pages***************************///
app.post("/login", async (req, res) => {
    await db.get()
        .collection(collection.USERS)
        .findOne({ username: req.body.username }, async (err, user) => {
            if (user == null) {
                res.status(500).json({ msg: "username does not exist" })
            }
            else {
                if (user) {
                    await bcrypt.compare(req.body.password, user.password).then(async (status) => {
                        if (status) {
                        if (user.lvl == "2" && user.status == "active") {
                            let token = await jwt.sign({ username: req.body.username, _id: user._id }, config.key);
                            res.json({
                                token: token,
                                msg: "sucess"
                            })

                        } else {
                            return res.status(403).json({ status: user.status, lvl: user.lvl, _id: user._id, phone: user.phone, msg: "username or password  incorrect" });
                        }
                    }
                    else
                    {
                        
                            return res.status(500).json({ msg: "username or password  incorrect" });
                                              }
                    })
                }

            }
        });
});
app.get('/dashboard', middleware.checkToken, async (req, res) => {
    // console.log("hello")
    var result = await db.get()
        .collection(collection.USERS).aggregate([
            {
                $match: { _id: ObjectID(req.decoded._id) }
            },
            {
                $project: {
                    _id: '$_id',
                    name: '$name',
                    phone: '$phone'
                }
            }]).toArray();
    return res.json(result[0])

})
app.get('/getbanners', middleware.checkToken, async (req, res) => {
    let superImage = await db.get().collection(collection.BANNERCOLLECTION).find().project({ _id: 0 }).toArray();
    res.json(superImage)
})
// app.post('/change-password', middleware.checkToken, async (req, res) => {
//     await db.get()
//         .collection(collection.USERS)
//         .findOne({ _id: ObjectID(req.decoded._id) }, async (err, user) => {
//             if (user) {
//                 await bcrypt.compare(req.body.currpassword, user.password).then(async (status) => {
//                     if (status) {
//                         req.body.newpassword = await bcrypt.hash(req.body.newpassword, 08);
//                         await db.get()
//                             .collection(collection.USERS)
//                             .updateOne(
//                                 { _id: ObjectID(req.decoded._id) },
//                                 {
//                                     $set: {
//                                         password: req.body.newpassword
//                                     },
//                                 }, (err, result) => {
//                                     if (err) return res.status(500).json({ msg: "Error to process...Try once more" });
//                                     if (result.modifiedCount == 1) {
//                                         return res.status(200).json({ msg: "Password Updated Successfully" });
//                                     } else {
//                                         return res.status(500).json({ msg: "Request failed" });
//                                     }
//                                 },
//                             )
//                     }
//                     else {
//                         return res.status(403).json({ msg: "Wrong Password" });
//                     }
//                 })
//             }
//         })

// });
//// ***************list Doctors***************************///
//   app.post('/displayDoctors', middleware.checkToken, async (req, res) => {
//         await db.get().collection(collection.BOOKINGS)
//           .find({
//             $and: [
//               {
//                 location: {
//                   $near: {
//                     $geometry:
//                     {
//                       type: "point",
//                       coordinates: [
//                         parseFloat(req.body.lng),
//                         parseFloat(req.body.lat)
//                       ],
//                       maxDistance: 10,
//                     },

//                   }
//                 }
//               },

//               { department: req.body.department },
//             ]
//           }). project({ appointments: { $slice: [ "$appointments", 1 ]} })
//           .toArray()
//           .then((out) => {
//             res.json(out);
//           });

//         //   project({ churchName: 1, place: 1 }).limit(10).toArray()
//   });
app.post('/displayDoctors', middleware.checkToken, async (req, res) => {
    // var index = 0;
    // console.log(req.body)
    if (req.body.treattype == 1 || req.body.treattype == 4) {
        var result2 = await db.get().collection(collection.BOOKINGS).aggregate([
            {
                $geoNear: {
                    // near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                    near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                    distanceField: "distance",
                    maxDistance: 15000,
                    // query: { category: "Parks" },
                    // includeLocs: "dist.location",
                    spherical: true
                }
            },
            {
                $match: {
                    $and: [{ department: req.body.department },
                    { category: req.body.category },
                    { status: "Active" },
                    { "appointments": { $elemMatch: { treattype: req.body.treattype } } }]
                },
            },
            // {
            //     $project: {
            //         _id: 1,
            //         department: "$department",
            //         address: "$address",
            //         name: "$name",
            //         appointments: { $slice: ["$appointments", 1] },
            //         rating: { $divide: ["$rating", "$totalRating"] },

            //     }
            // },
            // { $sample: { size: 25 } }
        ]).toArray()
        res.json(result2);
    }
    else {

        var result2 = await db.get().collection(collection.BOOKINGS).aggregate([
            {
                $match: {
                    $and: [{ department: req.body.department },
                    { category: req.body.category },
                    { status: "Active" },
                    { "appointments": { $elemMatch: { treattype: req.body.treattype } } }]
                },
            },
            {
                $project: {
                    _id: 1,
                    department: "$department",
                    address: "$address",
                    name: "$name",
                    appointments: { $slice: ["$appointments", 1] },
                    rating: { $divide: ["$rating", "$totalRating"] },

                }
            },
            { $sample: { size: 25 } }
        ]).toArray()
        res.json(result2);
    }
    //   var output=result2.filter(eachObj ,i => {
    //     if( eachObj.appointments.date==req.body.date)
    //     {
    //         if()
    //     }
    //   });
    //  for(int i=0;i<result2.appointments.length )
    //  {
    //     if()
    //  }
    //console.log(result2)

});
app.post('/displayReviews', middleware.checkToken, async function (req, res, next) {
    var response = await db.get().collection(collection.DOCTORSREVIEW).aggregate(
        [
            {
                $match: { _id: ObjectID(req.body.drid) }
            },
            { $project: { review: { $slice: ["$review", -75] }, _id: 0 } }
        ]).toArray()

    res.status(200).json(response[0]["review"])
});

//// ***************Appointment***************************///
app.post('/bookAppointment', middleware.checkToken, async (req, res) => {
    await db.get().collection(req.body.date.substring(3)).updateOne({ _id: ObjectID(req.body.doctorid) },
        {
            $push: {
                appointments: {
                    date: req.body.date,
                    time: req.body.time,
                    patientid: ObjectID(req.decoded._id),
                    patientname: req.body.patientname,
                    treattype: req.body.treattype,
                    fees: req.body.fee,
                    status: "active",
                    paymentid: req.body.paymentid,
                    phone: req.body.phone,
                    summary: false
                },
            }
        },
        { upsert: true }
    ).then(async (result, err) => {
        //console.log(result)
        if (result.upsertedCount == 1 || result.modifiedCount == 1) {
            await db.get().collection(collection.USERSAPPOINTMENT).updateOne({ _id: ObjectID(req.decoded._id) },
                {
                    $push: {
                        appointments: {
                            date: req.body.date,
                            time: req.body.time,
                            doctorsid: ObjectID(req.body.doctorid),
                            patientname: req.body.patientname,
                            treattype: req.body.treattype,
                            doctorname: req.body.doctorsName,
                            status: "active",
                            summary: "",
                            rating: 0
                        },
                    }
                }
            ).then(async (result, err) => {
                //console.log(result)
                if (result.modifiedCount == 1) {
                    await db.get()
                        .collection(collection.BOOKINGS)
                        .updateOne({
                            _id: ObjectID(req.body.doctorid),
                        },
                            {
                                $inc: { balance: req.body.fee },
                                $pull: { appointments: { time: req.body.time, date: req.body.date } }
                            },
                        )
                        .then((result) => {
                            if (result.modifiedCount == 1) {
                                // razorpay.payments.capture(req.body.paymentid, parseInt(req.body.fee * 100))
                                //     .then(function (response) {
                                //         // console.log(response);
                                //     })
                                //     .catch(function (err) {
                                //         // console.error(err);

                                //     });
                                return res.status(200).json({ msg: "Appointment successful" });
                            }
                        })
                } else
                    return res.status(500).json({ msg: "Error to process...Try once more" });
            })
        }
        else
            return res.status(500).json({ msg: "Error to process...Try once more" });
    })

        .catch(() => {
            return res.status(500).json({ msg: "Error to process...Try once more" });
        });

});
app.post('/cancelAppointment', middleware.checkToken, async (req, res) => {
    await db.get().collection(req.body.date.substring(3)).findOne({
        _id: ObjectID(req.body.doctorid),
        appointments: { $elemMatch: { date: req.body.date, time: req.body.time } }
    }, {
        projection: { "appointments.$": 1 }
        , returnOriginal: false
    }).then(async (result, err) => {
        if (result) {
            await db.get()
                .collection(collection.CANCELCOLLECTION)
                .insertOne(
                    {
                        name: req.body.name,
                        phone: req.body.phone,
                        patientname: result.appointments[0].patientname,
                        patientid: ObjectID(req.decoded._id),
                        doctorid: ObjectID(req.body.doctorid),
                        date: result.appointments[0].date,
                        time: result.appointments[0].time,
                        paymentId: result.appointments[0].paymentid,
                        reason: req.body.reason,
                        raisedBy: "user",
                        status: "Raised"
                    }
                )
                .then(async (result) => {
                    if (result.acknowledged) {
                        await db.get().collection(collection.USERSAPPOINTMENT).updateOne({ _id: ObjectID(req.decoded._id) },
                            {
                                $set: { "appointments.$[inds].status": "Raised" }
                            },
                            {
                                "arrayFilters": [{ "inds.date": req.body.date, "inds.time": req.body.time }]
                            },
                        )
                        return res.status(200).json({ msg: "Cancel Request Generated successful" });
                        // return res.status(200).json({ msg: "Appointment cancelled successful" });
                    } else
                        return res.status(500).json({ msg: "Error to process...Try once more" });
                })

                .catch(() => {
                    return res.status(500).json({ msg: "Error to process...Try once more" });
                })
        }
        else {
            return res.status(500).json({ msg: "Error to process...Try once more" });
        }
    });
})
// app.post('/cancelAppointment', middleware.checkToken, async (req, res) => {
//     var fees = 0;
//     var paymentid = 0;
//     var result = await db.get().collection(req.body.date.substring(3)).findOneAndUpdate(
//         {
//             _id: ObjectID(req.body.doctorid), "appointments.date": req.body.date, "appointments.time": req.body.time,
//         },
//         {
//             $set: { "appointments.$[inds].status": "cancelled" }
//         },
//         {
//             arrayFilters: [{ "inds.date": req.body.date, "inds.time": req.body.time, "inds.patientid": ObjectID(req.decoded._id) }],
//             projection: { "appointments.$": 1 }
//         },
//     );
//     fees = result.value.appointments[0].fees;
//     paymentid = result.value.appointments[0].paymentid;
//     await db.get().collection(collection.USERSAPPOINTMENT).updateOne({ _id: ObjectID(req.decoded._id) },
//         {
//             $set: { "appointments.$[inds].status": "cancelled" }
//         },
//         {
//             "arrayFilters": [{ "inds.date": req.body.date, "inds.time": req.body.time }]
//         },
//     ).then(async (result, err) => {
//         if (result.modifiedCount == 1) {
//             await db.get().collection(collection.BOOKINGS).updateOne(
//                 {
//                     _id: ObjectID(req.body.doctorid)
//                 },
//                 {
//                     $push: { appointments: { time: req.body.time, date: req.body.date, treattype: req.body.treattype } },
//                     $inc: { balance: - fees }
//                 }

//             ).then(async (result, err) => {
//                 // //console.log(result)
//                 if (err)
//                     return res.status(500).json({ msg: "Error to process...Try once more" });
//                 if (result.modifiedCount == 1) {
//                     // const refund = await razorpay.payments.refund(paymentid, {
//                     //     amount: fees-20 * 100, // amount in paise
//                     //     speed: 'optimum',
//                     // });
//                     // console.log(refund)
//                     return res.status(200).json({ msg: "Cancelled successfully" });
//                 }
//                 else {
//                     return res.status(500).json({ msg: "Error to process...Try once more" });
//                 }
//             });
//         }
//         else {
//             return res.status(500).json({ msg: "Error to process...Try once more" });
//         }
//     });
// })

app.post('/review', middleware.checkToken, async (req, res) => {
    await db.get().collection(collection.USERSAPPOINTMENT).updateOne({ _id: ObjectID(req.decoded._id) },
        {
            $set: { "appointments.$[inds].rating": req.body.rating }
        },
        {
            "arrayFilters": [{ "inds.date": req.body.date, "inds.time": req.body.time }]
        },
    ).then(async (result, err) => {

        await db.get().collection(collection.BOOKINGS).updateOne(
            {
                _id: ObjectID(req.body.doctorid)
            },

            {
                $inc: { rating: req.body.rating, totalRating: 5 }

            }

        ).then(async (result, err) => {
            if (req.body.comment != "") {
                await db.get().collection(collection.DOCTORSREVIEW).updateOne(
                    {
                        _id: ObjectID(req.body.doctorid)
                    },
                    {
                        $push: { review: { name: req.body.name, comment: req.body.comment } }
                    }
                ).then(async (result, err) => {

                    if (err)
                        return res.status(500).json({ msg: "Error to process...Try once more" });
                    return res.status(200).json({ msg: "Review Submitted Successfully" })
                }).catch(() => {
                    return res.status(500).json({ msg: "Error to process...Try once more" });
                });
            }
            else {
                return res.status(200).json({ msg: "Review Submitted Successfully" })
            }
        });
    })
});
app.get('/viewBookings', middleware.checkToken, async (req, res) => {
    res.json(await db.get().collection(collection.USERSAPPOINTMENT)
        .aggregate([{
            $match: { _id: ObjectID(req.decoded._id) }
        },
        {
            $unwind: '$appointments'
        },
        {
            $project:
            {
                _id: 0,
                date: '$appointments.date',
                time: '$appointments.time',
                doctorsid: '$appointments.doctorsid',
                patientname: '$appointments.patientname',
                treattype: '$appointments.treattype',
                doctorname: '$appointments.doctorname',
                status: '$appointments.status',
                rating: '$appointments.rating',
                summary: '$appointments.summary',
            }
        },
        {
            $sort: { date: -1, time: -1 }
        },
        {
            $limit: 25
        }
        ])
        .toArray());

});
app.post('/viewdoctorsAppointment', middleware.checkToken, async (req, res) => {
    res.json({
        data: await db.get().collection(collection.BOOKINGS)
            .aggregate([
                {
                    $match: { _id: ObjectID(req.body.doctorid) }
                },
                {
                    $unwind: '$appointments'
                },
                {

                    $match: { 'appointments.date': req.body.date, 'appointments.treattype': req.body.treattype }
                },
                // {
                //     $match: { 'payments.pay_id': ObjectID(req.body.pay_id) }
                //   },
                {
                    $project:
                    {
                        _id: 1,
                        date: '$appointments.date',
                        time: '$appointments.time',
                        treattype: '$appointments.treattype',
                    }
                },
                {
                    $sort: { date: 1, time: 1 }
                },
                // {
                //     $limit:20
                // }  
            ])
            .toArray()
    });

});
app.post('/viewDrprofile', middleware.checkToken, async (req, res) => {
    // console.log("hello")
    var result = await db.get()
        .collection(collection.DOCTORS).aggregate([
            {
                $match: { _id: ObjectID(req.body.drid) }
            },
            {
                $project: {
                    _id: '$_id',
                    name: '$name',
                    qualifications: '$qualifications',
                    specality: '$specality',
                    location: '$location',
                    address: '$address',
                    location: '$location',
                    experience: '$experience',
                    regNumber: '$regNumber'
                }
            }]).toArray();
    return res.json({ result: result[0] })

})
app.post('/viewDrFees', middleware.checkToken, async (req, res) => {
    //console.log("hello")
    var result = await db.get()
        .collection(collection.BOOKINGS).aggregate([
            {
                $match: { _id: ObjectID(req.body.drid) }
            },
            {
                $project: {
                    _id: '$_id',
                    doorStep: '$doorStep',
                    inClinic: '$inClinic',
                    onCall: '$onCall',
                    onVideo: '$onVideo',
                }
            }]).toArray();
    return res.json({ result: result[0] })

})
app.post('/viewdoctors', middleware.checkToken, async (req, res) => {
    res.json(await db.get().collection(collection.BOOKINGS)
        .aggregate([
            { $addFields: { firstElem: { $first: "$appointments" } } },
            {
                $project:
                {
                    _id: 1,
                    firstElem: "$firstElem"
                }
            },
            // {
            //     $limit:20
            // }  
        ])
        .toArray());

});
//// ***************List Data***************************///

app.get('/listofDepartment', middleware.checkToken, async function (req, res) {
    res.json(await db.get().collection(collection.LISTOFITEMS).find().project({ 'generaldepartments': 1, 'ayurvedicDepartment': 1, _id: 0 }).toArray())
});

app.get('/listofcities', async function (req, res) {
    // //console.log("hai")
    var result = await db.get().collection(collection.LISTOFITEMS).find().project({ cities: 1, _id: 0 }).toArray()
    res.json(result[0])
});


//// ***************List Data***************************///

// app.get('/hospitals', async function (req, res) {
//     res.send(await db.get().collection(collection.HOSPITAL_COLLECTION).find().project({ Name: 1, _id: 1, phone: 1, address: 1 ,location:1,image: 1 }).toArray())
// });
app.post('/hospitalsimage', middleware.checkToken, async function (req, res) {
    res.json(await db.get().collection(collection.HOSPITAL_COLLECTION).find({ _id: ObjectID(req.body.id) }).project({ _id: 0, image: 1 }).toArray())
});
app.post('/hospitals', middleware.checkToken, async function (req, res) {
    var output = await db.get().collection(collection.HOSPITAL_COLLECTION).aggregate([
        {
            $geoNear: {
                // near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                distanceField: "distance",
                maxDistance: 20000,
                // query: { category: "Parks" },
                // includeLocs: "dist.location",
                spherical: true
            }
        },
        {
            $match: {

                status: "Active",

            },
        },
        { $sample: { size: 25 } }
    ]).project({ image: 0 }).toArray()
    res.send(output)
});

app.post('/ambulanceimage', middleware.checkToken, async function (req, res) {
    res.json(await db.get().collection(collection.AMBULANCE_COLLECTION).find({ _id: ObjectID(req.body.id) }).project({ _id: 0, image: 1 }).toArray())
});
app.post('/ambulance', middleware.checkToken, async function (req, res) {
    res.send(await db.get().collection(collection.AMBULANCE_COLLECTION).aggregate([
        {
            $geoNear: {
                // near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                distanceField: "distance",
                maxDistance: 20000,
                // query: { category: "Parks" },
                // includeLocs: "dist.location",
                spherical: true
            }
        },
        {
            $match: {

                status: "Active",

            },
        },
        { $sample: { size: 25 } }
    ]).project({ image: 0 }).toArray())
});

app.post('/nurseimage', middleware.checkToken, async function (req, res) {
    res.json(await db.get().collection(collection.NURSE_COLLECTION).find({ _id: ObjectID(req.body.id) }).project({ _id: 0, image: 1 }).toArray())
});
app.post('/nurce', middleware.checkToken, async function (req, res) {
    res.send(await db.get().collection(collection.NURSE_COLLECTION).aggregate([
        {
            $geoNear: {
                // near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                distanceField: "distance",
                maxDistance: 20000,
                // query: { category: "Parks" },
                // includeLocs: "dist.location",
                spherical: true
            }
        },
        {
            $match: {

                status: "Active",

            },
        },
        { $sample: { size: 15 } }
    ]).project({ image: 0 }).toArray())
});
app.post('/labimage', middleware.checkToken, async function (req, res) {
    res.json(await db.get().collection(collection.LABS_COLLECTION).find({ _id: ObjectID(req.body.id) }).project({ _id: 0, image: 1 }).toArray())
});
app.post('/lab', middleware.checkToken, async function (req, res) {
    res.send(await db.get().collection(collection.LABS_COLLECTION).aggregate([
        {
            $geoNear: {
                // near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                distanceField: "distance",
                maxDistance: 20000,
                // query: { category: "Parks" },
                // includeLocs: "dist.location",
                spherical: true
            }
        },
        {
            $match: {

                status: "Active",

            },
        },
        { $sample: { size: 15 } }
    ]).project({ image: 0 }).toArray())
});
app.post('/pharmacyimage', middleware.checkToken, async function (req, res) {
    res.json(await db.get().collection(collection.PHARMACY_COLLECTION).find({ _id: ObjectID(req.body.id) }).project({ _id: 0, image: 1 }).toArray())
});
app.post('/pharmacy', middleware.checkToken, async function (req, res) {
    res.send(await db.get().collection(collection.PHARMACY_COLLECTION).aggregate([
        {
            $geoNear: {
                // near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                distanceField: "distance",
                maxDistance: 20000,
                // query: { category: "Parks" },
                // includeLocs: "dist.location",
                spherical: true
            }
        },
        {
            $match: {

                status: "Active",

            },
        },
        { $sample: { size: 15 } }
    ]).project({ image: 0 }).toArray())
});
app.post('/productimage', middleware.checkToken, async function (req, res) {
    res.json(await db.get().collection(collection.PRODUCT_COLLECTION).find({ _id: ObjectID(req.body.id) }).project({ _id: 0, image: 1 }).toArray())
});
app.get('/product', middleware.checkToken, async function (req, res) {
    res.send(await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
        { $sample: { size: 15 } }
    ]).project({ image: 0 }).toArray())
});
// app.get('/crone', async function (req, res) {
//     var date = new Date();
//     var dates = date.getDate().toString().padStart(2, '0') + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getFullYear();
//     var time = date.getHours().toString().padStart(2, '0') + (date.getMinutes() + 1).toString().padStart(2, '0');
//     //console.log(dates);
//     var result =
//         db.get().collection(collection.BOOKINGS).find().forEach(i => {
//             db.get().collection(collection.BOOKINGS).updateOne(
//                 {
//                     _id: ObjectID(i._id)
//                 },
//                 {
//                     $pull: { appointments: { date: dates }, appointments: { time: { $lte: time } } }
//                 },
//             )
//         })
//     //console.log(result[0])
//     res.json(result)
// });
// app.get('/crone', async function (req, res) {
//     var doctorResult =
//         await db.get().collection(collection.DOCTORS).find(
//             {
//                 subEnddate: {
//                     $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//                     $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
//                 },
//                 status: "active"
//             }
//         ).project({ name: 1, phone: 1, subEnddate: 1 }).toArray()
//     // res.send(doctorResult)
//     var hospiatlResult =
//         await db.get().collection(collection.HOSPITAL_COLLECTION).find(
//             {
//                 subEnddate: {
//                     $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//                     $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
//                 },
//                 status: "Active"

//             }
//         ).project({ Name: 1, phone: 1, subEnddate: 1 }).toArray()
//     // console.log(hospiatlResult)
//     var nurseresult =
//         await db.get().collection(collection.NURSE_COLLECTION).find(
//             {
//                 subEnddate: {
//                     $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//                     $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
//                 },
//                 status: "Active"

//             }
//         ).project({ Name: 1, phone: 1, subEnddate: 1 }).toArray()
//     var labsresult =
//         await db.get().collection(collection.LABS_COLLECTION).find(
//             {
//                 subEnddate: {
//                     $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//                     $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
//                 },
//                 status: "Active"

//             }
//         ).project({ Name: 1, phone: 1, subEnddate: 1 }).toArray()
//     var pharmacyresult =
//         await db.get().collection(collection.PHARMACY_COLLECTION).find(
//             {
//                 subEnddate: {
//                     $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//                     $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
//                 },
//                 status: "Active"

//             }
//         ).project({ Name: 1, phone: 1, subEnddate: 1 }).toArray()
//     var ambulanceResult =
//         await db.get().collection(collection.AMBULANCE_COLLECTION).find(
//             {
//                 subEnddate: {
//                     $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//                     $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
//                 },
//                 status: "Active"

//             }
//         ).project({ Name: 1, phone: 1, subEnddate: 1 }).toArray()
//     await db.get().collection(collection.EXPIRING_COLLECTION).updateOne(
//         {

//         },
//         {
//             $set: {
//                 doctors: doctorResult,
//                 hospital: hospiatlResult,
//                 nurse: nurseresult,
//                 lab: labsresult,
//                 pharmacy: pharmacyresult,
//                 ambulance: ambulanceResult
//             },
//         }

//     )
// });
// app.get('/refundGenerate', async function (req, res) {
//     const refund = razorpay.payments.refund('pay_LS4C8HbgpJbAvi', {
//         amount: 20000
//     }, (error, refund) => {
//         if (error) {
//             console.log("Hello")
//             console.error(error);
//         } else {
//             console.log(refund);
//         }
//     });

//     // const refund = await razorpay.payments.refund('pay_LS4C8HbgpJbAvi', {
//     //     amount: 180, // amount in paise
//     //     speed: 'optimum',
//     // }) .catch((error) => {
//     //     console.log(error)
//     //     return res.status(500).json({ msg: "Error to process... Try once more" });
//     // });
//     res.json(refund)
// })
// app.get('/capturePayment', async function (req, res) {
//     const paymentId = 'pay_LS9LOblpZV3j5b';
//     const amountInPaise = 20000;
//     // razorpay.payments.capture(paymentId, {
//     //     amount: amountInPaise // amount to be captured, in paisa
//     // }, (error, payment) => {
//     //     if (error) {
//     //         console.error(error);
//     //         res.json(error)
//     //     } else {
//     //         console.log(payment);
//     //         res.json(payment)
//     //     }
//     // });
//     razorpay.payments.capture(paymentId, parseInt(amountInPaise))
//         .then(function (response) {
//             res.send(response);
//         })
//         .catch(function (err) {
//             console.error(err);
//             res.status(500).send(err);
//         });

// })
module.exports = app;
