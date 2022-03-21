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

app.use(express.static("public"));
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/mediC", {
  useNewUrlParser: true
});


const userSchema = new mongoose.Schema({
  username:String,
  email: String,
  password: String
});

const User = new mongoose.model("User", userSchema);

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


app.get("/del",function(req,res){




});

app.get("/report",function(req,res){
  fs.unlink('uploads/Report.pdf', function(err) {
  if(err && err.code == 'ENOENT') {
      // file doens't exist
      console.info("File doesn't exist, won't remove it.");
  } else if (err) {
      // other errors, e.g. maybe we don't have enough permission
      console.error("Error occurred while trying to remove file");
  } else {
      console.info(`Removed old Pdf`);
  }
});





      res.render('index');
});


app.post("/login",function(req,res){


    var user = req.body.username;
    var pass = req.body.password;

    console.log(user);
    console.log(pass);
});


app.post("/register",function(req,res){


    var email = req.body.email;
    var pass = req.body.password;
    var user = req.body.username;
    console.log(email);
    console.log(pass);
    console.log(user);
});



app.get("/", function(req, res) {

    res.send("homepage");


});

app.get("/login", function(req, res) {

      res.render('login');

});

app.get("/diet",function(req,res){
     res.render('diet');
});

app.get("/result", function(req, res) {


      const file = reader.readFile('C:/Users/mrary/Desktop/sample/result/Data.xlsx');
      let data = [];
      const sheets = file.SheetNames;
      for (let i = 0; i < sheets.length; i++){
      const temp = reader.utils.sheet_to_json(
      file.Sheets[file.SheetNames[i]])
      temp.forEach((res) => {
      data.push(res);
      })
      }

      var name = data[0].Name;
      var nname = "";
      for (var i = 0; i < name.length; i++) {
          if((name[i]>='a'&&name[i]<='z')||(name[i]>='A'&&name[i]<='Z'))
          {
            nname+=name[i];
          }
         }

         fs.unlink('result/Data.xlsx', function(err) {
         if(err && err.code == 'ENOENT') {
             // file doens't exist
             console.info("File doesn't exist, won't remove it.");
         } else if (err) {
             // other errors, e.g. maybe we don't have enough permission
             console.error("Error occurred while trying to remove file");
         } else {
             console.info(`Removed the old data file`);
         }
       });

      var hba1=data[0].HbA1C;
      var chol=data[0].Cholesterol;
      var Trig = data[0].Triglycerides;
      var hdl = data[0].HDL;
      var ldl = data[0].LDL;



      var text = "Diabetic Status - Normal";
      var text2 = "";






     var parameter1 = parseFloat(Trig)/parseFloat(hdl);
     var parameter2 = parseFloat(hdl)/parseFloat(ldl);



     if(parameter1 > 3.75){
         text2="Cardiovascular Health - High Risk";
     }else if(parameter2 > 0.5 ){
         text2="Cardiovascular Health - Low Risk";

     }else if(parameter2 > 3 ){
         text2="Cardiovascular Health - Moderate Risk";
     }else if(parameter2 > 6){
         text2="Cardiovascular Health - High Risk";
     }

     console.log(text2);


      if(hba1>5.7)
      {
        text = "Diabetic Status -  pre-diabetic";
      }

      if(hba1>6.5)
      {
        text = "Diabetic Status - Diabetic";
      }



      res.render('result',{name:nname,hba1c:hba1,chol,trig:Trig,hdl:hdl,ldl:ldl,text:text,text2:text2});


});

app.get("/diet-result",function(req,res){

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
  for (let i = 0; i < sheets.length; i++){
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


  res.render('dietresult',{br:br,ln:ln,sn:sn,dn:dn});

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
          'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlJUTkVOMEl5T1RWQk1UZEVRVEEzUlRZNE16UkJPVU00UVRRM016TXlSalUzUmpnMk4wSTBPQSJ9.eyJodHRwczovL3VpcGF0aC9lbWFpbCI6ImFyeWFuLm1hbnNhbmkuYnRlY2gyMDE5QHNpdHB1bmUuZWR1LmluIiwiaHR0cHM6Ly91aXBhdGgvZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vYWNjb3VudC51aXBhdGguY29tLyIsInN1YiI6Im9hdXRoMnxVaVBhdGgtQUFEVjJ8MjRkOTA1ZTItZWNkMi00N2MxLWJmMWYtMjRmMzFlZDc2Y2UxIiwiYXVkIjpbImh0dHBzOi8vb3JjaGVzdHJhdG9yLmNsb3VkLnVpcGF0aC5jb20iLCJodHRwczovL3VpcGF0aC5ldS5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjQ3NDI5NjI0LCJleHAiOjE2NDc1MTYwMjQsImF6cCI6IjhERXYxQU1OWGN6VzN5NFUxNUxMM2pZZjYyaks5M241Iiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyJ9.jwsfbeVM0Lgd_yZgKWn26w3rvYuFeSvA0xbdg1GRVFPnlcl-SQ9BVAkl71p-C7l55_gkF68QH5SMnrfo9j7RsIqQSctnZgsc_wUXl36-csZUIWkyKj6wzVaoPv53MK2z64szDlX3U4BFSJXhcrNLm3_kULwTPUFUGD_YQYn0uOcEiGH0WjMfiUP4q1HNt3ztPtp_PVuHe7jWvQi_0V5XREi8Pd84QLmEuy2VzaI2jzJkHiJ_dtxmXxSgoI2LcXjK1AdPY2NEej2k_bxYxHx0k4HCiRr237vdVJUmQAjXiKRpwtNVGEf5q8Q2VueCtyAUXv2AEb3uusSUd8pl1g8AyA'
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
      }, 15000);

     }
  });
});


app.listen("3000", function() {
  console.log("Server has started");
});
