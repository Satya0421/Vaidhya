const express = require("express");
const app = express();
app.use(express.json());
var db = require('../config/connection');
var collection = require("../config/collections")
const config = require("../jwtconfig");
const jwt = require("jsonwebtoken");
require('dotenv').config();
let middleware = require("../middleware");
const bcrypt = require('bcryptjs');
const ObjectID = require("mongodb").ObjectID

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

                // var num = await crypto.randomBytes(Math.ceil(6)).toString('hex').slice(0, 6);
                var pass = await bcrypt.hash(req.body.password, 08);
                await db.get()
                    .collection(collection.USERS)
                    .insertOne(
                        {
                            password: pass,
                            name: req.body.name,
                            phone: req.body.phone,
                            username: req.body.email,
                            gender: req.body.gender,
                            code: 1234,
                            dob: req.body.dob,
                            status: "inactive"
                        }
                    )
                    .then((result) => {
                        if (result.acknowledged) {
                            return res.status(200).json({ _id: result.insertedId })
                        }
                        else {
                            return res.status(500).json({ msg: "Error to process... Try once more" });
                        }
                    })
                    .catch(() => {
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
app.post('/forget_password', async (req, res) => {
    // var num = await crypto.randomBytes(Math.ceil(6)).toString('hex').slice(0, 6);
    //console.log(req.body)
    var num = 1234
    await db.get()
        .collection(collection.USERS)
        .findOneAndUpdate(
            { username: req.body.username },
            {
                $set: {
                    code: num
                },
            },
            (err, profile) => {
                if (profile.value == null) {
                    return res.status(403).json({ msg: "The email is not registred yet" });
                }
                if (err) {
                    return res.status(500).json({ msg: "Error to process...Try once more" });
                }
                //  fast2sms.sendMessage({authorization : process.env.API_KEY , message : 'Greetings From Pilasa .  One time code to reset your password is ' + num  ,  numbers : [parseInt(profile.value.phone)]})
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
    req.body.password = await bcrypt.hash(req.body.password, 08);
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
    // var date_ob = new Date().toString();
    // //console.log(date_ob.substring(11,15)+'-')
    // //console.log(date_ob.getMonth())
    // //console.log(date_ob.toDateString())
    await db.get()
        .collection(collection.USERS)
        .findOne({ username: req.body.username }, async (err, user) => {
            if (user == null) {
                res.status(500).json({ msg: "username does not exist" })
            }
            else {
                if (user) {
                    await bcrypt.compare(req.body.password, user.password).then(async (status) => {
                        if (user.lvl == "2" && user.status == "active") {
                            let token = await jwt.sign({ username: req.body.username, _id: user._id }, config.key);
                            res.json({
                                token: token,
                                msg: "sucess"
                            })

                        } else {
                            return res.status(403).json({ status: user.status, lvl: user.lvl, _id: user._id, phone: user.phone, msg: "username or password  incorrect" });
                        }
                    })
                }

            }
        });
});
app.get('/dashboard', middleware.checkToken, async (req, res) => {
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
app.post('/change-password', middleware.checkToken, async (req, res) => {
    await db.get()
        .collection(collection.USERS)
        .findOne({ _id: ObjectID(req.decoded._id) }, async (err, user) => {
            if (user) {
                await bcrypt.compare(req.body.currpassword, user.password).then(async (status) => {
                    if (status) {
                        req.body.newpassword = await bcrypt.hash(req.body.newpassword, 08);
                        await db.get()
                            .collection(collection.USERS)
                            .updateOne(
                                { _id: ObjectID(req.decoded._id) },
                                {
                                    $set: {
                                        password: req.body.newpassword
                                    },
                                }, (err, result) => {
                                    if (err) return res.status(500).json({ msg: "Error to process...Try once more" });
                                    if (result.modifiedCount == 1) {
                                        return res.status(200).json({ msg: "Password Updated Successfully" });
                                    } else {
                                        return res.status(500).json({ msg: "Request failed" });
                                    }
                                },
                            )
                    }
                    else {
                        return res.status(403).json({ msg: "Wrong Password" });
                    }
                })
            }
        })

});
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
    var index = 0;
    //console.log(req.body)
    var result2 = await db.get().collection(collection.BOOKINGS).aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [req.body.lat, req.body.lng] },
                distanceField: "dist.calculated",
                minDistance: 2,
                // maxDistance:10,
                // query: { category: "Parks" },
                includeLocs: "dist.location",
                spherical: true
            }
        },
        {
            $match: {
                $and: [{ department: req.body.department },
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
            }
        },

    ]).limit(25).toArray()
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
    res.json(result2);
});


