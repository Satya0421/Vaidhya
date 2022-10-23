const express = require("express");
var fs = require('fs');
const bcrypt = require('bcrypt');
var router = express.Router();
var collection = require("../config/collections");
var db = require("../config/connection");
const ObjectID = require("mongodb").ObjectID;
const verifyLogin = (req, res, next) => { // to verify the session is valid or not
  if (req.session.loggedIn) {
    next()
  }
  else
    res.redirect("/admin/VidhyA/login",)
}
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
            var mailOption = {
              from: 'pilasa.ae@gmail.com',
              to: 'sibinjames.sibin@gmail.com',
              subject: 'sucessfull Login ',
              html: `<h3>Sucessfully LoggedIn <h3>`
            };
            transport.sendMail(mailOption, function (error, info) {
            });
            req.session.loggedIn = true
            req.session.user = user._id
            res.redirect('/admin/VidhyA/') // redirect used to access same page which is accessed before
          }
          else {
            req.session.loginerr = true  //seting up the login error
            res.redirect('back')
          }
        })
      }
    });
})

router.get('/', verifyLogin, async (req, res) => {
  let superImage = await db.get().collection(collection.SUPER_COLLECTION).find().toArray()
  res.render('admin/admin-home', { login: true, superImage })
})

router.post('/Add-superImage', verifyLogin, async function (req, res, next) {
  //  (req.files)
  if (req.files.Image) {
    let image = req.files.Image
    image.mv('./uploads/superImage/' + req.files.Image.name)
    await db.get()
      .collection(collection.SUPER_COLLECTION)
      .insertOne({
        imgName: req.files.Image.name
      })
      .then((result) => {
        res.redirect("/admin/VidhyA/");
      })

      .catch(() => {
        res.status(500).json();
      });
  }
});

router.get('/delete-superImage/:_id/:imgName', verifyLogin, async function (req, res, next) {
  await db.get()
    .collection(collection.SUPER_COLLECTION)
    .removeOne({
      _id: ObjectID(req.params._id)
    })
    .then((result) => {
      if (result.result.ok == 1) {
        res.redirect("/admin/VidhyA/");
        fs.unlink('./uploads/superImage/' + req.params.imgName, (err, done) => {  // deleting image of the product
          if (!err) {
            res.status(200).json();
          }
        })
      }
    })
    .catch(() => {
      res.status(500).json();
    });
}
);

router.get('/church-report', verifyLogin, async (req, res) => {
  let report = await db.get().collection(collection.CHURCH_REPORT_COLLECTION).find().toArray()
  res.render('admin/church/church-report', { login: true, report })
})

router.get('/view-inactiveChurch', verifyLogin, async function (req, res, next) {
  var status = "InActive "
  let church = await db.get().collection(collection.CHURCH_COLLECTION).find({ status: "inactive" }).toArray()
  res.render('admin/church/view-InactiveChurch', { login: true, church, status })

});
router.get('/view-activeChurch', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let church = await db.get().collection(collection.CHURCH_COLLECTION).find({ status: "active" }).toArray()
  res.render('admin/church/view-InactiveChurch', { login: true, church, status })

});
router.get('/view-deletedChurch', verifyLogin, async function (req, res, next) {
  var status = "Deleted"
  let church = await db.get().collection(collection.CHURCH_COLLECTION).find({ status: "deleted" }).toArray()
  res.render('admin/church/view-InactiveChurch', { login: true, church, status })

});

router.get('/view-blockChurch', verifyLogin, async function (req, res, next) {
  var status = "blocked  "
  let church = await db.get().collection(collection.CHURCH_COLLECTION).find({ status: "block" }).toArray()
  res.render('admin/church/view-InactiveChurch', { login: true, church, status })

});
router.get('/view-churches/:_id', verifyLogin, async function (req, res, next) {
  let church = await db.get().collection(collection.CHURCH_COLLECTION).findOne({ _id: ObjectID(req.params._id) })
  //(church)
  res.render('admin/church/view-church', { login: true, church })

});
router.get('/getChurch', verifyLogin, async function (req, res, next) {
  res.render('admin/church/searchChurch', { login: true })

});
router.post('/getChurch', verifyLogin, async function (req, res, next) {
  let church = await db.get().collection(collection.CHURCH_COLLECTION).findOne({ _id: ObjectID(req.body.search) })
  //(church)
  res.render('admin/church/searchChurch', { login: true, church })

});

