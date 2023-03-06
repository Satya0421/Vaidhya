const express = require("express");
var fs = require('fs');
const bcrypt = require('bcryptjs');
var router = express.Router();
var collection = require("../config/collections");
var db = require("../config/connection");
const ObjectID = require("mongodb").ObjectID;
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
            req.body.newpassword = await bcrypt.hash(req.body.newpassword, 08);
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
          imgName: req.files.Image.name
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
router.get('/view-activeDoctors', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let doctors = await db.get().collection(collection.DOCTORS).find({ status: "active" }).toArray()
  res.render('admin/doctors/view-InactiveDoctors', { login: true, doctors, status })

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

router.get('/view-doctors/active/:_id/:username', verifyLogin, async function (req, res, next) {
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
          location: result.value.location,
          address: result.value.address,
          name: result.value.name,
          rating:0,
          totalRating:0,
          balance: 0, 
          grandtotal: 0 
        }).then(async (response) => {
            await db.get().collection(collection.DOCTORSREVIEW).insertOne({ _id: ObjectID(req.params._id),}).then(async (response) => {
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
  console.log(result)
  res.render('admin/payment/viewPayment', { login: true, result })
});
router.post('/viewPayment/:_id/:reqid/:amt', async (req, res) => {
 
  if(req.body.trId == null)
  {
    res.redirect('back');
  }
  else{
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
  if(req.body._id =="")
  {
    res.redirect('back');
  }
  else
  {
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
  if(req.body._id =="")
  {
    res.redirect('back');
  }
  else
  {
  let payments = await db.get().collection(collection.USERSAPPOINTMENT).findOne({ _id: ObjectID(req.body._id) })
  var result=[];
  if(payments!=null){
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
  if(req.body._id =="")
  {
    res.redirect('back');
  }
  else
  {
  var status = "Doctors Booking"
  let bookings = await db.get().collection(req.body.month+"-"+req.body.year).findOne({ _id: ObjectID(req.body._id) })
  var result=[];
  if(bookings!=null){
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
//// *************** list of cities***************************///
router.get('/addcities', verifyLogin, async function (req, res, next) {
  var status = "Locations "
  var out=await db.get().collection(collection.LISTOFITEMS).find().toArray();
  // {projection: { _id: 0, cities: 1 }}
  if(out[0].cities != "")
  {
   var result=out[0].cities;
  // //console.log(result)
   res.render('admin/listdata/locationList', { login: true, status,result})
  }
  else
  {
    res.redirect('back');
  }
  
});
router.post('/addcities', verifyLogin, async (req, res) => {

if( req.body.city==''||req.body.longtitude==''||req.body.latitude=='')
{
  res.redirect('back');
}else{
  var city= [{
    "city":req.body.city,
   "longtitude":req.body.longtitude,
   "latitude":req.body.latitude,
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
router.get('/addDepartment', verifyLogin, async function (req, res, next) {
  var status = "Departments "
  var out=await db.get().collection(collection.LISTOFITEMS).find().toArray();
  // {projection: { _id: 0, cities: 1 }}
  if(out[0].departments != "")
  {
   var result=out[0].departments;
  // //console.log(result)
   res.render('admin/listdata/departmentList', { login: true, status,result})
  }
  else
  {
    res.redirect('back');
  }
  
});
router.post('/addDepartment', verifyLogin, async (req, res) => {
//console.log(req.body.department)
if( req.body.department=='')
{
  res.redirect('back');
}else{
  await db.get().collection(collection.LISTOFITEMS)
    .updateOne(
      {
        _id: ObjectID('633fc9dce4f51a74f8e8cac3'),
      },
      {
        $push: {
          departments:  req.body.department
        }
      },
    )
    res.redirect('back');
}
})
router.get('/deleteDepartment/:department', verifyLogin, async (req, res) => {
  await db.get().collection(collection.LISTOFITEMS)
    .updateOne(
      {
        _id: ObjectID('633fc9dce4f51a74f8e8cac3'),
      },
      {
        $pull: {
          departments: 
            req.params.department,
        }
      },
    )
    res.redirect('back');
})
module.exports = router;
