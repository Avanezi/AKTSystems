var express = require('express');
var bodyParser = require('body-parser');
var pesAppRoutes = require('./routes/pes-app');
var session = require('client-sessions');
var config = require('./conf/config');
var app = express();
app.set('view engine', 'ejs');
var bcrypt = require('bcryptjs');
var fs = require('fs');

// var tools = require('./static/student-sites/team3/js/main.js');
var mysql = require('mysql');
var dbconn = mysql.createConnection({
    user : config.dbUsername,
    password : config.dbPassword,
    host : config.dbHostname,
    multipleStatements: true
});
dbconn.query('USE ' + config.dbName + ';');
administrator_email = 'admin@admin';

 app.use(session({
    cookieName: 'session',
    secret: 'jhfjdfdjfhkdfjcvbxndsemvsfriwetitieryeireedsdsdsmnmnmereuaaarierueioettttzzswvcbnmrturio41aaaaaes22221222',
    duration: 30 * 60 * 1000,
    activeDuration: 10 * 60 * 1000

}));
app.use(pesAppRoutes.authHandler);

app.locals.sitePrefix = config.sitePrefix;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/static'));

app.get(config.sitePrefix + '/admin_start', pesAppRoutes.getAdminInterface);
app.get(config.sitePrefix + '/admin_edit_mailer', pesAppRoutes.getEditMailerInterface);

app.post(config.sitePrefix + '/admin_start', pesAppRoutes.registerAdmin);
app.post(config.sitePrefix +'/auth/register', pesAppRoutes.registerNewUser);
app.post(config.sitePrefix +'/admin_edit_mailer', pesAppRoutes.registerMailer);

app.get(config.sitePrefix + '/auth/find_user', pesAppRoutes.getFindUser);
//Not funtioning pes-app function started
app.post(config.sitePrefix + '/auth/find_user',pesAppRoutes.postLocateUserRequest);

//Not working yet no development started besides views
// app.get(config.sitePrefix + '/auth?reg=:registrationID/reset_password', pesAppRoutes.getResetPassword);
app.get(config.sitePrefix + '/auth/reset_password/:registrationId?', pesAppRoutes.getResetPassword);
app.post(config.sitePrefix + '/auth/reset_password/:registrationId?', pesAppRoutes.postPasswordChange);

//Not working yet, pes-app functions started
// app.get(config.sitePrefix + '/auth?reg=:registrationId/security_question', pesAppRoutes.getSecurityQuestion);
//app.post(config.sitePrefix + '/auth/:registrationId/security_question',[pesAppRoutes.postSecurityAnswer);

app.post(config.sitePrefix + '/auth/login', pesAppRoutes.postLoginRequest);
app.post(config.sitePrefix + '/auth/:registrationId/login', pesAppRoutes.postLoginRequest);

app.post(config.sitePrefix + '/auth/logout/:registrationId?', pesAppRoutes.postLogout);


//Not working yet pes-app function started
app.post(config.sitePrefix + '/auth/:registrationId/login', pesAppRoutes.setEmailToVerified);

app.get(config.sitePrefix + '/patients/:user', pesAppRoutes.requireLoginHandler, pesAppRoutes.authHandler);

app.get(config.sitePrefix + '/patients/:user', pesAppRoutes.getPatients);
app.post(config.sitePrefix + '/patients/', pesAppRoutes.postNewPatient);
app.post(config.sitePrefix + '/recipients', pesAppRoutes.postRecipients);
app.post(config.sitePrefix + '/deleteusers', pesAppRoutes.postDeleteUsers);


app.get(config.sitePrefix + '/survey_run/:surveyRunId/start', pesAppRoutes.getStart);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/start', pesAppRoutes.postStart);

app.get(config.sitePrefix + '/mail_sent', pesAppRoutes.getMailSent);
app.post(config.sitePrefix + '/mail_sent/:resent', pesAppRoutes.postMailReSent);




app.get(config.sitePrefix + '/verified/:registrationID', pesAppRoutes.getMailerVerified);
app.get(config.sitePrefix + '/verified/U/:registrationID', pesAppRoutes.getUserVerified);
app.get(config.sitePrefix + '/verified/A/:registrationID', pesAppRoutes.getAdminVerified);

app.get(config.sitePrefix + '/opt_out/:recipientRegId?/:recipient?', pesAppRoutes.getOptOut);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/language', pesAppRoutes.getLanguage);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/language', pesAppRoutes.postLanguage);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/section1', pesAppRoutes.getSection1);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/section1', pesAppRoutes.postSection1);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/section2', pesAppRoutes.getSection2);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/section2', pesAppRoutes.postSection2);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/section3', pesAppRoutes.getSection3);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/section3', pesAppRoutes.postSection3);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/section4', pesAppRoutes.getSection4);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/section4', pesAppRoutes.postSection4);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/section5', pesAppRoutes.getSection5);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/section5', pesAppRoutes.postSection5);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/section5a', pesAppRoutes.getSection5a);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/section5a', pesAppRoutes.postSection5a);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/section5b', pesAppRoutes.getSection5b);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/section5b', pesAppRoutes.postSection5b);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/section6', pesAppRoutes.getSection6);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/section6', pesAppRoutes.postSection6);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/feedback', pesAppRoutes.getFeedback);
app.post(config.sitePrefix + '/survey_run/:surveyRunId/feedback', pesAppRoutes.postFeedback);

app.get(config.sitePrefix + '/survey_run/:surveyRunId/thankYou', pesAppRoutes.getThankYou);

app.listen(config.port, function() {
    console.log('App listening on port ' + config.port);
});

app.use(pesAppRoutes.checkAdminExist);
app.get(config.sitePrefix + '/auth/login', pesAppRoutes.getLogin);
app.get(config.sitePrefix + '/auth/register', pesAppRoutes.getRegister);

app.get(config.sitePrefix + '/auth/:registrationId/login', pesAppRoutes.getLogin);