router.post('/view-churches/:_id', verifyLogin, async (req, res) => {
  // (req.body)
  await db.get().collection(collection.CHURCH_COLLECTION).updateOne(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        username: req.body.username,
        lvl: req.body.lvl,
        phone: req.body.phone,
        district: req.body.district,
        place: req.body.place,
        state: req.body.state,
        booking_table: req.body.booking ? req.body.booking : 1,
        saint: req.body.saint,
        about: req.body.about,
        priest: {
          name: req.body.priestName,
          phone: req.body.priestPhone
        },
        nation: req.body.nation,
        pincode: req.body.pincode


      }
    }).then(() => {
      res.redirect('back');
    })
});

router.post('/update-image/:_id', verifyLogin, async function (req, res, next) {
  if (req.files.Image) {
    let image = req.files.Image
    await image.mv('./uploads/churchImages/' + req.params._id + '.jpg'), (err) => {
      if (!err) {
        res.redirect('back');
      }
    }
  }

});



router.get('/view-churches/active/:_id/:username', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.CHURCH_COLLECTION).updateOne(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        lvl: "5",
        status: "active"
      }
    }).then(async () => {
      var church = await db.get().collection(collection.CHURCH_MASS_BOOKING).findOne({ _id: ObjectID(req.params._id) })
      if (church == null) {
        await db.get().collection(collection.CHURCH_MASS_BOOKING).insertOne({ _id: ObjectID(req.params._id) }).then(async (response) => {
          await db.get().collection(collection.CHURCH_ANNOUNCEMENT).insertOne({ _id: ObjectID(req.params._id) }).then(async (response) => {
            await db.get().collection(collection.CHURCH_PAYMENT_LIST).insertOne({ _id: ObjectID(req.params._id), balance: 0 }).then(async (response) => {
              await db.get().collection(collection.CHURCH_PAYMENTS_TRANSACTION_BACKUP).insertOne({ _id: ObjectID(req.params._id) }).then(async (response) => {
                await db.get().collection(collection.CHURCH_PAYMENTS_TRANSACTION).insertOne({ _id: ObjectID(req.params._id) }).then(async (response) => {
                  await db.get().collection(collection.WITHDRAW_REQUESTS).insertOne({ _id: ObjectID(req.params._id) }).then(async (response) => {
                    var mailOption = {
                      from: 'pilasa.ae@gmail.com',
                      to: req.params.username,
                      subject: 'Pilasa Activated',
                      html: `<h3>Welcome to Pilasa<h3>,
           your pilasa Account is Successfully 
           Activated.<br>Enjoy our service",`
                    };

                    transport.sendMail(mailOption, function (error, info) {
                      if (error)
                        (error);
                      else
                        ('email Sent:' + info.response);
                    });
                  });
                  res.redirect('back');
                })
              })
            })
          })
        })
      }
      res.redirect('back');
    })
});
router.get('/view-churches/block/:_id', verifyLogin, async function (req, res, next) {
  //(req.params._id)
  await db.get().collection(collection.CHURCH_COLLECTION).updateOne(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        lvl: "4",
        status: "block"

      }
    }).then(() => {
      res.redirect('back');
    })
});

router.get('/view-activeUser', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let beliver = await db.get().collection(collection.BELIVERS).find({ status: "active" }).toArray()
  res.render('admin/users/viewUser', { login: true, beliver, status })

});
router.get('/view-InactiveUser', verifyLogin, async function (req, res, next) {
  var status = "Active "
  let beliver = await db.get().collection(collection.BELIVERS).find({ status: "inactive" }).toArray()
  res.render('admin/users/viewUser', { login: true, beliver, status })

});
router.get('/view-blockedUser', verifyLogin, async function (req, res, next) {
  var status = "blocked  "
  let beliver = await db.get().collection(collection.BELIVERS).find({ status: "block" }).toArray()
  res.render('admin/users/viewUser', { login: true, beliver, status })

});

router.get('/blockUser/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.BELIVERS).updateOne(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "block"
      }
    }).then(() => {
      res.redirect('back');
    })
});

router.get('/activeUser/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.BELIVERS).updateOne(
    { _id: ObjectID(req.params._id) },
    {
      $set:
      {
        status: "active",
        lvl: "2",
      }
    }).then(async () => {
      var user = await db.get().collection(collection.BELIVERS_CART).findOne({ _id: ObjectID(req.params._id) })
      if (user == null) {
        await db.get().collection(collection.BELIVERS_CART).insertOne({ _id: ObjectID(req.params._id) }).then(async (response1) => {
          await db.get().collection(collection.BELIVER_PAYMENTS_CART).insertOne({ _id: ObjectID(req.params._id) }).then(async (response) => {
          })
        })
      }

      res.redirect('back');
    })
});

