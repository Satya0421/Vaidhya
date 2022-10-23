const express = require("express");
const app = express();
app.use(express.json());
var db = require('../config/connection');
var collection = require("../config/collections")
// const crypto = require('crypto');
const config = require("../jwtconfig");
const jwt = require("jsonwebtoken");
const fileupload = require("express-fileupload");
app.use(fileupload({ safeFileNames: true, preserveExtension: true }));
require('dotenv').config();
let middleware = require("../middleware");
const bcrypt = require('bcrypt');
const { Collection } = require("mongodb");
const cron = require("node-cron");
const sharp = require("sharp");
const ObjectID = require("mongodb").ObjectID
app.post('/register1', async (req, res) => {
  console.log(req.body)
  await db.get()
    .collection(collection.DOCTORS).findOne({ $or: [{ phone: req.body.phone }, { username: req.body.email }] }, async (err, result) => {
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
          .collection(collection.DOCTORS)
          .insertOne(
            {
              password: pass,
              name: req.body.name,
              phone: req.body.phone,
              username: req.body.email,
              lvl: "1",
              code: 123,
              status: "inactive",
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
  console.log(req.body)
  await db.get()
    .collection(collection.DOCTORS)
    .updateOne(
      { $and: [{ _id: ObjectID(req.body._id) }, { code: req.body.code }] },
      {
        $set: {
          lvl: "2",
          //  code: 123
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
app.post('/register2', async (req, res) => {
  console.log(req.body)
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

app.post("/login", async (req, res) => {
  // console.log(req.body)
  await db.get()
    .collection(collection.DOCTORS)
    .findOne({ username: req.body.username }, async (err, user) => {
      if (user) {
        await bcrypt.compare(req.body.password, user.password).then(async (status) => {
          if (status) {
            if (user.lvl == "4" && user.status == "active") {

              let token = await jwt.sign({ username: req.params.username, _id: user._id }, config.key);
              res.json({
                token: token,
                msg: "sucess",
                lvl: user.lvl,
                _id: user._id
              })

            }
            else {
              return res.status(403).json({ status: user.status, msg: "Account is on inactive state,Contact support ", lvl: user.lvl, _id: user._id, phone: user.phone });
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
app.patch("/upload_profile_image/:_id", async (req, res) => {

  let image = req.files.img
  image.mv('./uploads/DoctorsImage/' + req.params._id + ".jpg")
  return res.status(200).json();
});
app.patch("/upload_DoctorsIdProof/:_id", async (req, res) => {
  // console.log("hello")
  // let short = sharp(req.files).resize(200, 200).toBuffer(function (err, buf) {
  //   if (err) return err
  // })
  // console.log(short.files)
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
app.post('/forget-password', async (req, res) => {
  // var num = await crypto.randomBytes(Math.ceil(6)).toString('hex').slice(0, 6);
  var num = 123
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
  console.log(req.body)
  await db.get()
    .collection(collection.DOCTORS)
    .updateOne(
      { $and: [{ _id: ObjectID(req.body._id) }, { code: req.body.code }] },
      {
        $set: {
          lvl: "2",
          //  code: 123
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
          return res.status(200).json({ msg: "Suceessfully verified" });
        }
      },
    )
});
app.get('/dashboard', middleware.checkToken, async (req, res) => {
  console.log("hello")
  var result = await db.get()
    .collection(collection.DOCTORS).aggregate([
      {
        $match: { _id: ObjectID(req.decoded._id) }
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
  return res.json(result[0])

})
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
    console.log(result)
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
            .collection(collection.DOCTORSPAYMENT)
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
    console.log(result.value)
    if (result.value.appointments.length > 0) {
      result.value.appointments.map(async (i) => {
        if (i.date == req.body.date)
          await db.get().collection(collection.USERSAPPOINTMENT).updateOne({ _id: ObjectID(i.patientid) },
            {
              $set: { "appointments.$[inds].status": "cancelled" }
            },
            {
              "arrayFilters": [{ "inds.date": i.date, "inds.time": i.time }]
            },
          )
      })
      console.log("hello")
      await db.get()
          .collection(collection.DOCTORSPAYMENT)
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
    }
     db.get().collection(collection.BOOKINGS).updateOne(
      {
        _id: ObjectID(req.decoded._id)
      },
      {
        $pull: { appointments: { date: req.body.date } }
      }
    )
  })
});
app.post('/cancelAllUnBookedAppointmnets', middleware.checkToken, async (req, res) => {
  console.log("hello2")
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
    console.log(result)
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
  if(result2[0].appointments)
  {
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
  else
  {
    return res.status(500).json({ msg: "Please Add Items to the Daily slot" });
  }
});
app.get('/findalldailyAppointments', middleware.checkToken, async function (req, res) {
  res.json({data: await db.get().collection(collection.DOCTORSDAILYSLOT).aggregate([
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
  ]).toArray()})
});
app.post('/findallCommingAppointments', middleware.checkToken, async function (req, res) {
  console.log(req.body)
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
        patientid:'$appointments.patientid',
        treattype: '$appointments.treattype',
        phone: '$appointments.phone',
        fees: '$appointments.fees',
        status: '$appointments.status',
      }
    },
  ]).sort({ 'appointments.time': -1 }).toArray()
  console.log(result1)
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
        patientid:'$appointments.patientid',
        fees: '$appointments.fees',
        status: '$appointments.status',
      }
    },
  ]).sort({ 'appointments.time': -1 }).toArray())
});
app.get('/listofDepartment', async function (req, res) {
  res.json(await db.get().collection(collection.LISTOFITEMS).find().sort({ 'departments': -1 }).project({ 'departments': 1, _id: 0 }).toArray())
});
app.get('/totalpayments', middleware.checkToken, async function (req, res) {
  await db.get().collection(collection.DOCTORSPAYMENT).findOne({ _id: ObjectID(req.decoded._id) }).then((result) => {
    if (result) {
      console.log(result)
      res.status(200).json({ _id: result._id, balance: result.balance, grandtotal: result.grandtotal, requests: result.requests.slice(0, 100) });
    }
  })
});
app.post('/requestPayment', middleware.checkToken, async (req, res) => {
  var today = new Date();
  await db.get()
    .collection(collection.DOCTORSPAYMENT)
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
            date: today,
            amount: parseInt(req.body.amount),
            status: "pending",
          }
        }
      },
    )
    .then(async (result) => {
      if (result.modifiedCount == 1) {
        await db.get().collection(collection.WITHDRAWPAYMENT)
          .insertOne(
            {
              date: today,
              amount: parseInt(req.body.amount),
              status: "pending",
              drid: req.decoded._id,
            }
          ).then((result, err) => {
            console.log(result)
            if (result.acknowledged) {

              return res.status(200).json({ msg: "Created successful" });

            }
          })
      }
      else {
        return res.status(500).json({ msg: "Error to process...Try once more" });
      }
    })

    .catch(() => {
      return res.status(500).json({ msg: "Error to process...Try once more" });
    });
});
// app.get('/listofcities', middleware.checkToken, async function (req, res) {
//   res.json(await db.get().collection(collection.LISTOFITEMS).find().project({'cities.city': 1, _id: 0 }).toArray())
// });
app.get('/listofcities', async function (req, res) {
  console.log("hai")
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

// app.post('/canceltoday', middleware.checkToken, async (req, res) => {
//   // console.log(req.decoded._id)

//   // res.json(db.get().collection(collection.BOOKINGS).aggregate([
//   //   {
//   //     "$addFields": {
//   //       appointments: {
//   //         "$filter": {
//   //           "input": "$appointments",
//   //           "as": "appointments",
//   //           "cond": {
//   //             $eq: [
//   //               "$$appointments.date",
//   //               req.body.date
//   //             ]
//   //           }
//   //         }
//   //       }
//   //     }
//   //   }
//   // ]))
//   await db.get().collection(collection.BOOKINGS).find().forEach(i => {
//      db.get().collection(collection.BOOKINGS).update(
//       {
//         _id: ObjectID(i._id)
//       },
//       {
//         $pull: { appointments: { date: req.body.date } }
//       }

//     ).then(async (result, err) => {
//       console.log(result)
//       res.json()
//     })
//   });
//   // await db.get().collection(collection.BOOKINGS).update(
//   //   {
//   //     appointments: { date: req.body.date } 
//   //   },
//   //   {
//   //     $pull: { appointments: { date: req.body.date } }
//   //   }

//   // ).then(async (result, err) => {
//   //   console.log(result)
//   //   res.json()
//   // })
// });
// cron.schedule("*/25 * * * * *",  () => {
//   var dates="25-05-2022";
//   console.log(dates);
//    var result=db.get().collection(collection.DOCTORSPAYMENT).findOne({ _id: ObjectID('633a8f88345ae9fbeaf61861') })
// console.log(result)
//   } )
module.exports = app;
