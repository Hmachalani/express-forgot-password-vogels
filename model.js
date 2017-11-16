var crypto = require('crypto')
  , Joi = require('joi')
  , mailer = require('nodemailer')

module.exports = function (mailConfig, mailFrom, resetMailSubject, resetMailContent, vogels) {
  //var Schema = mongoose.Schema

  var _createCode = function () {
    var cryptoGen = crypto.randomBytes(10).toString('hex');
    console.log(cryptoGen);
    return cryptoGen;
  }

  var ForgotPassword = vogels.define('ForgotPassword', {
    hashKey: 'code',

    schema: {
      code: Joi.string().required(),
      email: Joi.string().required(),
      sent: Joi.date().required()
    },

  });

  ForgotPassword.verify = function (token, cb) {


    ForgotPassword.get({ code: token }, function (err, forgot) {
      if (err || !forgot) {
        return cb("Invalid Code")
      }

      if (Date.now() - forgot.get('sent') > (1000 * 60 * 60 * 12)) {
        return cb("Invalid Code: Expired")
      }

      return cb(null, forgot)
    })
  };

  ForgotPassword.validateRequest = function (req, res, next) {

    if (!req.query.id)
      return res.redirect('/auth/forgot?fail=2')

    ForgotPassword.verify(req.query.id, function (err, forgot) {
      if (err) {
        return res.redirect('/auth/forgot?fail=2')
      }
      next()
    })
  };

  ForgotPassword.generate = function (customer, cb) {

    if (!customer.get("uname")) return ForgotPassword.mailCustomer(customer, null, cb);

    var forgot = new ForgotPassword({
      code: _createCode(),
      email: customer.email,
      sent: Date.now(),
    })

    forgot.save(function (err, forgot) {
      if (err) return cb(err);

      console.log(">>> ForgotPassword sent:", customer.email)
      ForgotPassword.mailCustomer(customer, forgot, cb);
    })

  };

  ForgotPassword.mailCustomer = function (customer, forgot, cb) {
    var emailTransport = mailer.createTransport("SMTP", mailConfig);

    if (!forgot) forgot = null;
    else forgot = '/reset-forgotten?id=' + forgot.get('code');

    var envelope = {
      from: mailFrom
      , to: customer.email
      , subject: resetMailSubject
      , text: resetMailContent(customer, forgot)
    }

    emailTransport.sendMail(envelope, function (err, info) {
      if (err) return console.log(JSON.stringify(err));
      console.log(JSON.stringify(info));
      cb(err, info);

    });
  }

  vogels.createTables({
    'ForgotPassword': { readCapacity: 1, writeCapacity: 1 }, // note: doesn't support updating throughput 
  }, function (err) {
    if (err) {
      console.log('xxx - Error creating ForgotPassword table', err);
    } else {
      console.log('...ForgotPassword table is online');
    }
  });

  return ForgotPassword;

}
