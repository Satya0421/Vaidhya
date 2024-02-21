const express = require("express");
var fs = require('fs');
const bcrypt = require('bcryptjs');
var router = express.Router();
var collection = require("../config/collections");
var db = require("../config/connection");
var ObjectID = require("mongodb").ObjectID;
let path = require('path');
const { Console } = require("console");

const verifyLogin = (req, res, next) => { // to verify the session is valid or not
  if (req.session.loggedIn) {
    next()
  }
  else
    res.redirect("/adminPanel/VidhyA789/login",)
}
//// *************** Account***************************///
router.get('/login', (req, res) => {
  res.render('admin/login')
})

router.post('/login', async (req, res) => {
  console.log("hello")
  await db.get()
    .collection(collection.ADMIN_COLLECTION)
    .findOne({ username: req.body.email }, async (err, user) => {
      if (err) res.status(500).json({ msg: "username or password  incorrect" });
      if (user) {
        await bcrypt.compare(req.body.password, user.password).then((status) => {
          if (status) {
            //   var mailOption = {
            //     from: 'pilasa.ae@gmail.com',
            //     to: 'sibinjames.sibin@gmail.com',
            //     subject: 'sucessfull Login ',
            //     html: `<h3>Sucessfully LoggedIn <h3>`
            //   };
            //   transport.sendMail(mailOption, function (error, info) {
            //   });
            req.session.loggedIn = true
            req.session.user = user._id
            res.redirect('/adminPanel/VidhyA789/') // redirect used to access same page which is accessed before
          }
          else {
            req.session.loginerr = true  //seting up the login error
            res.redirect('back')
            // res.json(req.session.loginerr)
          }
        })
      }
      else {
        req.session.loginerr = true  //seting up the login error
        res.redirect('back')
      }
    });
})
router.get('/reset-password', verifyLogin, async (req, res) => {
  // var num = await crypto.randomBytes(Math.ceil(6)).toString('hex').slice(0, 6);
  // var num = "1234"
  await db.get()
    .collection(collection.ADMIN_COLLECTION)
    .updateOne(
      { username: 'sibinjames.sibin@gmail.com' },
      {
        $set: {
          code: num
        },
      },
      async (err, profile) => {
        if (err) return res.status(500).send({ msg: "Error to process...Try once more" });
        if (profile.modifiedCount == 1) {
          // var mailOption = {
          //   from: 'pilasa.ae@gmail.com',
          //   to: 'sibinjames.sibin@gmail.com',
          //   subject: 'Pilasa one time code',
          //   html: `one time code for reset is is<h3>` + num + '<h3>'
          // };
          // await transport.sendMail(mailOption, function (error, info) {
          //   res.render('admin/resetpassword', { login: true })
          // });
          res.render('admin/resetpassword', { login: true })
        }
        else
          return res.status(500).send({ msg: "Error to process...Try once more" });
      },
    )
});
router.post('/reset-password', verifyLogin, async (req, res) => {
  if (req.body.newpassword == req.body.repassword) {
    await db.get()
      .collection(collection.ADMIN_COLLECTION)
      .findOne({ username: 'sibinjames.sibin@gmail.com' }, async (err, user) => {
        await bcrypt.compare(req.body.currentpassword, user.password).then(async (status) => {
          if (status) {
            req.body.newpassword = await bcrypt.hash(req.body.newpassword, 8);
            // (req.body.password)
            await db.get()
              .collection(collection.ADMIN_COLLECTION)
              .updateOne(
                { $and: [{ username: 'sibinjames.sibin@gmail.com' }, { code: req.body.code }] },
                {
                  $set: {
                    password: req.body.newpassword,
                    code: null
                  },
                }, (err, result) => {
                  //console.log(result)
                  if (err) return res.send(err);
                  if (result.modifiedCount == 1) {
                    res.redirect("/adminPanel/VidhyA789/login");
                  }
                  else {
                    res.redirect('back');
                  }
                },
              )
          }
          else {
            res.redirect('back');
          }
        })
      })
  }
  else {
    res.redirect('back');
  }
});
router.get('/logout', (req, res) => {
  //req.session.destroy()
  req.session.user = null
  req.session.loggedIn = false
  res.redirect("/adminPanel/VidhyA789/login")
});

//// *************** Dash***************************///
router.get('/', verifyLogin, async (req, res) => {
  let superImage = await db.get().collection(collection.BANNERCOLLECTION).find().toArray()
  res.render('admin/admin-home', { login: true, superImage })
})

router.post('/Add-superImage', verifyLogin, async function (req, res, next) {
  // //console.log(req.files)
  if (req.files != null) {
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./uploads/superImage/' + req.files.Image.name)
      await db.get()
        .collection(collection.BANNERCOLLECTION)
        .insertOne({
          imgName: req.files.Image.name,
          url: req.body.url
        })
        .then((result) => {
          res.redirect("/adminPanel/VidhyA789/");
        })

        .catch(() => {
          res.status(500).json();
        });
    }
  }
  else {
    res.redirect('back');
  }
});

router.get('/delete-superImage/:_id/:imgName', verifyLogin, async function (req, res, next) {
  await db.get()
    .collection(collection.BANNERCOLLECTION)
    .deleteOne({
      _id: ObjectID(req.params._id)
    })
    .then((result) => {
      //console.log(result)
      if (result.deletedCount == 1) {
        res.redirect("/adminPanel/VidhyA789/");
        // fs.unlinkSync('./uploads/superImage/' + req.params.imgName);
        // res.redirect("/adminPanel/VidhyA789/");
        fs.unlink('./uploads/superImage/' + req.params.imgName, (err, done) => {  // deleting image of the product
          if (!err) {
            res.status(200).json();
          }
        })
      }
      else {
        res.redirect("/adminPanel/VidhyA789/");
      }
    })
    .catch(() => {
      res.status(500).json();
    });
}
);

