const express = require("express");
const session = require('express-session')
var body_parser=require('body-parser');
const cron = require("node-cron");
// var fs=require('fs');
var cookieParser = require('cookie-parser');
var path = require('path');
var hbs=require('express-handlebars');
var db=require('./config/connection');
var collection = require("./config/collections")
const fileUpload = require('express-fileupload');
const ObjectID = require("mongodb").ObjectID
//  const checksum_lib = require('./checksum');
const port = process.env.PORT || 3000;
const app = express();
db.connect((err)=>{
  if(err)
  console.log("mongo connection error "+err)
  else
  console.log("mongo connected")
});
app.use(express.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialDir:__dirname+'/views/partials/'}))
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'hbs');
// app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout', layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials'}));
// app.use(body_parser.urlencoded({extended:false}));
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'hbs');
// app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout', layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials'}))
// app.use(body_parser.urlencoded({extended:false}));
// app.use(cookieParser());
// app.use(session({secret:"Aikara", resave: false,saveUninitialized: true,cookie:{maxAge: 90000000}}));
// app.use(fileUpload({ safeFileNames: true, preserveExtension: true })); 

app.use("/uploads", express.static("uploads"));
const usersRoute = require("./routes/users");
app.use("/users", usersRoute);
const adminRoute = require("./routes/admin");
app.use("/admin/VidhyA", adminRoute);
const doctorRoute = require("./routes/doctors");
app.use("/doctors", doctorRoute);



 app.route("/").get((req, res) => 
 res.render("pilasa"));
// app.route("/termsAndConditions").get((req, res) => 
// res.render("terms"));
// cron.schedule("*/25 * * * * *", async function() {
//   var dates="25-05-2022";
//   console.log(dates);
//   await db.get().collection(collection.DOCTORSPAYMENT).findOne({ _id: ObjectID(req.decoded._id) }).then((result)=>{
//     if(result)
//     {
//       console.log(result)
//       // res.status(200).json({_id:result._id,balance:result.balance, grandtotal: result.grandtotal,requests: result.requests.slice(0,100) });
//     }
//    })

  // await db.get().collection(collection.BOOKINGS).find().forEach(i => {
  //   db.get().collection(collection.BOOKINGS).update(
  //    {
  //      _id: ObjectID(i._id)
  //    },
  //    {
  //      $pull: { appointments: { date: dates } }
  //    }
 
  //  ).then(async (result, err) => {
  //    console.log(result)
  //    res.json()
  //  })
//  });
  // });
  // cron.schedule("*/25 * * * * *",   () => {
  //   var dates="25-05-2022";
  //   console.log(dates);
  //    var result=   db.get().collection(collection.BOOKINGS).find().forEach(i => {
  //          db.get().collection(collection.BOOKINGS).updateMany(
  //           {
  //             _id: ObjectID(i._id)
  //           },
  //           {
  //             $pull: { appointments: { date: dates } }
  //           }
        
  //         )});
  // console.log(result)
  //   } )

app.use(function (req, res, next) {
  res.render("error");
});

app.listen(port, "0.0.0.0", () =>
  console.log(`welcome your listernig at port ${port}`)
);// 0.0.0.0 for access through local host
