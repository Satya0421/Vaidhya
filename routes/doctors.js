const express = require("express");
const app = express();
app.use(express.json());
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
const { Collection } = require("mongodb");
const cron = require("node-cron");
// const sharp = require("sharp");
// const upload = multer({ dest: "uploads/" });
const fast2sms = require('fast-two-sms');
const ObjectID = require("mongodb").ObjectID
var body_parser = require('body-parser');
app.use(body_parser.urlencoded({ extended: false }));
var multer = require('multer');
const upload = multer();
//// ***************Registration***************************///
app.post('/register1', async (req, res) => {
  // //console.log(req.body)
  var resu = false;
  await db.get()
    .collection(collection.DOCTORS).findOne({ $or: [{ phone: req.body.phone }, { username: req.body.email }] }, async (err, result) => {
      if (err) {
        // //console.log(err)
        return res.status(500).json({ msg: "Error to process... Try once more" });
      }
      if (result) {
        return res.status(403).json({ msg: "User Already exist" });
      }
      else {
        var pass = await bcrypt.hash(req.body.password, 08);
       
        var j = 0
        start:
        while (1) {
          var code = Math.floor(1000 + Math.random() * 9000)
          let num = req.body.name.substring(0, req.body.name.indexOf(' '))+code;
          // for (let i = 0; i < 8; i++) {
          //   const randomIndex = Math.floor(Math.random() * chars.length);
          //   num += chars[randomIndex];
          // }
          await db.get()
            .collection(collection.DOCTORS)
            .insertOne(
              {
                password: pass,
                name: req.body.name,
                phone: req.body.phone,
                username: req.body.email,
                lvl: "1",
                code: code,
                status: "inactive",
                referId: num,
                location: {
                  type: "Point",
                  coordinates: [
                    parseFloat(req.body.longtitude),
                    parseFloat(req.body.latitude),
                  ]
                }
              }
            )
            .then((result) => {
              console.log(result)
              if (result.acknowledged) {
                fast2sms.sendMessage({ authorization: process.env.API_KEY, message: 'Welcome To Vaidhya Mobile Application .\n  your code is :' + code + "\n ", numbers: [parseInt(req.body.phone)] })
                return res.status(200).json({ _id: result.insertedId })
              }
            })
            .catch(() => {
              resu = true;
            });
          if (resu) {
            if (j != 2) {
              j++;
              continue  start;
            }
            else
              return res.status(500).json({ msg: "Error to process... Try once more" });
          }
          else {
            break start;
          }
        }
      }
    });
})
app.post("/verifyPhone", async (req, res) => {
  //console.log(req.body)
  await db.get()
    .collection(collection.DOCTORS)
    .updateOne(
      { $and: [{ _id: ObjectID(req.body._id) }, { code: req.body.code }] },
      {
        $set: {
          lvl: "2",
         code: 0
        },
      }, (err, result) => {
        if (err) return res.status(500).json({ msg: "Error to process...Try once more" });

        if (result.modifiedCount == 1) {
          return res.status(200).json({ msg: "Suceessfully verified" });
        } else {
          return res.status(500).json({ msg: "code not match" });
        }
      },
    );
});
app.post('/resendCode', async (req, res) => {
  await db.get()
    .collection(collection.DOCTORS)
    .findOne(
      {  _id: ObjectID(req.body._id) },
      async (err, profile) => {
         fast2sms.sendMessage({authorization : process.env.API_KEY , message : ' One time Verification Code is :' + profile.code  + "\n ",  numbers : [parseInt(profile.phone)]})    
         return res.status(200).json()
      },
    )
});
app.post('/register2', async (req, res) => {
  //console.log(req.body)
  await db.get()
    .collection(collection.DOCTORS)
    .updateOne(
      { _id: ObjectID(req.body._id) },
      {
        $set:
        {
          lvl: "3",
          qualifications: req.body.qualifications,
          specality: req.body.specality,
          gender: req.body.gender,
          city: req.body.city,
          googlelocation: req.body.googlelocation,
          experience: req.body.experience,
          address: req.body.address,
          dob: req.body.dob,
          area: req.body.area
        }
      }
    )
    .then((result, err) => {
      if (result.modifiedCount == 1) {
        return res.status(200).json({ msg: "Successfull" });
      }
      if (err)
        res.status(500).json({ msg: "Error to process...Try once more" });
    })
    .catch(() => {
      return res.status(500).json({ msg: "Error to process... Try once more" });
    });
})
app.post('/register3', async (req, res) => {
  await db.get()
    .collection(collection.DOCTORS)
    .updateOne(
      { _id: ObjectID(req.body._id) },
      {
        $set:
        {
          lvl: "4",
          regNumber: req.body.regNumber,
          regCouncil: req.body.regCouncil,
          regYear: req.body.regYear,
          idproff: req.body.idproff,
          education: req.body.education
        }
      }
    )
    .then((result, err) => {
      if (result.modifiedCount == 1) {
        return res.status(200).json({ msg: "suceessful" });
      }
      if (err)
        res.status(500).json({ msg: "Error to process...Try once more" });
    })
    .catch(() => {
      return res.status(500).json({ msg: "Error to process... Try once more" });
    });
})