//// *************** Doctors***************************///

router.get('/view-inactiveDoctors', verifyLogin, async function (req, res, next) {
  var status = "InActive "
  let doctors = await db.get().collection(collection.DOCTORS).find({ status: "inactive" }).toArray()
  res.render('admin/doctors/view-InactiveDoctors', { login: true, doctors, status })

});
router.post('/deleteDoctorByAdmin/:_id', verifyLogin, async (req, res, next) => {
  let doctorId = req.params._id;
  try {
    await db.get().collection(collection.DOCTORS).updateOne(
      { _id: ObjectID(doctorId) }, // Filter
      { $set: { status: "inactive" } } // Update
    ).then(async(value)=>{
      res.redirect('/adminPanel/VidhyA789/view-activeDoctors');
    });
  } catch (error) {
    console.error('Error updating doctor status:', error);
    // Handle error
    res.status(500).send('Error updating doctor status');
  }
});

router.get('/view-activeDoctors', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let doctors = await db.get().collection(collection.DOCTORS).find({ status: "active" }).toArray()
  res.render('admin/doctors/view-InactiveDoctors', { login: true, doctors, status })

});
router.get('/view-unSubscribed', verifyLogin, async function (req, res, next) {
  var status = "UnSubscribed "
  let doctors = await db.get().collection(collection.DOCTORS).find({ status: "unSubscribe" }).toArray()
  res.render('admin/doctors/view-InactiveDoctors', { login: true, doctors, status })

});
router.get('/view-expiringDoctors', verifyLogin, async function (req, res, next) {
  var status = "Expiring Doctors "
  let list = await db.get().collection(collection.EXPIRING_COLLECTION).find({}).project({ _id: 0, doctors: 1 }).toArray()
  var data = list[0].doctors

  res.render('admin/doctors/expiringDoctorList', { login: true, data, status })

});

router.get('/view-doctor/:_id', verifyLogin, async function (req, res, next) {
  if (req.params._id != "assets") {
    // console.log(req.params)
    let doctors = await db.get().collection(collection.DOCTORS).findOne({ _id: ObjectID(req.params._id) })
    //(church)
    res.render('admin/doctors/view-doctor', { login: true, doctors })
  }
  else {
    res.redirect('back');
  }

});

router.get('/view-doctors/active/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.DOCTORS).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        lvl: "6",
        status: "active"
      }
    }).then(async (result) => {
      // //console.log(result.value)
      var doctors = await db.get().collection(collection.BOOKINGS).findOne({ _id: ObjectID(req.params._id) })
      if (doctors == null) {
        await db.get().collection(collection.BOOKINGS).insertOne({
          _id: ObjectID(req.params._id),
          department: result.value.specality,
          category: result.value.category,
          location: result.value.location,
          address: result.value.address,
          name: result.value.name,
          rating: 0,
          totalRating: 0,
          balance: 0,
          grandtotal: 0,
          status: "Active",
          doorStep: "0",
          inClinic: "0",
          onCall: "0",
          onVideo: "0",
        }).then(async (response) => {
          await db.get().collection(collection.DOCTORSREVIEW).insertOne({ _id: ObjectID(req.params._id), }).then(async (response) => {
            await db.get().collection(collection.DOCTORSDAILYSLOT).insertOne({ _id: ObjectID(req.params._id) }).then(async (response) => {

              //           var mailOption = {
              //             from: 'pilasa.ae@gmail.com',
              //             to: req.params.username,
              //             subject: 'Pilasa Activated',
              //             html: `<h3>Welcome to Pilasa<h3>,
              //  your pilasa Account is Successfully 
              //  Activated.<br>Enjoy our service",`
              //           };

              //           transport.sendMail(mailOption, function (error, info) {
              //             if (error)
              //               (error);
              //             else
              //               ('email Sent:' + info.response);
              //           });
            });
            res.redirect('back');
          })
        })
      }
      else {
        res.redirect('back');
      }
    })
});
router.get('/view-doctors/unSubscribe/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.DOCTORS).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "unSubscribe",
        subEnddate: "",
      }
    }).then(async (result) => {
      res.redirect('back');
      db.get().collection(collection.BOOKINGS)
        .updateOne(
          { _id: ObjectID(req.params._id) },
          {
            // $add: ["subEnddate", 365 * 24 * 60 * 60 * 1000],
            $set: {
              status: "unSubscribe",
            },
          }
        )
      await db.get().collection(collection.EXPIRING_COLLECTION)
        .updateOne(
          {
          },
          {
            $pull: {
              doctors: {
                _id: ObjectID(req.params._id),
              }
            }
          },
        )

    })

});
router.get('/view-doctors/extend/:_id', verifyLogin, async function (req, res, next) {
  var output = await db.get()
    .collection(collection.DOCTORS)
    .findOne({ _id: ObjectID(req.params._id) })
  if (output.subEnddate == "") {
    var newdate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  } else {
    var newdate = new Date(output.subEnddate.setFullYear(output.subEnddate.getFullYear() + 1));
  }
  await db.get()
    .collection(collection.DOCTORS)
    .updateOne(
      { _id: ObjectID(req.params._id) },
      {
        // $add: ["subEnddate", 365 * 24 * 60 * 60 * 1000],
        $set: {
          subEnddate: newdate,
        },
      }, (err, result) => {

        db.get().collection(collection.EXPIRING_COLLECTION)
          .updateOne(
            {
            },
            {
              $pull: {
                doctors: {
                  _id: ObjectID(req.params._id),
                }
              }
            },
          )
        db.get().collection(collection.BOOKINGS)
          .updateOne(
            { _id: ObjectID(req.params._id) },
            {
              // $add: ["subEnddate", 365 * 24 * 60 * 60 * 1000],
              $set: {
                status: "Active",
              },
            }
          )
        res.redirect('back');
      },
    )

});

