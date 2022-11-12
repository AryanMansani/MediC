const express = require("express");
const app = express();
const https = require('https');
const request = require('request')
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const fs = require('fs');
const reader = require('xlsx');
const excel = require('excel4node');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltR = 11;
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
const nodemailer = require('nodemailer');
const  {google}  = require('googleapis');
const OAuth2 = google.auth.OAuth2
var docID = "";

class Pat{
constructor(name,date,time,id) {
this.date = date;
this.time = time;
this.name = name;
this.id = id;

}
};
var pats = [];

app.use(express.static("public"));
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/mediC", {
  useNewUrlParser: true
});


const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  date: String,
  time: String,
});

const docSchema = new mongoose.Schema({
  username:String,
  email:String,
  password: String,
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

docSchema.plugin(passportLocalMongoose);
docSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Doc  = new mongoose.model("Doc",docSchema);

// passport.use('userLocal', new LocalStrategy(User.authenticate()));
// passport.use('clientLocal', new LocalStrategy(Client.authenticate()));

passport.use("user-local",User.createStrategy());
passport.use("doc-local",Doc.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});




var storage = multer.diskStorage({
  destination: function(req, file, cb) {

    cb(null, "uploads")
  },
  filename: function(req, file, cb) {
    cb(null, "Report" + ".pdf")
  }
})

const maxSize = 10 * 1000 * 1000;

var upload = multer({
  storage: storage,
  limits: {
    fileSize: maxSize
  },
  fileFilter: function(req, file, cb) {

    var filetypes = /pdf/;
    var mimetype = filetypes.test(file.mimetype);

    var extname = filetypes.test(path.extname(
      file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb("Error: File upload only supports the " +
      "following filetypes - " + filetypes);
  }

}).single("pdf");


app.get("/del", function(req, res) {

  res.render("temp", {
    user: "Badshah"
  });


});

app.get("/sendmail",async function(req,res){



   const CLIENT_EMAIL = "medicy.org@gmail.com";
   const CLIENT_ID = "231275949933-7eg4qs1jo091qb5d3enkd2dvp1m7a865.apps.googleusercontent.com";
   const CLIENT_SECRET = "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";
   const REDIRECT_URI = "https://developers.google.com/oauthplayground";
   const REFRESH_TOKEN = "1//04BgjaccLafipCgYIARAAGAQSNwF-L9IrqAM4PyivFDIUl2FaFamCpr01whXiTDGM8Kgspjhn8CTvUSh63igLwHq0gtKqRUkG4Mo";
   const OAuth2Client = new google.auth.OAuth2(
     CLIENT_ID,
     CLIENT_SECRET,
     REDIRECT_URI,
   );


   OAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
   try {
     // Generate the accessToken on the fly
     const accessToken = await OAuth2Client.getAccessToken();

     console.log(accessToken);

    // Create the email envelope (transport)
     const transport = nodemailer.createTransport({
       service: 'gmail',
       auth: {
         type: 'OAuth2',
         user: CLIENT_EMAIL,
         clientId: CLIENT_ID,
         clientSecret: CLIENT_SECRET,
         refreshToken: REFRESH_TOKEN,
         accessToken: accessToken,
       },
     });

     console.log("here");
     // Create the email options and body
     // ('email': user's email and 'name': is the e-book the user wants to receive)
     const mailOptions = {
       from: `FRONT <${CLIENT_EMAIL}>`,
       to: "mr.aryan.7159@gmail.com",
       subject: `[FRONT]- Here is your e-Book!`,
       html: `Enjoy learning!`,

     };
     // Set up the email options and delivering it
     console.log(1);
     const result = await transport.sendMail(mailOptions);
     console.log(2);
     return result;

   } catch (error) {
     return error;
   }

});

app.get("/report", function(req, res) {
  fs.unlink('uploads/Report.pdf', function(err) {
    if (err && err.code == 'ENOENT') {
      // file doens't exist
      console.info("File doesn't exist, won't remove it.");
    } else if (err) {
      // other errors, e.g. maybe we don't have enough permission
      console.error("Error occurred while trying to remove file");
    } else {
      console.info(`Removed old Pdf`);
    }
  });


  if (req.isAuthenticated()) {

    res.render("fileUpload", {
      user: req.user.username
    });
  } else {
    res.render("fileUpload", {
      user: "NULL"
    });
  }

});




app.post("/login", function(req, res) {


  var user = req.body.username;
  var pass = req.body.password;

  // console.log(user);
  // console.log(pass);


  const Us = new User({
    username: user,
    password: pass
  });

  req.login(Us, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("user-local")(req, res, function() {
        res.redirect("/")
      });

    }
  })



});


app.post("/register", function(req, res) {


  var Nemail = req.body.email;
  var Npass = req.body.password;
  var Nuser = req.body.username;
  console.log(Nemail);
  console.log(Npass);
  console.log(Nuser);

  User.register({
    username: req.body.username,
    email: req.body.email
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("user-local")(req, res, function() {
        console.log("Saved");
        res.redirect("/")
      });
    }
  });




});