app.patch("/upload_profile_image/:_id", async (req, res) => {
  let image = req.files.img
  image.mv('./uploads/DoctorsImage/' + req.params._id + ".jpg")
  return res.status(200).json();
});
app.post("/upload_DoctorsIdProof/:_id", async (req, res) => {

  let image = req.files.img
  image.mv('./uploads/DoctorsIdProof/' + req.params._id + ".jpg")
  return res.status(200).json();
});
app.patch("/upload_EducationCertificate/:_id", async (req, res) => {

  let image = req.files.img
  image.mv('./uploads/EducationCertificate/' + req.params._id + ".jpg")
  return res.status(200).json();
});
app.patch("/upload_RegisterationCertificate/:_id", async (req, res) => {
  let image = req.files.img
  image.mv('./uploads/RegisterationCertificate/' + req.params._id + ".jpg")
  return res.status(200).json();
});
app.post('/forget_password', async (req, res) => {
   let num = req.body.name.substring(0, req.body.name.indexOf(' '))+code;
  //console.log(req.body)
  
  await db.get()
    .collection(collection.DOCTORS)
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
        fast2sms.sendMessage({authorization : process.env.API_KEY , message : ' Greetings From Vaidhya .  One time code to reset your password is ' + num  + "\n ",  numbers : [parseInt(profile.phone)]})    
       
        return res.status(200).json({ _id: profile.value._id });
        // });
      },
    )
});
app.post("/verifyforgetpassword", async (req, res) => {
  //console.log(req.body)
  await db.get()
    .collection(collection.DOCTORS)
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
    .collection(collection.DOCTORS)
    .updateOne(
      { _id: ObjectID(req.body._id) },
      {
        $set: {
          password: req.body.password,
        },
      }, (err, result) => {
        if (err) return res.status(500).json({ msg: "Error to process...Try once more" });
        if (result.modifiedCount == 1) {
          return res.status(200).json({ msg: "Suceessfully Changed" });
        }
      },
    )
});