//// *************** Users***************************///

router.get('/view-activeUser', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let beliver = await db.get().collection(collection.USERS).find({ status: "active" }).toArray()
  res.render('admin/users/viewUser', { login: true, beliver, status })

});
router.get('/view-InactiveUser', verifyLogin, async function (req, res, next) {
  var status = "In Active "
  let beliver = await db.get().collection(collection.USERS).find({ status: "inactive" }).toArray()
  res.render('admin/users/viewUser', { login: true, beliver, status })

});


//// *************** Payment***************************///

router.get('/view-activePayment', verifyLogin, async function (req, res, next) {
  var status = "Active Payments "
  let requests = await db.get().collection(collection.BOOKINGS).aggregate([
    // {
    //   $match: { _id: ObjectID(req.decoded._id) }
    // },
    {
      $unwind: '$requests'
    },
    {
      $match: { 'requests.status': "pending" }
    },
    {
      $project: {
        reqid: '$requests.reqid',
        date: '$requests.date',
        status: '$requests.status',
        amt: '$requests.amount',
      }
    }]
  ).toArray();
  // //console.log(requests);
  res.render('admin/payment/view-activePayment', { login: true, requests, status })

});
router.get('/viewPayment/:_id/:reqid/:amt', verifyLogin, async (req, res) => {

  let requests = await db.get().collection(collection.BOOKINGS).aggregate([
    {
      $match: { _id: ObjectID(req.params._id) }
    },
    {
      $unwind: '$requests'
    },
    {
      $match: { 'requests.amount': parseInt(req.params.amt), 'requests.reqid': ObjectID(req.params.reqid) }
    },
    {
      $project: {
        reqid: '$requests.reqid',
        date: '$requests.date',
        status: '$requests.status',
        amt: '$requests.amount',
        payDate: '$requests.payDate',
        trId: '$requests.trId',
        accName: '$accName',
        accNo: '$accNo',
        ifsc: '$ifsc',
        doctorName: '$name'
      }
    }
  ]).toArray();
  var result = requests[0];

  res.render('admin/payment/viewPayment', { login: true, result })
});
router.post('/viewPayment/:_id/:reqid/:amt', async (req, res) => {

  if (req.body.trId == null) {
    res.redirect('back');
  }
  else {
    //console.log(req.body)
    let requests = await db.get().collection(collection.BOOKINGS).updateOne(
      {
        _id: ObjectID(req.params._id)
      },
      {
        $set: { 'requests.$[inds].payDate': req.body.payDate == "" ? new Date() : req.body.payDate, 'requests.$[inds].trId': req.body.trId, 'requests.$[inds].status': 'Transferred' }
      },
      {
        "arrayFilters": [{ "inds.amount": parseInt(req.body.amt), "inds.reqid": ObjectID(req.params.reqid) }]
      },
    ).then((result, err) => {
      //console.log(result)
    })
    res.redirect('back');
  }
});

router.get('/view-doctorRecentPayment', verifyLogin, async function (req, res, next) {
  var status = "Doctors Recent Payment Requests "
  res.render('admin/payment/doctor_recentPayment', { login: true, status })

});
router.post('/view-doctorRecentPayment', verifyLogin, async function (req, res, next) {
  var status = "Doctors Recent Payment Requests  "
  if (req.body._id == "") {
    res.redirect('back');
  }
  else {
    let payments = await db.get().collection(collection.BOOKINGS).findOne({ _id: ObjectID(req.body._id) })
    let result = payments
    res.render('admin/payment/doctor_recentPayment', { login: true, result, status })
  }
});


//// *************** Bookings***************************///
router.get('/user_bookings', verifyLogin, async function (req, res, next) {
  var status = "Users Booking "
  res.render('admin/users/user_bookings', { login: true, status })

});
router.post('/user_bookings', verifyLogin, async function (req, res, next) {
  var status = "Users Booking "
  if (req.body._id == "") {
    res.redirect('back');
  }
  else {
    let payments = await db.get().collection(collection.USERSAPPOINTMENT).findOne({ _id: ObjectID(req.body._id) })
    var result = [];
    if (payments != null) {
      result = payments.appointments
    }
    // //console.log(result)
    res.render('admin/users/user_bookings', { login: true, result, status })
  }
});
router.get('/doctors_bookings', verifyLogin, async function (req, res, next) {
  var status = "Doctors Booking "
  res.render('admin/doctors/doctor_bookings', { login: true, status })

});
router.post('/doctors_bookings', verifyLogin, async function (req, res, next) {
  //console.log(req.body.month+"-"+req.body.year)
  if (req.body._id == "") {
    res.redirect('back');
  }
  else {
    var status = "Doctors Booking"
    let bookings = await db.get().collection(req.body.month + "-" + req.body.year).findOne({ _id: ObjectID(req.body._id) })
    var result = [];
    if (bookings != null) {
      result = bookings.appointments
    }
    //console.log(result)
    res.render('admin/doctors/doctor_bookings', { login: true, result, status })
  }
});
// router.post('/addcities', async (req, res) => {
// await db.get().collection(collection.LISTOFITEMS).updateOne({
//   _id: ObjectID(req.body._id)
//   }, {
//     $push: {
//       cities: {
//         // $each: req.body,
//         //  {
//           city:req.body.city,
//           location: {
//             "type": "Point",
//             "coordinates": [
//               parseFloat(req.body.longtitude),
//               parseFloat(req.body.latitude),
//             ]
//           },
//         // },
//         // $sort: { name: 1},
//         //  $slice: 3
//       }
//     },

