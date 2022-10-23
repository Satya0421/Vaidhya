const express = require("express");
const app = express();
app.use(express.json());
var db = require('../config/connection');
var collection = require("../config/collections")
const config = require("../jwtconfig");
const jwt = require("jsonwebtoken");
require('dotenv').config();
let middleware = require("../middleware");
const bcrypt = require('bcrypt');
const ObjectID = require("mongodb").ObjectID

app.post("/login", async (req, res) => {
    // var date_ob = new Date().toString();
    // console.log(date_ob.substring(11,15)+'-')
    // console.log(date_ob.getMonth())
    // console.log(date_ob.toDateString())
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
                            let token = await jwt.sign({ username: req.body.username, _id: user._id }, config.key);
                            res.json({
                                token: token,
                                msg: "sucess"
                            })

                        } else {
                            return res.status(500).json({ msg: "username or password  incorrect" });
                        }
                    })
                }

            }
        });
});
app.post('/register', async (req, res) => {
    await db.get()
        .collection(collection.USERS).findOne({ $or: [{ phone: req.body.phone }, { username: req.body.email }] }, async (err, result) => {
            if (err) {
                console.log(err)
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
                            //   code: num,
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
app.post('/bookAppointment', middleware.checkToken, async (req, res) => {
    await db.get().collection(collection.BOOKINGS).updateOne(
        {
            _id: ObjectID(req.body.doctorid)
        },
        {
            $pull: { appointments: { time: req.body.time, date: req.body.date } }
        }

    ).then(async (result, err) => {
        // /console.log(result)
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
                            phone:req.body.phone  
                        },
                    }
                },
                { upsert: true }
            ).then(async (result, err) => {
                console.log(result)
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
                        console.log(result)
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
    await db.get().collection(collection.BOOKINGS).updateOne(
        {
            _id: ObjectID(req.body.doctorid)
        },
        {
            $push: { appointments: { time: req.body.time, date: req.body.date } }
        }

    ).then(async (result, err) => {
        // console.log(result)
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
                // console.log(result)
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
                                    {
                                        $inc: { balance: - req.body.fee }
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
            $limit: 2
        }
        ])
        .toArray());

});
app.post('/viewdoctorsAppointment', middleware.checkToken, async (req, res) => {
    res.json(await db.get().collection(collection.BOOKINGS)
        .aggregate([
            {
                $match: { _id: ObjectID(req.body.doctorid) }
            },
            {
                $unwind: '$appointments'
            },
            {

                $match: { 'appointments.date':  req.body.date  }
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
                }
            },
            {
                $sort: { date: 1, time: 1 }
            },
            // {
            //     $limit:20
            // }  
        ])
        .toArray());

});
app.post('/viewdoctors', middleware.checkToken, async (req, res) => {
    res.json(await db.get().collection(collection.BOOKINGS)
        .aggregate([
           
            {$addFields:{ firstElem: { $first: "$appointments" } }},

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
app.get('/listofDepartment', middleware.checkToken, async function (req, res) {
    res.json(await db.get().collection(collection.LISTOFITEMS).find().sort({ 'departments': -1 }).project({ 'departments': 1, _id: 0 }).toArray())
});

module.exports = app;