//// ***************Main Pages***************************///
app.post("/login", async (req, res) => {
  //console.log(req.body)
  await db.get()
    .collection(collection.DOCTORS)
    .findOne({ username: req.body.username }, async (err, user) => {
      if (user) {
        await bcrypt.compare(req.body.password, user.password).then(async (status) => {
          if (status) {
            if (user.lvl == "6" && user.status == "active") {

              let token = await jwt.sign({ username: req.params.username, _id: user._id }, config.key);
              //console.log(token)
              res.json({
                token: token,
                msg: "sucess",
                lvl: user.lvl,
                _id: user._id
              })

            }
            else if (user.lvl == "5") {
              return res.status(403).json({ status: user.status, msg: " Your verification is under proccess , You can enjoy Vidhya Soon" });
            }
            else {
              return res.status(403).json({ status: user.status, msg: "Account is on inactive state,Contact support ", lvl: user.lvl, _id: user._id, phone: user.phone, name: user.name });
            }
          }
          else {
            return res.status(500).json({ msg: "username or password  incorrect" });
          }
        })
      }
      else {
        return res.status(500).json({ msg: "username or password  incorrect" });
      }
    }
    );
});
app.post('/change-password', middleware.checkToken, async (req, res) => {
  await db.get()
    .collection(collection.DOCTORS)
    .findOne({ _id: ObjectID(req.decoded._id) }, async (err, user) => {
      if (user) {
        await bcrypt.compare(req.body.currpassword, user.password).then(async (status) => {
          if (status) {
            req.body.newpassword = await bcrypt.hash(req.body.newpassword, 08);
            await db.get()
              .collection(collection.DOCTORS)
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

// app.get('/dashboard', middleware.checkToken, async (req, res) => {
//   //console.log("hello")
//   var result = await db.get()
//     .collection(collection.DOCTORS).aggregate([
//       {
//         $match: { _id: ObjectID(req.decoded._id) }
//       },
//       {
//         $project: {
//           _id: '$_id',
//           name: '$name',
//           qualifications: '$qualifications',
//           specality: '$specality',
//           // googlelocation: '$googlelocation',
//           address: '$address',
//           location: '$location',
//           experience: '$experience',
//           referid: '$referId',
//           subEnddate: '$subEnddate'
//         }
//       }]).toArray();
//   return res.json(result[0])

// })

app.get('/dashboard', middleware.checkToken, async (req, res) => {
  res.json({
    data: await db.get().collection(collection.DOCTORS).aggregate([
      {
        $match: { _id: ObjectID(req.decoded._id) }
      },
      {
        $lookup: {
          from: collection.BOOKINGS,
          localField: '_id',
          foreignField: '_id',
          as: 'booking'
        }
      },
      {
        $unwind: '$booking'
      },
      {
        $project: {
          _id: '$_id',
          name: '$name',
          qualifications: '$qualifications',
          specality: '$specality',
          // googlelocation: '$googlelocation',
          address: '$address',
          location: '$location',
          experience: '$experience',
          referid: '$referId',
          regNumber: '$regNumber',
          subEnddate: '$subEnddate',
          rating: '$booking.rating',
          totalRating: '$booking.totalRating',
        }
      },
    ]).toArray()
  })
});
//// ***************Profile***************************///
app.post('/updateProfile', async (req, res) => {
  //console.log(req.body)
  await db.get()
    .collection(collection.DOCTORS)
    .updateOne(
      { _id: ObjectID(req.body._id) },
      {
        $set:
        {
          experience: req.body.experience,
          address: req.body.address,
        }
      }
    )
    .then((result, err) => {
      if (result.modifiedCount == 1) {
        return res.status(200).json({ msg: "Successfull" });
      }
      if (err)
        res.status(500).json({ msg: "Error to process...Try once more" });
    })
    .catch(() => {
      return res.status(500).json({ msg: "Error to process... Try once more" });
    });
})

app.get('/displayReviews', middleware.checkToken, async function (req, res, next) {
  // res.json( await db.get().collection(collection.DOCTORSREVIEW).findOne({_id: ObjectID(req.decoded._id)}, {review: {$slice: -2}}))
  var response = await db.get().collection(collection.DOCTORSREVIEW).aggregate(
    [
      {
        $match: { _id: ObjectID(req.decoded._id) }
      },
      { $project: { review: { $slice: ["$review", -75] }, _id: 0 } }
    ]).toArray()
  res.status(200).json(response[0]["review"])
});
//// ***************Daily  appointmnets ***************************///
app.post('/adddailyAppointment', middleware.checkToken, async function (req, res) {
  await db.get().collection(collection.DOCTORSDAILYSLOT).updateOne({ _id: ObjectID(req.decoded._id) },
    {
      $push: {
        appointments: {
          $each: req.body.appointments,
          $sort: { time: 1 },
          //  $slice: 3
        }
      }
    },
  ).then((result, err) => {
    if (result != null) {
      if (result.modifiedCount == 1) {
        return res.status(200).json({ msg: "Successfully inserted" });
      }
      else {
        return res.status(500).json({ msg: "Error to process...Try once more" });
      }
    }
  }).catch(() => {
    return res.status(500).json({ msg: "Error to process...Try once more" });
  });

});
app.post('/editdailyAppointment', middleware.checkToken, async (req, res) => {
  await db.get().collection(collection.DOCTORSDAILYSLOT).updateOne(
    {
      _id: ObjectID(req.decoded._id)
    },
    {
      $set: { 'appointments.$[inds].time': req.body.newTime, 'appointments.$[inds].treattype': req.body.newTreattype }
    },
    {
      "arrayFilters": [{ "inds.time": req.body.time, "inds.treattype": req.body.treattype }]
    },
  ).then((result, err) => {
    //console.log(result)
    if (result.modifiedCount == 1) {
      return res.status(200).json({ msg: "Successfully updated" });
    }
    else {
      return res.status(500).json({ msg: "Error to process...Try once more" });
    }

  }).catch(() => {
    return res.status(500).json({ msg: "Error to process...Try once more" });
  });
}
);
app.post('/canceldailyAppointment', middleware.checkToken, async (req, res) => {
  await db.get().collection(collection.DOCTORSDAILYSLOT).updateOne(
    {
      _id: ObjectID(req.decoded._id)
    },
    {
      $pull: { appointments: { time: req.body.time } }
    }

  ).then(async (result, err) => {
    if (err)
      return res.status(500).json({ msg: "Error to process...Try once more" });
    if (result.modifiedCount == 1) {
      return res.status(200).json({ msg: "Removed Successfully" })
    }
    return res.json()
  }).catch(() => {
    return res.status(500).json({ msg: "Error to process...Try once more" });
  });
});

app.post('/copydailyAppointments', middleware.checkToken, async (req, res) => {
  var result2 = await db.get().collection(collection.DOCTORSDAILYSLOT)
    .aggregate([
      {
        $match: { _id: ObjectID(req.decoded._id) }
      },
      {
        $addFields: {
          "appointments.date": req.body.date
        }
      },
    ]).toArray();
  console.log(result2)
  if (result2[0].appointments) {

    await db.get().collection(collection.BOOKINGS).updateOne({ _id: ObjectID(req.decoded._id) },
      {
        $pull: {
          appointments: { date: req.body.date }
        },
      }).then(async (result, err) => {
        if (err)
          return res.status(500).json({ msg: "Error to process...Try once more" });
        else {

          await db.get().collection(collection.BOOKINGS).updateOne({ _id: ObjectID(req.decoded._id) },
            {
              $push: {
                appointments: {
                  $each: result2[0].appointments,
                  $sort: { time: 1 },
                  //  $slice: 3
                }
              }
            },
          ).then((result, err) => {
            if (result != null) {
              if (result.modifiedCount == 1) {
                return res.status(200).json({ msg: "Successfully inserted" });
              }
              else {
                return res.status(500).json({ msg: "Error to process...Try once more" });
              }
            }
          }).catch(() => {
            return res.status(500).json({ msg: "Error to process...Try once more" });
          }).catch(() => {
            return res.status(500).json({ msg: "Error to process...Try once more" });
          });
        }
      })
  }
  else {
    return res.status(500).json({ msg: "Please Add Items to the Daily slot" });
  }
});
app.get('/findalldailyAppointments', middleware.checkToken, async function (req, res) {
  res.json({
    data: await db.get().collection(collection.DOCTORSDAILYSLOT).aggregate([
      {
        $match: { _id: ObjectID(req.decoded._id) }
      },
      {
        $unwind: '$appointments'
      },
      {
        $project: {
          _id: 0,
          treattype: '$appointments.treattype',
          time: '$appointments.time',
        }
      },
    ]).toArray()
  })
});
//// *************** appointmnets List***************************///

app.post('/findallCommingAppointments', middleware.checkToken, async function (req, res) {
  //console.log(req.body)
  var result1 = await db.get().collection(req.body.date.substring(3)).aggregate([
    {
      $match: { _id: ObjectID(req.decoded._id) }
    },
    {
      $unwind: '$appointments'
    },
    {
      $match: { 'appointments.date': req.body.date }
    },
    {
      $project: {
        _id: 0,
        date: '$appointments.date',
        time: '$appointments.time',
        patientname: '$appointments.patientname',
        patientid: '$appointments.patientid',
        treattype: '$appointments.treattype',
        phone: '$appointments.phone',
        fees: '$appointments.fees',
        status: '$appointments.status',
        summary: '$appointments.summary'
      }
    },
  ]).sort({ 'appointments.time': -1 }).toArray()
  //console.log(result1)
  var result2 = await db.get().collection(collection.BOOKINGS).aggregate([
    {
      $match: { _id: ObjectID(req.decoded._id) }
    },
    {
      $unwind: '$appointments'
    },
    {
      $match: { 'appointments.date': req.body.date }
    },
    {
      $project: {
        _id: 0,
        date: '$appointments.date',
        time: '$appointments.time',
        treattype: '$appointments.treattype',
      }
    },
  ]).toArray()
  res.json({ booked: result1, nonBooked: result2 })


});
app.post('/findallpastAppointments', middleware.checkToken, async function (req, res) {
  res.json(await db.get().collection(req.body.date.substring(3)).aggregate([
    {
      $match: { _id: ObjectID(req.decoded._id) }
    },
    {
      $unwind: '$appointments'
    },
    {
      $match: { 'appointments.date': req.body.date }
    },
    {
      $project: {
        _id: 0,
        date: '$appointments.date',
        time: '$appointments.time',
        patientname: '$appointments.patientname',
        treattype: '$appointments.treattype',
        phone: '$appointments.phone',
        patientid: '$appointments.patientid',
        fees: '$appointments.fees',
        status: '$appointments.status',
        summary: '$appointments.summary'
      }
    },
  ]).sort({ 'appointments.time': -1 }).toArray())
});
app.post('/addAppointment', middleware.checkToken, async function (req, res) {
  await db.get().collection(collection.BOOKINGS).updateOne({ _id: ObjectID(req.decoded._id) },
    {
      $push: {
        appointments: {
          $each: req.body.appointments,
          $sort: { date: 1, time: 1 },
          //  $slice: 3
        }
      }
    },

  ).then((result, err) => {
    if (result != null) {
      if (result.modifiedCount == 1) {
        return res.status(200).json({ msg: "Successfully inserted" });
      }
      else {
        return res.status(500).json({ msg: "Error to process...Try once more" });
      }
    }
  }).catch(() => {
    return res.status(500).json({ msg: "Error to process...Try once more" });
  });

});

app.post('/editAppointment', middleware.checkToken, async (req, res) => {
  await db.get().collection(collection.BOOKINGS).updateOne(
    {
      _id: ObjectID(req.decoded._id)
    },
    {
      $set: { 'appointments.$[inds].time': req.body.newTime }
    },
    {
      "arrayFilters": [{ "inds.date": req.body.date, "inds.time": req.body.time }]
    },
  ).then((result, err) => {
    //console.log(result)
    if (result.modifiedCount == 1) {
      return res.status(200).json({ msg: "Successfully updated" });
    }
    else {
      return res.status(500).json({ msg: "Error to process...Try once more" });
    }

  }).catch(() => {
    return res.status(500).json({ msg: "Error to process...Try once more" });
  });
}
);

app.post('/cancelAppointment', middleware.checkToken, async (req, res) => {
  await db.get().collection(collection.BOOKINGS).updateOne(
    {
      _id: ObjectID(req.decoded._id)
    },
    {
      $pull: { appointments: { time: req.body.time, date: req.body.date } }
    }

  ).then(async (result, err) => {
    if (err)
      return res.status(500).json({ msg: "Error to process...Try once more" });
    if (result.modifiedCount == 1) {
      return res.status(200).json({ msg: "Cancelled Successfully" })
    }
    return res.json()
  }).catch(() => {
    return res.status(500).json({ msg: "Error to process...Try once more" });
  });
});
app.post('/cancelBookedAppointment', middleware.checkToken, async (req, res) => {
  await db.get().collection(req.body.date.substring(3)).updateOne(
    {
      _id: ObjectID(req.decoded._id)
    },
    {
      $set: { "appointments.$[inds].status": "cancelled" }
    },
    {
      "arrayFilters": [{ "inds.date": req.body.date, "inds.time": req.body.time }]
    },
  ).then(async (result, err) => {
    if (result.modifiedCount == 1) {
      await db.get().collection(collection.USERSAPPOINTMENT).updateOne({ _id: ObjectID(req.body.patientid) },
        {
          $set: { "appointments.$[inds].status": "cancelled" }
        },
        {
          "arrayFilters": [{ "inds.date": req.body.date, "inds.time": req.body.time }]
        },
      ).then(async (result, err) => {
        if (result.modifiedCount == 1) {
          await db.get()
            .collection(collection.BOOKINGS)
            .updateOne({
              _id: ObjectID(req.decoded._id),
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
          // return res.status(200).json({ msg: "Appointment cancelled successful" });
        } else
          return res.status(500).json({ msg: "Error to process...Try once more" });
      })
    }
    else
      return res.status(500).json({ msg: "Error to process...Try once more" });
  })

    .catch(() => {
      return res.status(500).json({ msg: "Error to process...Try once more" });
    })
});
app.post('/cancelAllAppointment', middleware.checkToken, async (req, res) => {

  await db.get().collection(req.body.date.substring(3)).findOneAndUpdate(
    {
      _id: ObjectID(req.decoded._id),
      //  appointments:{treattype: "1"}
    },
    {
      $set: { "appointments.$[inds].status": "cancelled" }
    },
    {
      "arrayFilters": [{ "inds.date": req.body.date }]
    },
  ).then(async (result, err) => {
    // console.log(result.value)
    if (result.value.appointments.length > 0) {
      await db.get().collection(collection.USERSAPPOINTMENT).updateMany({},
        {
          $set: { "appointments.$[inds].status": "cancelled" }
        },
        {
          "arrayFilters": [{ "inds.date": req.body.date, "inds.doctorsid": ObjectID(req.decoded._id) }]
        },
      )
    }
    db.get().collection(collection.BOOKINGS).updateOne(
      {
        _id: ObjectID(req.decoded._id)
      },
      {
        $pull: { appointments: { date: req.body.date } },
        $inc: { balance: - req.body.fee }
      }
    )
      .then((result) => {

        return res.status(200).json({ msg: "Appointment Cancelled successful" });

      })
  })
});
app.post('/cancelAllUnBookedAppointmnets', middleware.checkToken, async (req, res) => {
  //console.log("hello2")
  await db.get().collection(collection.BOOKINGS).updateOne(
    {
      _id: ObjectID(req.decoded._id)
    },
    {
      $pull: { appointments: { date: req.body.date } }
    }

  ).then(async (result, err) => {
    if (err)
      return res.status(500).json({ msg: "Error to process...Try once more" });
    if (result.modifiedCount == 1) {
      return res.status(200).json({ msg: "Appointment Cancelled successful" });
    }
  })
});

//// ***************Summary***************************///
app.post('/addSummary', middleware.checkToken, async (req, res) => {
  await db.get().collection(collection.USERSAPPOINTMENT).updateOne(
    {
      _id: ObjectID(req.body.patientid)
    },
    {
      $set: { 'appointments.$[inds].summary': req.body.summary }
    },
    {
      "arrayFilters": [{ "inds.date": req.body.date, "inds.time": req.body.time }]
    },
  ).then((result, err) => {
    //console.log(result)
    if (result.modifiedCount == 1) {
      db.get().collection(req.body.date.substring(3)).updateOne(
        {
          _id: ObjectID(req.decoded._id)
        },
        {
          $set: { 'appointments.$[inds].summary': true }
        },
        {
          "arrayFilters": [{ "inds.date": req.body.date, "inds.time": req.body.time }]
        },
      )
      return res.status(200).json({ msg: "Successfully updated" });
    }
    else {
      return res.status(500).json({ msg: "Error to process...Try once more" });
    }

  }).catch(() => {
    return res.status(500).json({ msg: "Error to process...Try once more" });
  });
}
);

app.post('/displaySummary', middleware.checkToken, async (req, res) => {
  var result1 = await db.get().collection(collection.USERSAPPOINTMENT).aggregate([
    {
      $match: { _id: ObjectID(req.body.patientid) }
    },
    {
      $unwind: '$appointments'
    },
    {
      $match: { 'appointments.date': req.body.date, 'appointments.time': req.body.time }
    },
    {
      $project: {
        _id: 0,
        summary: '$appointments.summary',

      }
    },
  ]).toArray()
  res.json(result1[0])
}
);


//// ***************Data List***************************///
app.get('/listofDepartment', async function (req, res) {
  res.json(await db.get().collection(collection.LISTOFITEMS).find().project({ 'generaldepartments': 1,'ayurvedicDepartment': 1, _id: 0 }).toArray())
});

app.get('/listofcities', async function (req, res) {
  //console.log("hai")
  var result = await db.get().collection(collection.LISTOFITEMS).aggregate([
    {
      $unwind: '$cities'
    },
    {
      $project: {
        _id: 0,
        city: '$cities.city',
      }
    },
    // {
    //   $unwind: '$cities'
    // },
  ]).toArray()
  let resultarray = result.map(a => a.city);
  res.json(resultarray)
});

//// ***************Consulting Fee***************************///
app.post('/updateConsultingFee', middleware.checkToken, async (req, res) => {
  //console.log(req.body)
  await db.get().collection(collection.BOOKINGS).updateOne(
    { _id: ObjectID(req.decoded._id) },
    {
      $set:
      {
        inClinic: req.body.inClinic,
        onCall: req.body.onCall,
        onVideo: req.body.onVideo,
        doorStep: req.body.doorStep,
      },
      $pull: {
        appointments: { treattype: { "$in": [req.body.doorStepStatus, req.body.onVideoStatus, req.body.onCallStatus, req.body.inClinicStatus] } },
      },
    }).then(async (result) => {
      if (result.modifiedCount == 1) {
        db.get().collection(collection.DOCTORSDAILYSLOT).updateOne(
          {
            _id: ObjectID(req.decoded._id)
          },

          {
            $pull: {
              appointments: { treattype: { "$in": [req.body.doorStepStatus, req.body.onVideoStatus, req.body.onCallStatus, req.body.inClinicStatus] } },
            },

          }
        )
        return res.status(200).json({ msg: "Suceessfull" });
      }
      else {
        return res.status(500).json({ msg: "Error to process...Try once more" });
      }
    })
});
app.get('/findConsultingFee', middleware.checkToken, async (req, res) => {
  var result = await db.get().collection(collection.BOOKINGS).find(
    { _id: ObjectID(req.decoded._id) }).project({ _id: 0, doorStep: 1, inClinic: 1, onCall: 1, onVideo: 1 }).toArray()
  return res.status(200).json(result[0]);
});
//// ***************Payment***************************///
app.get('/CheckPaymentAccount', middleware.checkToken, async (req, res) => {
  await db.get().collection(collection.BOOKINGS)
    .findOne({ _id: ObjectID(req.decoded._id) })
    .then((result) => {
      if (result.accNo) {
        res.status(200).json("Actiavted")
      }
      else {
        res.status(202).json("NotActivated")
      }
    }
    )
});
app.post('/updatePaymentaccount', middleware.checkToken, async (req, res) => {
  await db.get().collection(collection.BOOKINGS).updateOne(
    { _id: ObjectID(req.decoded._id) },
    {
      $set:
      {
        accNo: req.body.accNo,
        accName: req.body.accName,
        ifsc: req.body.ifsc
      }
    }).then((result) => {
      if (result.modifiedCount == 1) {
        return res.status(200).json();
      }
      else {
        return res.status(500).json({ msg: "Error to process...Try once more" });
      }
    })
});
app.get('/totalpayments', middleware.checkToken, async function (req, res) {
  await db.get().collection(collection.BOOKINGS).findOne({ _id: ObjectID(req.decoded._id) }).then((result) => {
    if (result) {
      //console.log(result)
      res.status(200).json({ _id: result._id, balance: result.balance, grandtotal: result.grandtotal, requests: result.requests.slice(-20) });
    }
  })
});
app.post('/requestPayment', middleware.checkToken, async (req, res) => {
  var today = new Date();
  await db.get()
    .collection(collection.BOOKINGS)
    .updateOne({
      _id: ObjectID(req.decoded._id),
    },
      {
        $inc: {
          balance: -(parseInt(req.body.amount)),
          grandtotal: parseInt(req.body.amount),
        },
        $push: {
          requests: {
            reqid: ObjectID(),
            date: today,
            amount: parseInt(req.body.amount),
            status: "pending",
          }
        }
      },
    )
    .then(async (result) => {
      if (result.modifiedCount == 1) {
        return res.status(200).json({ msg: "Request Created successful" });
      }
      else {
        return res.status(500).json({ msg: "Error to process...Try once more" });
      }
    })
    .catch(() => {
      return res.status(500).json({ msg: "Error to process...Try once more" });
    });
});


module.exports = app;