//   }, {$sort: {cities: 1}},)
//   // res.render('admin/admin-home', { login: true, superImage })
// })

//// *************** Booking  Cancel***************************///
router.get('/view-CancelRequests', verifyLogin,  async function (req, res, next) {
  var status = "Cancel Request "
  let requests = await db.get().collection(collection.CANCELCOLLECTION).find({status: "Raised"}).sort({ _id: -1 }).limit(50).toArray()
  res.render('admin/cancel/cancelRequest', { login: true, requests, status })

});

router.get('/history-CancelRequests', verifyLogin,  async function (req, res, next) {
  var status = "Cancel Request "
  let requests = await db.get().collection(collection.CANCELCOLLECTION).find({status: { $ne: "Raised" } }).sort({ _id: -1 }).limit(200).toArray()
  res.render('admin/cancel/cancel_history', { login: true, requests, status })

});
router.get('/approveCancelRequest/:id/:date/:time/:doctorid/:raisedBy', verifyLogin,  async (req, res) => {  
 
  await db.get().collection(req.params.date.substring(3)).findOneAndUpdate(
    { _id: ObjectID(req.params.doctorid), appointments: { $elemMatch: { date: req.params.date, time: req.params.time } } },
    { $set: { "appointments.$.status": "cancelled" } },
    { projection: { "appointments.$": 1 }, returnOriginal: false }
  ).then(async (result, err) => {
   
    output = result.value.appointments[0]
    if (result.ok == 1) {
      await db.get().collection(collection.USERSAPPOINTMENT).updateOne({ _id: ObjectID(output.patientid) },
        {
          $set: { "appointments.$[inds].status": "cancelled" }
        },
        {
          "arrayFilters": [{ "inds.date": req.params.date, "inds.time": req.params.time }]
        },
      ).then(async (result, err) => {
         if (result.modifiedCount == 1) {
          if (req.params.raisedBy == "dr") {
            await db.get()
              .collection(collection.BOOKINGS)
              .updateOne({
                _id: ObjectID(req.params.doctorid),
              },
                {
                  $inc: { balance: - output.fees },

                },
              )
              .then((result) => {
                if (result.modifiedCount == 1) {
                  res.redirect('back')
                }
              })
          }
          else {
            
            await db.get()
              .collection(collection.BOOKINGS)
              .updateOne({
                _id: ObjectID(req.params.doctorid),
              },
                {
                  $inc: { balance: - output.fees },
                  $push: { appointments: { time: output.time, date: output.date, treattype: output.treattype } }
                },
              )
              .then((result) => {
                if (result.modifiedCount == 1) {
                  res.redirect('back')
                }
              })
          }
          await db.get().collection(collection.CANCELCOLLECTION).updateOne(
            {
              _id: ObjectID(req.params.id)
            },
            {
              $set: { "status": "approved" }
            }
          )
          // return res.status(200).json({ msg: "Appointment cancelled successful" });
        } else
          res.redirect('back')
      })
    }
    else
      res.redirect('back')
  })

    .catch(() => {
      res.redirect('back')
    })
});
router.get('/rejectCancelRequest/:id/:date/:time/:doctorid/:patientid/:raisedBy', verifyLogin, async (req, res) => {
  await db.get().collection(collection.CANCELCOLLECTION).updateOne(
    {
      _id: ObjectID(req.params.id)
    },
    {
      $set: { "status": "rejected" }
    }
  )
  if (req.params.raisedBy == "dr") {
    await db.get().collection(req.params.date.substring(3)).updateOne(
      {
        _id: ObjectID(req.params.doctorid)
      },
      {
        $set: { "appointments.$[inds].status": "active" }
      },
      {
        "arrayFilters": [{ "inds.date": req.params.date, "inds.time": req.params.time }]
      },
    ).then(async (result, err) => {
      res.redirect('back')
    })
  }
  else {
    await db.get().collection(collection.USERSAPPOINTMENT).updateOne(
      {
        _id: ObjectID(req.params.patientid)
      },
      {
        $set: { "appointments.$[inds].status": "active" }
      },
      {
        "arrayFilters": [{ "inds.date": req.params.date, "inds.time": req.params.time }]
      },
    ).then(async (result, err) => {
      res.redirect('back')
    })
  }

});
//// *************** list of cities***************************///
router.get('/addcities', verifyLogin, async function (req, res, next) {
  var status = "Locations "
  var out = await db.get().collection(collection.LISTOFITEMS).find().toArray();
  // {projection: { _id: 0, cities: 1 }}
  if (out[0].cities != "") {
    var result = out[0].cities;
    // //console.log(result)
    res.render('admin/listdata/locationList', { login: true, status, result })
  }
  else {
    res.redirect('back');
  }

});
router.post('/addcities', verifyLogin, async (req, res) => {

  if (req.body.city == '' || req.body.longtitude == '' || req.body.latitude == '') {
    res.redirect('back');
  } else {
    var city = [{
      "city": req.body.city,
      "longtitude": req.body.longtitude,
      "latitude": req.body.latitude,
    }];
    var status = "Locations "
    await db.get().collection(collection.LISTOFITEMS)
      .updateOne(
        {
          _id: ObjectID('633fc9dce4f51a74f8e8cac3'),
        },
        {
          $push: {
            cities: {
              $each: city,
              $sort: { city: 1 },
              //  $slice: 3
            }
          }
        },
      )
    res.redirect('back');
  }
})
router.get('/deletecities/:city', verifyLogin, async (req, res) => {
  await db.get().collection(collection.LISTOFITEMS)
    .updateOne(
      {
        _id: ObjectID('633fc9dce4f51a74f8e8cac3'),
      },
      {
        $pull: {
          cities: {
            city: req.params.city,
          }
        }
      },
    )
  res.redirect('back');
})
//// *************** list of Department***************************///
router.get('/addAyurvedicDepartment', verifyLogin, async function (req, res, next) {
  var status = "Ayurvedic Departments "
  var out = await db.get().collection(collection.LISTOFITEMS).find().toArray();
  // {projection: { _id: 0, cities: 1 }}
  if (out[0].ayurvedicDepartment != "") {
    var result = out[0].ayurvedicDepartment;
    // //console.log(result)
    res.render('admin/listdata/AyurvedicdepartmentList', { login: true, status, result })
  }
  else {
    res.redirect('back');
  }

});
router.post('/addAyurvedicDepartment', async (req, res) => {
  //console.log(req.body.department)

  if (req.body.department == '') {
    res.redirect('back');
  } else {
    await db.get().collection(collection.LISTOFITEMS)
      .updateOne(
        {
          _id: ObjectID('633fc9dce4f51a74f8e8cac3'),
        },
        { $push: { ayurvedicDepartment: { $each: [req.body.department], $sort: 1 } } }
        // { $push: { ayurvedicDepartment: req.body.department }, $sort: { ayurvedicDepartment: 1 } }

        // {
        //   $push: {
        //     ayurvedicDepartment: req.body.department
        //   }
        // },
      )
    res.redirect('back');
  }
})
router.get('/deleteAyurvedicDepartment/:department', verifyLogin, async (req, res) => {
  await db.get().collection(collection.LISTOFITEMS)
    .updateOne(
      {
        _id: ObjectID('633fc9dce4f51a74f8e8cac3'),
      },
      {
        $pull: {
          ayurvedicDepartment:
            req.params.department,
        }
      },
    )
  res.redirect('back');
})