//// ***************Appointment***************************///
app.post('/bookAppointment', middleware.checkToken, async (req, res) => {
    await db.get().collection(collection.BOOKINGS).updateOne(
        {
            _id: ObjectID(req.body.doctorid)
        },
        {
            $pull: { appointments: { time: req.body.time, date: req.body.date } }
        }

    ).then(async (result, err) => {
        // ///console.log(result)
        if (err)
            return res.status(500).json({ msg: "Error to process...Try once more" });
        if (result.modifiedCount == 1) {
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
                            phone: req.body.phone
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
                                    status: "active"
                                },
                            }
                        }
                    ).then(async (result, err) => {
                        //console.log(result)
                        if (result.modifiedCount == 1) {
                            await db.get()
                                .collection(collection.DOCTORSPAYMENT)
                                .updateOne({
                                    _id: ObjectID(req.body.doctorid),
                                },
                                    {
                                        $inc: { balance: req.body.fee }
                                    },
                                )
                                .then((result) => {
                                    if (result.modifiedCount == 1) {
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
        }
        else {
            return res.status(500).json({ msg: "Error to process...Try once more" });
        }
    });
});

app.post('/cancelAppointment', middleware.checkToken, async (req, res) => {
    var fees=0;
 var result=   await db.get().collection(req.body.date.substring(3)).aggregate([
        {
            $match: {_id: ObjectID(req.body.doctorid)},
        },
        {
            $unwind: '$appointments'
        },
        {
            $match: { 'appointments.date': req.body.date,'appointments.time': req.body.time }
        }, ]   
    ).toArray();
    fees=result[0].appointments.fees;
    await db.get().collection(collection.BOOKINGS).updateOne(
        {
            _id: ObjectID(req.body.doctorid)
        },
        {
            $push: { appointments: { time: req.body.time, date: req.body.date } }
        }

    ).then(async (result, err) => {
        // //console.log(result)
        if (err)
            return res.status(500).json({ msg: "Error to process...Try once more" });
        if (result.modifiedCount == 1) {
            await db.get().collection(req.body.date.substring(3)).updateOne(
                {
                    _id: ObjectID(req.body.doctorid)
                },
                {
                    $set: { "appointments.$[inds].status": "cancelled" }
                },
                {
                    "arrayFilters": [{ "inds.date": req.body.date, "inds.time": req.body.time }]
                },
            ).then(async (result, err) => {
                // //console.log(result)
                if (result.modifiedCount == 1) {
                    await db.get().collection(collection.USERSAPPOINTMENT).updateOne({ _id: ObjectID(req.decoded._id) },
                        {
                            $set: { "appointments.$[inds].status": "cancelled" }
                        },
                        {
                            "arrayFilters": [{ "inds.date": req.body.date, "inds.time": req.body.time }]
                        },
                    ).then(async (result, err) => {
                        if (result.modifiedCount == 1) {
                            await db.get()
                                .collection(collection.DOCTORSPAYMENT)
                                .updateOne({
                                    _id: ObjectID(req.body.doctorid),
                                },
                                    // {
                                    //     $inc: { balance: - req.body.fee }
                                    // },
                                    {
                                        $inc: { balance: - fees }
                                    },
                                )
                                .then((result) => {
                                    if (result.modifiedCount == 1) {
                                        return res.status(200).json({ msg: "Appointment Cancelled successful" });
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
        }
        else {
            return res.status(500).json({ msg: "Error to process...Try once more" });
        }
    });
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
                status: '$appointments.status'
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
    //console.log("hello")
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
                    googlelocation: '$googlelocation',
                    address: '$address',
                    // location: '$location',
                    experience: '$experience'
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
    res.json(await db.get().collection(collection.LISTOFITEMS).find().sort({ 'departments': -1 }).project({ 'departments': 1, _id: 0 }).toArray())
});
app.get('/listofcities', async function (req, res) {
    // //console.log("hai")
    var result = await db.get().collection(collection.LISTOFITEMS).find().project({ cities: 1, _id: 0 }).toArray()
    res.json(result[0])
});

app.get('/crone', async function (req, res) {
    var date = new Date();
    var dates = date.getDate().toString().padStart(2, '0') + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getFullYear();
    var time = date.getHours().toString().padStart(2, '0') + (date.getMinutes() + 1).toString().padStart(2, '0');
    //console.log(dates);
    var result =
        db.get().collection(collection.BOOKINGS).find().forEach(i => {
            db.get().collection(collection.BOOKINGS).updateOne(
                {
                    _id: ObjectID(i._id)
                },
                {
                    $pull: { appointments: { date: dates }, appointments: { time: { $lte: time } } }
                },
            )
        })
    //console.log(result[0])
    res.json(result)
});
module.exports = app;
