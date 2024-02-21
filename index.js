process.env.UV_THREADPOOL_SIZE = 12
const express = require("express");
const session = require('express-session')
var body_parser = require('body-parser');
const cron = require("node-cron");
var fs = require('fs');
var cookieParser = require('cookie-parser');
var path = require('path');
var hbs = require('express-handlebars');
var db = require('./config/connection');
var collection = require("./config/collections")
const fileUpload = require('express-fileupload');
const ObjectID = require("mongodb").ObjectID
var compression = require('compression')
// const helmet = require("helmet");
//  const checksum_lib = require('./checksum');
const port = process.env.PORT || 3000;
const app = express();
db.connect((err) => {
  if (err)
    console.log("mongo connection error " + err)
  else
    console.log("mongo connected")
});
app.use(express.json());
app.use(compression({ level: 9, threshold: 0, filter: () => true }))
//  app.use(helmet());
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialDir: __dirname + '/views/partials/', }))
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'hbs');
// app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout', layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials'}));
// app.use(body_parser.urlencoded({extended:false}));
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'hbs');
// app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout', layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials'}))
// app.set('trust proxy', 1);
app.use(body_parser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: "Aikara", resave: false, saveUninitialized: true, cookie: { maxAge: 90000000 } }));
app.use(fileUpload({ safeFileNames: true, preserveExtension: true }));
app.use("/uploads", express.static("uploads"));
const usersRoute = require("./routes/users");
app.use("/users", usersRoute);
const adminRoute = require("./routes/admin");
app.use("/adminPanel/VidhyA789/", adminRoute);
const doctorRoute = require("./routes/doctors");
app.use("/doctors", doctorRoute);
const websiteRoute = require("./routes/registration");
app.use("/register", websiteRoute);
//  app.route("/").get((req, res) => 
//  res.render("pilasa"));
app.route("/").get((req, res) =>
  res.render("website"));
app.route("/termsAndConditions").get((req, res) =>
  res.render("terms"));
app.route("/DrtermsAndConditions").get((req, res) =>
  res.render("drterms"));
  app.route("/docsubScribeTerms").get((req, res) =>
  res.render("drsubterms"));
  app.route("/docsubScribePrivacy").get((req, res) =>
  res.render("drsubprivacy"));
//   app.get('/deleteDaily', async (req, res) => {
//     var date= new Date();
//    var dates=date.getDate().toString().padStart(2, '0')+"-"+(date.getMonth()+1).toString().padStart(2, '0')+'-'+date.getFullYear();
//  console.log(dates)
//    var result=   db.get().collection(collection.BOOKINGS).find().forEach(i => {
//            db.get().collection(collection.BOOKINGS).updateMany(
//             {
//               _id: ObjectID(i._id)
//             },
//             {
//               $pull: { appointments: { date: dates } }
//             }

//           )});
//           res.json();
//   });
// app.get('/deleteDaily', async (req, res) => {
//   var date= new Date();
//  var dates=date.getDate().toString().padStart(2, '0')+"-"+(date.getMonth()+1).toString().padStart(2, '0')+'-'+date.getFullYear();
// console.log(dates)
// db.get().collection(collection.BOOKINGS).updateMany(
//   { },
//   { $pull: { appointments:  { date: dates  }}},
//   { multi: true }
//   )
//         res.json();
// });
// app.get('/hourlydelete', async (req, res) => {
//     var date = new Date();
//     var dates = date.getDate().toString().padStart(2, '0') + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getFullYear();
//     var time = date.getHours().toString().padStart(2, '0') + (date.getMinutes() + 1).toString().padStart(2, '0');
//       db.get().collection(collection.BOOKINGS).updateMany(
//         { },
//         { $pull: { appointments:  { date: dates, time: {$lte : time } }   } },
//         { multi: true }
//         ).then((result)=>{
//          console.log(result)
//         })
// });
cron.schedule("50 18 * * *", async () => {
  var date = new Date();
  var dates = date.getDate().toString().padStart(2, '0') + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getFullYear();
  //  console.log(dates)
  await db.get().collection(collection.BOOKINGS).updateMany(
    {},
    { $pull: { appointments: { date: dates } } },
    { multi: true }
  );
});
cron.schedule("0 * * * *", async () => {
  var date = new Date();
  var dates = date.getDate().toString().padStart(2, '0') + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getFullYear();
  var time = date.getHours().toString().padStart(2, '0') + (date.getMinutes() + 1).toString().padStart(2, '0');
  await db.get().collection(collection.BOOKINGS).updateMany(
    {},
    { $pull: { appointments: { date: dates, time: { $lte: time } } } },
    { multi: true }
  );
});

cron.schedule('0 2 * * 0', async () => {
  var doctorResult =
    await db.get().collection(collection.DOCTORS).find(
      {
        subEnddate: {
          $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        status: "active"
      }
    ).project({ name: 1, phone: 1, subEnddate: 1 }).toArray()
  // res.send(doctorResult)
  var hospiatlResult =
    await db.get().collection(collection.HOSPITAL_COLLECTION).find(
      {
        subEnddate: {
          $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        status: "Active"

      }
    ).project({ Name: 1, phone: 1, subEnddate: 1 }).toArray()
  // console.log(hospiatlResult)
  var nurseresult =
    await db.get().collection(collection.NURSE_COLLECTION).find(
      {
        subEnddate: {
          $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        status: "Active"

      }
    ).project({ Name: 1, phone: 1, subEnddate: 1 }).toArray()
  var labsresult =
    await db.get().collection(collection.LABS_COLLECTION).find(
      {
        subEnddate: {
          $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        status: "Active"

      }
    ).project({ Name: 1, phone: 1, subEnddate: 1 }).toArray()
  var pharmacyresult =
    await db.get().collection(collection.PHARMACY_COLLECTION).find(
      {
        subEnddate: {
          $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        status: "Active"

      }
    ).project({ Name: 1, phone: 1, subEnddate: 1 }).toArray()
  var ambulanceResult =
    await db.get().collection(collection.AMBULANCE_COLLECTION).find(
      {
        subEnddate: {
          $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        status: "Active"

      }
    ).project({ Name: 1, phone: 1, subEnddate: 1 }).toArray()
  await db.get().collection(collection.EXPIRING_COLLECTION).updateOne(
    {

    },
    {
      $set: {
        doctors: doctorResult,
        hospital: hospiatlResult,
        nurse: nurseresult,
        lab: labsresult,
        pharmacy: pharmacyresult,
        ambulance: ambulanceResult
      },
    }

  )
});
app.use(function (req, res, next) {
  res.render("error");
});

app.listen(port, "0.0.0.0", () =>
  console.log(`welcome your listernig at port ${port}`)
);// 0.0.0.0 for access through local host
// app.get("/subscriptionenduser", async (req, res) => {
//   await db.get()
//     .collection(collection.DOCTORS)
//     .find({ subEnddate: { $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) } })
// });