router.get('/addGeneralDepartment', verifyLogin, async function (req, res, next) {
  var status = "General Departments "
  var out = await db.get().collection(collection.LISTOFITEMS).find().toArray();
  // {projection: { _id: 0, cities: 1 }}
  if (out[0].generaldepartments != "") {
    var result = out[0].generaldepartments;
    // //console.log(result)
    res.render('admin/listdata/GeneralDepartmentList', { login: true, status, result })
  }
  else {
    res.redirect('back');
  }

});
router.post('/addGeneralDepartment', verifyLogin, async (req, res) => {
  //console.log(req.body.department)
  if (req.body.department == '') {
    res.redirect('back');
  } else {
    await db.get().collection(collection.LISTOFITEMS)
      .updateOne(
        {
          _id: ObjectID('633fc9dce4f51a74f8e8cac3'),
        },
        { $push: { generaldepartments: { $each: [req.body.department], $sort: 1 } } }
        // {
        //   $push: {
        //     generaldepartments: req.body.department
        //   }
        // },
      )
    res.redirect('back');
  }
})
router.get('/deleteGeneralDepartment/:department', verifyLogin, async (req, res) => {
  await db.get().collection(collection.LISTOFITEMS)
    .updateOne(
      {
        _id: ObjectID('633fc9dce4f51a74f8e8cac3'),
      },
      {
        $pull: {
          generaldepartments:
            req.params.department,
        }
      },
    )
  res.redirect('back');
})
//// *************** hospiatl***************************///

router.get('/view-inactivehospital', verifyLogin, async function (req, res, next) {
  var status = "InActive "
  let hospital = await db.get().collection(collection.HOSPITAL_COLLECTION).find({ status: "inActive" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/hospital/hospital_list', { login: true, hospital, status })

});
router.get('/view-activeHospitals', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let hospital = await db.get().collection(collection.HOSPITAL_COLLECTION).find({ status: "Active" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/hospital/hospital_list', { login: true, hospital, status })

});
router.get('/view-unSubscribedhospitals', verifyLogin, async function (req, res, next) {
  var status = "UnSubscribed "
  let hospital = await db.get().collection(collection.HOSPITAL_COLLECTION).find({ status: "unSubscribe" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/hospital/hospital_list', { login: true, hospital, status })

});

router.get('/view-hospital/:_id', verifyLogin, async function (req, res, next) {
  if (req.params._id != "assets") {
    // console.log(req.params)
    let hospital = await db.get().collection(collection.HOSPITAL_COLLECTION).findOne({ _id: ObjectID(req.params._id) })
    //(church)
    res.render('admin/hospital/view_hospital', { login: true, hospital })
  }
  else {
    res.redirect('back');
  }

});

router.get('/view-hospital/active/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.HOSPITAL_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "Active",
        subEnddate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    }).then(async (result) => {
      // //console.log(result.value)

      res.redirect('back');
    }
    )
});
router.get('/view-hospital/unSubscribe/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.HOSPITAL_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "unSubscribe",
        subEnddate: "",
      }
    }).then(async (result) => {
      // //console.log(result.value)

      res.redirect('back');
    })

});
router.get('/view-expiringHospital', verifyLogin, async function (req, res, next) {
  var status = "Expiring Hospital "
  let list = await db.get().collection(collection.EXPIRING_COLLECTION).find({}).project({ _id: 0, hospital: 1 }).toArray()
  var data = list[0].hospital
  // console.log(data)
  res.render('admin/hospital/expiringHospitalList', { login: true, data, status })

});
router.get('/view-hospital/unSubscribe/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.HOSPITAL_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "unSubscribe",
        subEnddate: "",
      }
    }).then(async (result) => {
      res.redirect('back');
      await db.get().collection(collection.EXPIRING_COLLECTION)
        .updateOne(
          {
          },
          {
            $pull: {
              hospital: {
                _id: ObjectID(req.params._id),
              }
            }
          },
        )
    })

});
router.get('/view-hospital/extend/:_id', verifyLogin, async function (req, res, next) {
  var output = await db.get()
    .collection(collection.HOSPITAL_COLLECTION)
    .findOne({ _id: ObjectID(req.params._id) })
  if (output.subEnddate == "") {
    var newdate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  } else {
    var newdate = new Date(output.subEnddate.setFullYear(output.subEnddate.getFullYear() + 1));
  }
  await db.get()
    .collection(collection.HOSPITAL_COLLECTION)
    .updateOne(
      { _id: ObjectID(req.params._id) },
      {
        // $add: ["subEnddate", 365 * 24 * 60 * 60 * 1000],
        $set: {
          subEnddate: newdate,
          // paymentId: req.body.paymentId
        },
      }, (err, result) => {

        db.get().collection(collection.EXPIRING_COLLECTION)
          .updateOne(
            {
            },
            {
              $pull: {
                hospital: {
                  _id: ObjectID(req.params._id),
                }
              }
            },
          )
        res.redirect('back');
      },
    )

});
//// *************** pharmacy***************************///