app.post("/book",async function(req,res){






console.log(req.body);

var user_id = req.user._id.toString();
console.log(user_id);

User.findByIdAndUpdate(user_id, { date: req.body.date.toString(),time: req.body.time.toString() },
                            function (err, docs) {
    if (err){
        console.log(err)
    }
    else{
        console.log("Updated User : ", docs);
    }
});


  if (req.isAuthenticated()) {
    user = req.user;
    console.log(user);
    var id = docID;
    Doc.findById(id, async function (err, docs) {
        if (err){
            console.log(err);
        }
        else{
            console.log("Result : ", docs);
            docs.patients.push(user);
            docs.save();

            var usern = req.user.username;
            var date  = req.body.date;
            var time =  req.body.time;

            const CLIENT_EMAIL = "medicy.org@gmail.com";
            const CLIENT_ID = "231275949933-7eg4qs1jo091qb5d3enkd2dvp1m7a865.apps.googleusercontent.com";
            const CLIENT_SECRET = "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";
            const REDIRECT_URI = "https://developers.google.com/oauthplayground";
            const REFRESH_TOKEN = "1//04BgjaccLafipCgYIARAAGAQSNwF-L9IrqAM4PyivFDIUl2FaFamCpr01whXiTDGM8Kgspjhn8CTvUSh63igLwHq0gtKqRUkG4Mo";
            const OAuth2Client = new google.auth.OAuth2(
              CLIENT_ID,
              CLIENT_SECRET,
              REDIRECT_URI,
            );


            OAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
            try {
              // Generate the accessToken on the fly
              const accessToken = await OAuth2Client.getAccessToken();

              console.log(accessToken);

             // Create the email envelope (transport)
              const transport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  type: 'OAuth2',
                  user: CLIENT_EMAIL,
                  clientId: CLIENT_ID,
                  clientSecret: CLIENT_SECRET,
                  refreshToken: REFRESH_TOKEN,
                  accessToken: accessToken,
                },
              });
              // Create the email options and body
              // ('email': user's email and 'name': is the e-book the user wants to receive)
              const mailOptions = {
                from: `MEDICY <${CLIENT_EMAIL}>`,
                from: 'contact.acebank@gmail.com',
                to: req.body.email.toString(),
                subject: 'Appointment Booked',
                html: `<h2>Dear ${usern} ,</h2> <h4> Your video consultation is BOOKED for ${date} at ${time}.</h4> <h4> We will send you a reminder on this appointment email or SMS 30 min prior to the appointment.</h4><h4> To join the consultation at the scheduled time using a - Google Chrome, Safari, Microsoft Edge, Mozilla Firefox browser on your computer, click here. </h4> <h4> Thank you </h4> <h4> MediC </h4> <h4> For any further support, please contact us send us an email </h5> `,
               };


              // Set up the email options and delivering it
              const result = await transport.sendMail(mailOptions);


            } catch (error) {
              return error;
            }

            setTimeout(function() {

              res.redirect("/");
            }, 4000);

        }
    });


  }
  else{
    res.redirect("/login");
  }

});


app.get("/docLogin",function(req,res){

res.render("DoctorLoginPage");

});

app.post("/docLogin",function(req,res){


  // req.logout();

  var user = req.body.username;
  var pass = req.body.password;


  Doc.findOne({username: new RegExp('^'+user+'$', "i")}, function(err, doc) {
    res.redirect("/docprofile/"+doc._id.toString());

});

});

app.get("/bookapp/:docID",function(req,res){
  docID = req.params.docID;
  console.log(docID);
  res.render("BookAppointment");
});




app.get("/doctors",function(req,res){

    res.render("doctorsList");

});

