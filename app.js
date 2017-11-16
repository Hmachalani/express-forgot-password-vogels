var express = require('express');
var bcrypt=require('bcrypt');
var SALT_WORK_FACTOR=10;
module.exports = function(ForgotPassword, Customer){
    
  var app = express()

  // forgot password
  app.get('/auth/forgot', function(req, res, next){
    return res.render('customer-forgot.html', {fail: req.query.fail})
  })

  app.post('/auth/forgot', function(req, res, next){
    Customer.findByEmail(req.body["email"], function(err, cus){
      if (err || !cus){
        return res.redirect("/auth/forgot?fail=1")
      }
      
      cus.email=cus.get('email');

      ForgotPassword.generate(cus, function(err){
        res.render('customer-forgot-sent.html', {customer: cus});
      })
    })
  })

  app.get('/reset-forgotten', ForgotPassword.validateRequest.bind(ForgotPassword), function(req, res, next){
    res.render('change-password.html', {token: req.query.id})
  })


  app.post('/auth/reset', function(req, res, next){
    if (! req.body.token )
      return res.redirect("/auth/forgot") 

    ForgotPassword.verify(req.body.token, function(err, fg){
      
      if (err){
        console.log(">> ForgotPassword : Reset Error : ", err)
        return res.redirect("/auth/forgot?err=1")
      }

      Customer.findByEmail(fg.get('email'), function(err, cus){
        if (err || !cus){
          console.log(">> ForgotPassword : Reset Error : ", err)
          return res.redirect("/auth/forgot?err=1")
        }
        
        
   
			var pwd=req.body.password;
		
        // generate a salt
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
          if (err) return console.log("Failed to generate salt");
        
          // hash the password using our new salt
          bcrypt.hash(pwd, salt, function(err, hash) {
            if (err) return console.log("Failed to hash password");
        
            // override the cleartext password with the hashed one
            pwd = hash;
            cus.set({pwd:pwd});//store to dynamodb via vogels
            cus.update(function(err){
              if (err) return console.log(JSON.stringify(err));
              //  res.redirect("/?set-password=success");
                    res.render('change-success.html', {token: req.query.id})
            });

          });
        });
			
		
        
        
      })
    })
  })

  return app;
}