router.get('/view-inactivepharmacy', verifyLogin, async function (req, res, next) {
  var status = "InActive "
  let pharmacy = await db.get().collection(collection.PHARMACY_COLLECTION).find({ status: "inActive" }).project({ image: 0, location: 0 }).toArray()

  res.render('admin/pharmacy/pharmacy_list', { login: true, pharmacy, status })

});
router.get('/view-activepharmacy', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let pharmacy = await db.get().collection(collection.PHARMACY_COLLECTION).find({ status: "Active" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/pharmacy/pharmacy_list', { login: true, pharmacy, status })

});
router.get('/view-unSubscribedpharmacy', verifyLogin, async function (req, res, next) {
  var status = "UnSubscribed "
  let pharmacy = await db.get().collection(collection.PHARMACY_COLLECTION).find({ status: "unSubscribe" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/pharmacy/pharmacy_list', { login: true, pharmacy, status })

});

router.get('/view-pharmacy/:_id', verifyLogin, async function (req, res, next) {
  if (req.params._id != "assets") {
    // console.log(req.params)
    let pharmacy = await db.get().collection(collection.PHARMACY_COLLECTION).findOne({ _id: ObjectID(req.params._id) })
    //(church)
    res.render('admin/pharmacy/view_pharmacy', { login: true, pharmacy })
  }
  else {
    res.redirect('back');
  }

});

router.get('/view-pharmacy/active/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.PHARMACY_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "Active",
        subEnddate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    }).then(async (result) => {
      // //console.log(result.value)

      res.redirect('back');
    }
    )
});
router.get('/view-expiringPharmacy', verifyLogin, async function (req, res, next) {
  var status = "Expiring Pharmacy "
  let list = await db.get().collection(collection.EXPIRING_COLLECTION).find({}).project({ _id: 0, pharmacy: 1 }).toArray()
  var data = list[0].pharmacy
  // console.log(data)
  res.render('admin/pharmacy/expiringPharmacyList', { login: true, data, status })

});
router.get('/view-pharmacy/unSubscribe/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.PHARMACY_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "unSubscribe",
        subEnddate: "",
      }
    }).then(async (result) => {
      res.redirect('back');
      await db.get().collection(collection.EXPIRING_COLLECTION)
        .updateOne(
          {
          },
          {
            $pull: {
              pharmacy: {
                _id: ObjectID(req.params._id),
              }
            }
          },
        )
    })

});
router.get('/view-pharmacy/extend/:_id', verifyLogin, async function (req, res, next) {
  var output = await db.get()
    .collection(collection.PHARMACY_COLLECTION)
    .findOne({ _id: ObjectID(req.params._id) })
  if (output.subEnddate == "") {
    var newdate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  } else {
    var newdate = new Date(output.subEnddate.setFullYear(output.subEnddate.getFullYear() + 1));
  }
  await db.get()
    .collection(collection.PHARMACY_COLLECTION)
    .updateOne(
      { _id: ObjectID(req.params._id) },
      {
        // $add: ["subEnddate", 365 * 24 * 60 * 60 * 1000],
        $set: {
          subEnddate: newdate,
          // paymentId: req.body.paymentId
        },
      }, (err, result) => {

        db.get().collection(collection.EXPIRING_COLLECTION)
          .updateOne(
            {
            },
            {
              $pull: {
                pharmacy: {
                  _id: ObjectID(req.params._id),
                }
              }
            },
          )
        res.redirect('back');
      },
    )

});
//// *************** nurse***************************///