app.post("/Dregister", function(req, res) {



  var Nemail = req.body.email;
  var Npass = req.body.password;
  var Nuser = req.body.username;
  console.log(Nemail);
  console.log(Npass);
  console.log(Nuser);

  Doc.register({
    username: req.body.username,
    email: req.body.email
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      // passport.authenticate("doc-local")(req, res, function() {
      //   console.log("Saved");
      //   res.redirect("/")
      // });
      console.log("saved");
    }
  });




});


app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});


app.get("/", function(req, res) {

  if (req.isAuthenticated()) {

    res.render("home", {
      user: req.user.username
    });
  } else {
    res.render("home", {
      user: "NULL"
    });
  }



});

app.get("/login", function(req, res) {

  res.render('login');

});

app.get("/cancel/:pid",function(req,res){
    var pID = req.params.pid;
    console.log(pID);

    Doc.updateOne({ _id:docID }, {
       $pullAll: {
           patients: [{_id:pID}],
       }},function(err,doc) {
         if(err)
         {
           console.log(err);
         }
         else
         {
           console.log(doc);
         }
       });


    var link = "/docprofile/" + docID;
    res.redirect(link);
});

app.get("/docprofile/:docID",function(req,res){

   var id = req.params.docID;
   docID = id;
   var docName;
    let arr = [];
   Doc.findById(id, function (err, docs) {
    if (err){
        console.log(err);
    }
    else{
        docName = docs.username;

       for(i=0;i<docs.patients.length;i++)
        {
          var patientid = docs.patients[i].toString();
          var obj = "NULL";
          User.findById(patientid, function (err, use) {
           if (err){
               console.log(err);

           }
           else
           {

           obj = new Pat(use.username,use.date,use.time,use._id.toString());
           arr.push(obj);










           }

         });


        }







    }

    setTimeout(function() {


      res.render("PatientList.ejs",{user:docName,patients:arr});
    }, 2000);




});


});

app.get("/diet", function(req, res) {

  if (req.isAuthenticated()) {

    res.render("diet", {
      user: req.user.username
    });
  } else {
    res.render("diet", {
      user: "NULL"
    });
  }

});

app.get("/result", function(req, res) {


  const file = reader.readFile('C:/Users/mrary/Desktop/sample/result/Data.xlsx');
  let data = [];
  const sheets = file.SheetNames;
  for (let i = 0; i < sheets.length; i++) {
    const temp = reader.utils.sheet_to_json(
      file.Sheets[file.SheetNames[i]])
    temp.forEach((res) => {
      data.push(res);
    })
  }

  var name = data[0].Name;
  var nname = "";
  for (var i = 0; i < name.length; i++) {
    if ((name[i] >= 'a' && name[i] <= 'z') || (name[i] >= 'A' && name[i] <= 'Z')) {
      nname += name[i];
    }
  }

  // fs.unlink('result/Data.xlsx', function(err) {
  //   if (err && err.code == 'ENOENT') {
  //     // file doens't exist
  //     console.info("File doesn't exist, won't remove it.");
  //   } else if (err) {
  //     // other errors, e.g. maybe we don't have enough permission
  //     console.error("Error occurred while trying to remove file");
  //   } else {
  //     console.info(`Removed the old data file`);
  //   }
  // });

  var hba1 = data[0].HbA1C;
  var chol = data[0].Cholesterol;
  var Trig = data[0].Triglycerides;
  var hdl = data[0].HDL;
  var ldl = data[0].LDL;



  var text = "Diabetic Status - Normal";
  var text2 = "";






  var parameter1 = parseFloat(Trig) / parseFloat(hdl);
  var parameter2 = parseFloat(hdl) / parseFloat(ldl);



  if (parameter1 > 3.75) {
    text2 = "Cardiovascular Health - High Risk";
  } else if (parameter2 > 0.5) {
    text2 = "Cardiovascular Health - Low Risk";

  } else if (parameter2 > 3) {
    text2 = "Cardiovascular Health - Moderate Risk";
  } else if (parameter2 > 6) {
    text2 = "Cardiovascular Health - High Risk";
  }

  console.log(text2);


  if (hba1 > 5.7) {
    text = "Diabetic Status -  pre-diabetic";
  }

  if (hba1 > 6.5) {
    text = "Diabetic Status - Diabetic";
  }
  var user = "NULL";
  if (req.isAuthenticated()) {
    user = req.user.username;
  }


  res.render('result', {
    user: user,
    name: nname,
    hba1c: hba1,
    chol,
    trig: Trig,
    hdl: hdl,
    ldl: ldl,
    text: text,
    text2: text2
  });


});

