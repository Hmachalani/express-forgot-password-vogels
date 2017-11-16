module.exports = function(opts){

  if (! opts.db ) {
    throw "express-forgot-password needs a vogels url"
  }

  if (! opts.mailFrom )
    opts.mailFrom = "No Reply <noreply@noreply.com>"

  if (! opts.resetMailSubject )
    opts.resetMailSubject = "Reset your password"

  if (! opts.mailConfig )
    throw "express-forgot-password needs config for nodemailer"

  if (! opts.resetMailContent )
    throw "express-forgot-password needs a function resetMailContent(user, token) to supply the email body"

  var model = require('./model')(
        opts.mailConfig
      , opts.mailFrom
      , opts.resetMailSubject
      , opts.resetMailContent
      , opts.db
      )
  
  return {
    app : require('./app')(model, opts.user)
  }
}