router.get('/view-inactivenurse', verifyLogin, async function (req, res, next) {
  var status = "InActive "
  let nurse = await db.get().collection(collection.NURSE_COLLECTION).find({ status: "inActive" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/nurse/nurse_list', { login: true, nurse, status })

});
router.get('/view-activenurse', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let nurse = await db.get().collection(collection.NURSE_COLLECTION).find({ status: "Active" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/nurse/nurse_list', { login: true, nurse, status })

});
router.get('/view-unSubscribednurse', verifyLogin, async function (req, res, next) {
  var status = "UnSubscribed "
  let nurse = await db.get().collection(collection.NURSE_COLLECTION).find({ status: "unSubscribe" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/nurse/nurse_list', { login: true, nurse, status })

});

router.get('/view-nurse/:_id', verifyLogin, async function (req, res, next) {
  if (req.params._id != "assets") {
    // console.log(req.params)
    let nurse = await db.get().collection(collection.NURSE_COLLECTION).findOne({ _id: ObjectID(req.params._id) })
    //(church)
    res.render('admin/nurse/view_nurse', { login: true, nurse })
  }
  else {
    res.redirect('back');
  }

});

router.get('/view-nurse/active/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.NURSE_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "Active",
        subEnddate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    }).then(async (result) => {
      // //console.log(result.value)

      res.redirect('back');
    }
    )
});
router.get('/view-expiringNurce', verifyLogin, async function (req, res, next) {
  var status = "Expiring Nurce "
  let list = await db.get().collection(collection.EXPIRING_COLLECTION).find({}).project({ _id: 0, nurse: 1 }).toArray()
  var data = list[0].nurse
  // console.log(data)
  res.render('admin/nurse/expiringNurceList', { login: true, data, status })

});
router.get('/view-nurse/unSubscribe/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.NURSE_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "unSubscribe",
        subEnddate: "",
      }
    }).then(async (result) => {
      res.redirect('back');
      await db.get().collection(collection.EXPIRING_COLLECTION)
        .updateOne(
          {
          },
          {
            $pull: {
              nurse: {
                _id: ObjectID(req.params._id),
              }
            }
          },
        )
    })

});
router.get('/view-nurse/extend/:_id', verifyLogin, async function (req, res, next) {
  var output = await db.get()
    .collection(collection.NURSE_COLLECTION)
    .findOne({ _id: ObjectID(req.params._id) })
  if (output.subEnddate == "") {
    var newdate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  } else {
    var newdate = new Date(output.subEnddate.setFullYear(output.subEnddate.getFullYear() + 1));
  }
  await db.get()
    .collection(collection.NURSE_COLLECTION)
    .updateOne(
      { _id: ObjectID(req.params._id) },
      {
        // $add: ["subEnddate", 365 * 24 * 60 * 60 * 1000],
        $set: {
          subEnddate: newdate,
          // paymentId: req.body.paymentId
        },
      }, (err, result) => {

        db.get().collection(collection.EXPIRING_COLLECTION)
          .updateOne(
            {
            },
            {
              $pull: {
                nurse: {
                  _id: ObjectID(req.params._id),
                }
              }
            },
          )
        res.redirect('back');
      },
    )

});


//// *************** lab***************************///

router.get('/view-inactivelab', verifyLogin, async function (req, res, next) {
  var status = "InActive "
  let lab = await db.get().collection(collection.LABS_COLLECTION).find({ status: "inActive" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/lab/lab_list', { login: true, lab, status })

});
router.get('/view-activelab', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let lab = await db.get().collection(collection.LABS_COLLECTION).find({ status: "Active" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/lab/lab_list', { login: true, lab, status })

});
router.get('/view-unSubscribedlab', verifyLogin, async function (req, res, next) {
  var status = "UnSubscribed "
  let lab = await db.get().collection(collection.LABS_COLLECTION).find({ status: "unSubscribe" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/lab/lab_list', { login: true, lab, status })

});

router.get('/view-lab/:_id', verifyLogin, async function (req, res, next) {
  if (req.params._id != "assets") {
    // console.log(req.params)
    let lab = await db.get().collection(collection.LABS_COLLECTION).findOne({ _id: ObjectID(req.params._id) })
    //(church)
    res.render('admin/lab/view_lab', { login: true, lab })
  }
  else {
    res.redirect('back');
  }

});

router.get('/view-lab/active/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.LABS_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "Active",
        subEnddate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    }).then(async (result) => {
      // //console.log(result.value)

      res.redirect('back');
    }
    )
});
// router.get('/view-lab/unSubscribe/:_id', verifyLogin, async function (req, res, next) {
//   await db.get().collection(collection.LABS_COLLECTION).findOneAndUpdate(
//     { _id: ObjectID(req.params._id) },
//     {
//       $set:
//       {
//         status: "unSubscribe",
//         subEnddate: "",
//       }
//     }).then(async (result) => {
//       // //console.log(result.value)

//       res.redirect('back');
//     })

// });
router.get('/view-expiringLab', verifyLogin, async function (req, res, next) {
  var status = "Expiring Lab "
  let list = await db.get().collection(collection.EXPIRING_COLLECTION).find({}).project({ _id: 0, lab: 1 }).toArray()
  var data = list[0].lab
  // console.log(data)
  res.render('admin/lab/expiringLabList', { login: true, data, status })

});
router.get('/view-lab/unSubscribe/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.LABS_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "unSubscribe",
        subEnddate: "",
      }
    }).then(async (result) => {
      res.redirect('back');
      await db.get().collection(collection.EXPIRING_COLLECTION)
        .updateOne(
          {
          },
          {
            $pull: {
              lab: {
                _id: ObjectID(req.params._id),
              }
            }
          },
        )
    })

});
router.get('/view-lab/extend/:_id', verifyLogin, async function (req, res, next) {
  var output = await db.get()
    .collection(collection.LABS_COLLECTION)
    .findOne({ _id: ObjectID(req.params._id) })
  if (output.subEnddate == "") {
    var newdate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  } else {
    var newdate = new Date(output.subEnddate.setFullYear(output.subEnddate.getFullYear() + 1));
  }
  await db.get()
    .collection(collection.LABS_COLLECTION)
    .updateOne(
      { _id: ObjectID(req.params._id) },
      {
        // $add: ["subEnddate", 365 * 24 * 60 * 60 * 1000],
        $set: {
          subEnddate: newdate,
          // paymentId: req.body.paymentId
        },
      }, (err, result) => {

        db.get().collection(collection.EXPIRING_COLLECTION)
          .updateOne(
            {
            },
            {
              $pull: {
                lab: {
                  _id: ObjectID(req.params._id),
                }
              }
            },
          )
        res.redirect('back');
      },
    )

});