router.get('/view-churchPost', verifyLogin, async function (req, res, next) {
  let post = await db.get().collection(collection.CHURCH_POST).find({ content: { $exists: true } }).sort({ _id: -1 }).toArray()
  res.render('admin/church/view-posts', { login: true, post })

});
router.get('/deletePost/:_id', verifyLogin, async function (req, res, next) {
  await db.get().collection(collection.CHURCH_POST).deleteOne(
    { _id: ObjectID(req.params._id) }
  ).then(() => {
    res.redirect('back');
  })
});
router.get('/reset-password', verifyLogin, async (req, res) => {
  var num = await crypto.randomBytes(Math.ceil(6)).toString('hex').slice(0, 6);
  await db.get()
    .collection(collection.ADMIN_COLLECTION)
    .updateOne(
      { username: 'Sibin.Aikara@12/02/1996#manU' },
      {
        $set: {
          code: num
        },
      },
      async (err, profile) => {
        if (err) return res.status(500).send({ msg: "Error to process...Try once more" });
        if (profile.modifiedCount == 1) {
          var mailOption = {
            from: 'pilasa.ae@gmail.com',
            to: 'sibinjames.sibin@gmail.com',
            subject: 'Pilasa one time code',
            html: `one time code for reset is is<h3>` + num + '<h3>'
          };
          await transport.sendMail(mailOption, function (error, info) {
            res.render('admin/resetpassword', { login: true })
          });
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
      .findOne({ username: 'Sibin.Aikara@12/02/1996#manU' }, async (err, user) => {
        await bcrypt.compare(req.body.currentpassword, user.password).then(async (status) => {
          if (status) {
            req.body.newpassword = await bcrypt.hash(req.body.newpassword, 08);
            // (req.body.password)
            await db.get()
              .collection(collection.ADMIN_COLLECTION)
              .updateOne(
                { $and: [{ username: 'Sibin.Aikara@12/02/1996#manU' }, { code: req.body.code }] },
                {
                  $set: {
                    password: req.body.newpassword,
                    code: null
                  },
                }, (err, result) => {
                  if (err) return res.send(err);
                  if (result.modifiedCount == 1) {
                    res.redirect("/admin/VidhyA/login");
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
  res.redirect("/admin/VidhyA/login")
});
router.get('/view-activePayment', verifyLogin, async function (req, res, next) {
  var status = "Active Payments "
  let requests = await db.get().collection(collection.WITHDRAW_REQUESTS).aggregate(
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
        date: '$requests.date',
        status: '$requests.status',
        amt: '$requests.amount',
      }
    }
  ).toArray();
  res.render('admin/payment/view-activePayment', { login: true, requests, status })

});
router.get('/view-closedPayments', verifyLogin, async function (req, res, next) {
  var status = "Closed Payments "
  let requests = await db.get().collection(collection.WITHDRAW_REQUESTS).aggregate(
    // {
    //   $match: { _id: ObjectID(req.decoded._id) }
    // },
    {
      $unwind: '$requests'
    },
    {
      $match: { 'requests.status': "Transferred" }
    },
    {
      $project: {
        date: '$requests.date',
        status: '$requests.status',
        amt: '$requests.amount',
      }
    }
  ).toArray();
  res.render('admin/payment/view-activePayment', { login: true, requests, status })

});
// /:_id/:date/:amt
router.get('/viewPayment/:_id/:dd/:mm/:yyyy/:amt', verifyLogin, async (req, res) => {
  date = req.params.dd + "/" + req.params.mm + "/" + req.params.yyyy;
  let requests = await db.get().collection(collection.WITHDRAW_REQUESTS).aggregate([
    {
      $match: { _id: ObjectID(req.params._id) }
    },
    {
      $unwind: '$requests'
    },
    {
      $match: { 'requests.amount': parseInt(req.params.amt), 'requests.date': date }
    },
    {
      $project: {
        date: '$requests.date',
        status: '$requests.status',
        amt: '$requests.amount',
        payDate: '$requests.payDate',
        trId: '$requests.trId',
      }
    }
  ]).toArray();
  var result = requests[0];
  let church = await db.get().collection(collection.CHURCH_COLLECTION).findOne({ _id: ObjectID(req.params._id) })

  res.render('admin/payment/viewPayment', { login: true, result, church })
});
router.post('/viewPayment/:_id/:dd/:mm/:yyyy/:amt', async (req, res) => {
  let requests = await db.get().collection(collection.WITHDRAW_REQUESTS).updateOne(
    {
      _id: ObjectID(req.params._id)
    },
    {
      $set: { 'requests.$[inds].payDate': req.body.payDate == "" ? new Date() : req.body.payDate, 'requests.$[inds].trId': req.body.trId, 'requests.$[inds].status': 'Transferred' }
    },
    {
      "arrayFilters": [{ "inds.amount": parseInt(req.body.amt), "inds.date": req.body.date }]
    },
  ).then((result, err) => { })
  res.redirect('back');
});

router.get('/view-recentPayments', verifyLogin, async function (req, res, next) {
  var today = new Date();
  var todayDate = today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear()
  var status = "Recent Payments "
  let Payments = await db.get().collection(collection.CHURCH_PAYMENTS_TRANSACTION).aggregate(
    // {
    //   $match: { _id: ObjectID(req.decoded._id) }
    // },
    {
      $unwind: '$payments'
    },
    {
      $project: {
        pay_id: '$payments.pay_id',
        razoId: '$payments.razoId',
        name: '$payments.name',
        type: '$payments.type',
        amt: '$payments.amt',
        phone: '$payments.phone',
        comment: '$payments.comment',
      }
    }
  ).sort({ 'payments.pay_id': -1 }).limit(200).toArray();
  res.render('admin/payment/payments', { login: true, Payments, status })

});
router.get('/view-churchRecentPayment', verifyLogin, async function (req, res, next) {
  var status = "Church Recent Payment "
  res.render('admin/payment/church_recentPayment', { login: true, status })

});
router.post('/view-churchRecentPayment', verifyLogin, async function (req, res, next) {
  var status = "Church Recent Payment "
  let payments = await db.get().collection(collection.CHURCH_PAYMENTS_TRANSACTION).findOne({ _id: ObjectID(req.body._id) })
  let result = payments.payments
  res.render('admin/payment/church_recentPayment', { login: true, result, status })

});


router.get('/view-churchOldPayment', verifyLogin, async function (req, res, next) {
  var status = "Church Old Payment "
  res.render('admin/payment/church_oldPayments', { login: true, status })

});
router.post('/view-churchOldPayment', verifyLogin, async function (req, res, next) {
  var status = "Church Old Payment "
  let payments = await db.get().collection(collection.CHURCH_PAYMENTS_TRANSACTION_BACKUP).find({ _id: ObjectID(req.body._id) }).sort({ 'payments.pay_id': -1 }).toArray()
  let result = payments[0].payments
  res.render('admin/payment/church_oldPayments', { login: true, result, status })

});

router.get('/user_payments', verifyLogin, async function (req, res, next) {
  var status = "Beliver Payment "
  res.render('admin/payment/user_payments', { login: true, status })

});
router.post('/user_payments', verifyLogin, async function (req, res, next) {
  var status = "Beliver Payment "
  let payments = await db.get().collection(collection.BELIVER_PAYMENTS_CART).findOne({ _id: ObjectID(req.body._id) })
  let result = payments.payments
  res.render('admin/payment/user_payments', { login: true, result, status })

});
router.get('/user_payments', verifyLogin, async function (req, res, next) {
  var status = "user Payments "
  let church = await db.get().collection(collection.BELIVER_PAYMENTS_CART).find({ status: "active" }).toArray()
  res.render('admin/payment/view-activePayment', { login: true, church, status })

});
router.get('/detailed_payment/:chId/:payId/:chname', verifyLogin, async function (req, res, next) {
  var churchname = req.params.chname;
  var churchId = req.params.chId;
  var output;
  await db.get().collection(collection.CHURCH_PAYMENTS_TRANSACTION).aggregate([
    {
      $match: { _id: ObjectID(req.params.chId) }
    },
    {
      $unwind: '$payments'
    },
    {
      $match: { 'payments.pay_id': ObjectID(req.params.payId) }
    },
    {
      $project: { _id: 0, 'payments.pay_id': 0, 'payments.razoId': 0 }
    }
  ]).toArray()
    .then((result) => {

      if (result) {
        output = result[0].payments;

      }
      else {
        output = result
      }
    })
  res.render('admin/payment/detailed_payment', { login: true, output, churchname, churchId })

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
router.post('/addcities', async (req, res) => {
  await db.get().collection(collection.LISTOFITEMS)
    .updateOne(
      {
        _id: ObjectID('633fc9dce4f51a74f8e8cac3'),
      },
      {
        $push: {
          cities: {
            $each: req.body.city,
            $sort: { city: 1},
            //  $slice: 3
          }
        }
      },
      )
      res.json();        
})
module.exports = router;