app.get("/diet-result", function(req, res) {

  // var h = req.body.height;
  // var w = req.body.weight;
  // var d = req.body.disease;
  // var g = req.body.goal;
  //
  //
  // console.log(h);
  // console.log(w);
  // console.log(d);
  // console.log(g);




  const file = reader.readFile('C:/Users/mrary/Desktop/sample/Database/diets.xlsx');
  let data = [];
  const sheets = file.SheetNames;
  for (let i = 0; i < sheets.length; i++) {
    const temp = reader.utils.sheet_to_json(
      file.Sheets[file.SheetNames[i]])
    temp.forEach((res) => {
      data.push(res);
    })
  }

  var br = data[1].Breakfast;
  var ln = data[1].Lunch;
  var sn = data[1].Snacks;
  var dn = data[1].Dinner;


  // console.log(br);
  // console.log(ln);
  // console.log(sn);
  // console.log(dn);
  var user = "NULL";

  if (req.isAuthenticated()) {
    user = req.user.username;
  }

  setTimeout(function() {
    res.render('dietresult', {
      user: user,
      br: br,
      ln: ln,
      sn: sn,
      dn: dn
    });

  }, 3000);


});

app.get("/store", function(req, res) {
  res.render("ecom");
});

app.post("/pdf", function(req, res) {


  upload(req, res, function(err) {

    if (err) {


      res.send(err)
    } else {

      var request = require('request');
      var options = {
        'method': 'POST',
        'url': 'https://cloud.uipath.com/collesftinfz/DefaultTenant/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs',
        'headers': {
          'Content-Type': 'application/json',
          'X-UIPATH-TenantName': 'DefaultTenant',
          'X-UIPATH-OrganizationUnitId': '3020143',
          'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlJUTkVOMEl5T1RWQk1UZEVRVEEzUlRZNE16UkJPVU00UVRRM016TXlSalUzUmpnMk4wSTBPQSJ9.eyJodHRwczovL3VpcGF0aC9lbWFpbCI6ImFyeWFuLm1hbnNhbmkuYnRlY2gyMDE5QHNpdHB1bmUuZWR1LmluIiwiaHR0cHM6Ly91aXBhdGgvZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vYWNjb3VudC51aXBhdGguY29tLyIsInN1YiI6Im9hdXRoMnxVaVBhdGgtQUFEVjJ8MjRkOTA1ZTItZWNkMi00N2MxLWJmMWYtMjRmMzFlZDc2Y2UxIiwiYXVkIjpbImh0dHBzOi8vb3JjaGVzdHJhdG9yLmNsb3VkLnVpcGF0aC5jb20iLCJodHRwczovL3VpcGF0aC5ldS5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjU2ODcxMTE5LCJleHAiOjE2NTY5NTc1MTksImF6cCI6IjhERXYxQU1OWGN6VzN5NFUxNUxMM2pZZjYyaks5M241Iiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyJ9.T-3PcoM_91aR4kxrZ_GWmCARUyyagbnCWFYwIhq9DTBpks82CcJ9GpP-ljo0tgjmiAkUC0uhVmYU2wxngLKLFd8HL83-_GqWZZNOE8Jg-ed6GjiRG7BIPj0rW7rtlUes1JvdX1tW8jTXWegXHBkHeVlbR_WLHg-TTV9cQOYBoIFUvLuqUateVBxd1lvm5OkJLcNRnROmPdKZ2WpScQSM85Ad1cX6_cTv5x09Cjxrl0SIKn6GTnxa_gd2vZISQum1bYwPQ7i2n1maWWlmjDqXjfDYHXOrkFeeCqhXqvlygsIN1PWkeU84OwEqdmw3ZTXPLzR1gcCHgx6R_JIkD0FRaQ'
        },
        body: JSON.stringify({
          "startInfo": {
            "ReleaseKey": "2290c0d0-321f-4966-8638-d6b8f4bddbf6",
            "Strategy": "Specific",
            "RobotIds": [
              774533
            ],
            "JobsCount": 0,
            "Source": "Manual"
          }
        })

      };
      request(options, function(error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
      });

      setTimeout(function() {

        res.redirect("/result");
      }, 25000);

    }
  });
});


app.listen("3000", function() {
  console.log("Server has started");
});