//// *************** ambulance***************************///

router.get('/view-inactiveambulance', verifyLogin, async function (req, res, next) {
  var status = "InActive "
  let ambulance = await db.get().collection(collection.AMBULANCE_COLLECTION).find({ status: "inActive" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/ambulance/ambulance_list', { login: true, ambulance, status })

});
router.get('/view-activeambulance', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let ambulance = await db.get().collection(collection.AMBULANCE_COLLECTION).find({ status: "Active" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/ambulance/ambulance_list', { login: true, ambulance, status })

});
router.get('/view-unSubscribedambulance', verifyLogin, async function (req, res, next) {
  var status = "UnSubscribed "
  let ambulance = await db.get().collection(collection.AMBULANCE_COLLECTION).find({ status: "unSubscribe" }).project({ image: 0, location: 0 }).toArray()
  res.render('admin/ambulance/ambulance_list', { login: true, ambulance, status })

});


router.get('/view-ambulance/:_id', verifyLogin, async function (req, res, next) {
  if (req.params._id != "assets") {
    // console.log(req.params)
    let ambulance = await db.get().collection(collection.AMBULANCE_COLLECTION).findOne({ _id: ObjectID(req.params._id) })
    //(church)
    res.render('admin/ambulance/view_ambulance', { login: true, ambulance })
  }
  else {
    res.redirect('back');
  }

});

router.get('/view-ambulance/active/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.AMBULANCE_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "Active",
        subEnddate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    }).then(async (result) => {
      // //console.log(result.value)

      res.redirect('back');
    }
    )
});
// router.get('/view-ambulance/unSubscribe/:_id', verifyLogin, async function (req, res, next) {
//   await db.get().collection(collection.AMBULANCE_COLLECTION).findOneAndUpdate(
//     { _id: ObjectID(req.params._id) },
//     {
//       $set:
//       {
//         status: "unSubscribe",
//         subEnddate: "",
//       }
//     }).then(async (result) => {
//       // //console.log(result.value)

//       res.redirect('back');
//     })

// });
router.get('/view-expiringAmbulance', verifyLogin, async function (req, res, next) {
  var status = "Expiring Ambulance "
  let list = await db.get().collection(collection.EXPIRING_COLLECTION).find({}).project({ _id: 0, ambulance: 1 }).toArray()
  var data = list[0].ambulance
  // console.log(data)
  res.render('admin/ambulance/expiringAmbulanceList', { login: true, data, status })

});
router.get('/view-ambulance/unSubscribe/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.AMBULANCE_COLLECTION).findOneAndUpdate(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "unSubscribe",
        subEnddate: "",
      }
    }).then(async (result) => {
      res.redirect('back');
      await db.get().collection(collection.EXPIRING_COLLECTION)
        .updateOne(
          {
          },
          {
            $pull: {
              ambulance: {
                _id: ObjectID(req.params._id),
              }
            }
          },
        )
    })

});
router.get('/view-ambulance/extend/:_id', verifyLogin, async function (req, res, next) {
  var output = await db.get()
    .collection(collection.AMBULANCE_COLLECTION)
    .findOne({ _id: ObjectID(req.params._id) })
  if (output.subEnddate == "") {
    var newdate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  } else {
    var newdate = new Date(output.subEnddate.setFullYear(output.subEnddate.getFullYear() + 1));
  }
  await db.get()
    .collection(collection.AMBULANCE_COLLECTION)
    .updateOne(
      { _id: ObjectID(req.params._id) },
      {
        // $add: ["subEnddate", 365 * 24 * 60 * 60 * 1000],
        $set: {
          subEnddate: newdate,
          // paymentId: req.body.paymentId
        },
      }, (err, result) => {

        db.get().collection(collection.EXPIRING_COLLECTION)
          .updateOne(
            {
            },
            {
              $pull: {
                ambulance: {
                  _id: ObjectID(req.params._id),
                }
              }
            },
          )
        res.redirect('back');
      },
    )

});

//// *************** Product***************************///
router.get('/listOfProducts', verifyLogin, async function (req, res, next) {
  var status = "List Of Products "
  let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().project({ image: 0 }).toArray()
  res.render('admin/products/listOfProducts', { login: true, product, status })

});
router.get('/addProducts', verifyLogin, async (req, res) => {
  res.render('admin/products/addProducts')
})
router.post('/addProducts', verifyLogin, async (req, res) => {
  var image2 = req?.files?.img
  await image2.mv('./uploads/regImages/' + req.body.name + ".png");
  const image = await fs.readFileSync('./uploads/regImages/' + req.body.name + ".png");
  const base64Data = Buffer.from(image).toString('base64');
  fs.unlink('./uploads/regImages/' + req.body.name + ".png", (err, done) => {  // deleting image of the product  
  })
  await db.get()
    .collection(collection.PRODUCT_COLLECTION)
    .insertOne(
      {
        Name: req.body.name,
        link: req.body.link,
        details: req.body.details,
        image: base64Data,
      }
    )
    .then(async (result) => {

      res.redirect('listOfProducts');
      // req.session.registrationSuccess = true;
    })

})
router.get('/delete-product/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.PRODUCT_COLLECTION).deleteOne(
    { _id: ObjectID(req.params._id) }
  ).then(() => {
    res.redirect('back');
  })
});
module.exports = router;
