var mysql = require('mysql');
var fs = require('fs');
var url = require('url');
var uuidV1 = require('uuid/v1');
var nodemailer = require('nodemailer');
var bcrypt = require('bcryptjs');
var util = require('util')
var http = require('http')

var config = require('../conf/config');

var dbconn = mysql.createConnection({
    user : config.dbUsername,
    password : config.dbPassword,
    host : config.dbHostname,
    multipleStatements: true
});

dbconn.query('USE ' + config.dbName + ';');

var administrator_account = 'admin@admin';
var surveyQuestions = JSON.parse(fs.readFileSync('../patientExp4.1/data/surveyContent-en.json'));
var messages = JSON.parse(fs.readFileSync('../patientExp4.1/data/messages-en.json'));

var createAdmin = function(req, res, next){
    console.log('Admin account does not exist!');
    var salt = bcrypt.genSaltSync(10);
    var hashedPassword = bcrypt.hashSync('Administrator1!', salt);
    var registrationId = 'P3$A1234';
    registrationId = registrationId.toString();
    dbconn.query(
        'INSERT INTO Users (registrationId, firstname, lastname, role, email_address, password,email_verified, account_verified) VALUES(?,?,?,?,?,?,?,?);',
        [registrationId, 'admin', 'admin', 'admin', 'admin@admin', hashedPassword,'Y','Y'], function(err, result, fields) {
            if (err) {
               console.log('An error occurred trying to register you. Please try again')
                }
            else {
                console.log('SUCCESS: Admin account created!')
            }
        });
};


//authentication
exports.requireLoginHandler = function(req, res, next) {
        if (!req.session.user) {
        console.log('In requireLoginHandler; no user in session yet.');
            // res.header('Content-Type', 'text/html');
        res.render('pages/auth/login', {loginMessage: 'Please Log in',
            surveyQuestions : surveyQuestions});
        res.redirect(303, config.sitePrefix + '/auth/login');
    }
    else {
            if(req.session.user === req.params.user) {
                next();
            } else {
                res.redirect(303, config.sitePrefix + '/auth/login');
                // var a = util.inspect(res)
                // console.log(a)

            }
    }
};

exports.checkAdminExist = function (req, res, next){
    dbconn.query("SELECT * FROM Users where role = 'admin'",
        function(err, result, fields) {
            if (result.length === 0){
                createAdmin();
                next();
            }
            else if (result[0].role === 'admin') {
                next()
            }
        }
    );
    dbconn.query("SELECT * FROM mailer;", function (err, result, fields){
        if (err){
            console.log(err);
            next();
        }
        else if (result.length === 0){
            dbconn.query('INSERT INTO MAILER (id, email_address, password, verified) VALUES (?, ?, ?, ?);', ['0', 'pesa.testing@gmail.com', 'Conestoga1', 'Y'])
            console.log('SUCCESS: Inserted default Mailer');
        } else {
            next()
        }

    })
};

exports.getAdminInterface = function (req, res, next) {
    res.header('Content-Type', 'text/html');
    res.render('pages/admin_start', {loginMessage: null,
        surveyQuestions: surveyQuestions})
};

exports.getEditMailerInterface = function (req, res, next) {
    res.header('Content-Type', 'text/html');
    res.render('pages/admin_edit_mailer', {loginMessage: null,
        surveyQuestions: surveyQuestions})
};

exports.getLogin = function(req, res, next) {
    res.header('Content-Type', 'text/html');
    res.render('pages/auth/login', {loginMessage: null,
        surveyQuestions : surveyQuestions});

};
exports.getFindUser= function(req, res, next) {
    res.header('Content-Type', 'text/html');
    res.render('pages/auth/find_user', {loginMessage: null,
        surveyQuestions : surveyQuestions});
};

exports.getResetPassword= function(req, res, next) {

    // var path = url.parse(req.url).pathname;
    res.header('Content-Type', 'text/html');
    res.render('pages/auth/reset_password', {loginMessage: null,
        surveyQuestions : surveyQuestions});
};

exports.getSecurityQuestion = function(req, res, next) {
    var urlObj = url.parse(req.url, true);
    var registrationId = urlObj.query['reg'];
    var msg = null;
    dbconn.query('SELECT registrationId, securityQuestion from users where registrationId = ?;', [registrationId],
        function (err, results, fields) {
            console.log('security question retrieved');
            if (err) {
                console.log('An error occurred trying to retrieve security_question. Please try again');
                next();
            }
            res.header('Content-Type', 'text/html');
            res.render('pages/auth?reg=:'+registrationId+'/security_question', {
                surveyQuestions: surveyQuestions,
                securityQuestion: results[0],
                message: msg
            });
        });
};


exports.getRegister = function (req, res, next) {
    res.header('Content-Type', 'text/html');
    res.render('pages/auth/register', {
         loginMessage: null,
         surveyQuestions: surveyQuestions,
         messages: messages
    })
};

exports.postPasswordChange = function (req, res, next) {
    var param = req.params.registrationId;
    var password = req.body['passwordNew2'];
    var salt = bcrypt.genSaltSync(10);
    var hashedPassword = bcrypt.hashSync(password, salt);
    dbconn.query('UPDATE users SET password = ? WHERE registrationId = ?',
        [hashedPassword, param], function (err, results, fields) {
            if (err || results === null) {
                res.header('Content-Type', 'text/html');
                res.render('pages/auth/find_user', {
                    loginMessage: 'An error occurred. Please try again.'
                });
            }
            else if (results.length === 0) {
                //console.log('Not registered');
                res.render('pages/auth/find_user', {
                    loginMessage: email_address + ' is not a registered user.  Please enter a different email address.'
                });
            }
            else {
                res.redirect(303, config.sitePrefix + '/auth/login');
                console.log('SUCCESS: Password has been reset for the user!')
                // res.render('pages/auth/find_user', {
                //     loginMessage: 'Please check your email to validate your account. Ensure to check your spam as well. If you do not receive an email please click'
                }

                // mailerEmailVerify(email_address, registrationID);
                // console.log('url: ' + 'http://localhost:3003/team3/auth?reg=' + registrationID + '/security_question');
            })
        };


exports.postLocateUserRequest = function (req, res, next) {
    var email_address = req.body['find_email_address'];
    console.log(email_address)
    dbconn.query('SELECT registrationId, firstname FROM Users WHERE email_address = ?;',
        [email_address], function (err, results, fields) {
                if (err || results === null) {
                    res.header('Content-Type', 'text/html');
                    res.render('pages/auth/find_user', {
                       loginMessage: 'An error occurred. Please try again.'
                    });
                }
                else if (results.length === 0) {
                 //console.log('Not registered');
                    res.render('pages/auth/find_user', {
                       loginMessage: email_address + ' is not a registered user.  Please enter a different email address.'
                    });
        }
                else {
                    //res.redirect(303, config.sitePrefix + '/auth/login');
                    res.render('pages/auth/find_user', {
                       loginMessage: 'Please check your email to validate your account. Ensure to check your spam as well. If you do not receive an email please click'
                    });
                    var registrationID = results[0].registrationId;
                    sendPasswordReset(email_address, registrationID);
                    // console.log('url: ' + 'http://localhost:3003/team3/auth?reg=' + registrationID + '/security_question');
                    }
    });
};
exports.postLogout = function(req, res, next){
    //Will all users have their session reset when server receives request?
    req.session.reset()
    res.redirect(303, config.sitePrefix + '/auth/login')
}

exports.postLoginRequest = function(req, res, next) {
    var email_address = req.body['login_email_address'];
    var password = req.body['login_password'];
    dbconn.query('SELECT email_address,password FROM Users WHERE email_address = ?;',
        [email_address], function(err, results, fields) {
            if (err || results === null) {
                res.header('Content-Type', 'text/html');
                res.render('pages/auth/login', {
                    surveyQuestions: surveyQuestions,
                    title: 'Login',
                    loginMessage: 'An error occurred trying to log you in. Please try again.'
                });
            }
            else if (results.length === 0) {
                res.render('pages/auth/login', {
                    title: 'Login',
                    surveyQuestions: surveyQuestions,
                    loginMessage: 'Incorrect email or password.'
                });
            }
            else {
                //checking if admin account has default password;
                if (email_address === administrator_account) {
                    console.log('Admin attempting to login');
                    if (password === 'Administrator1!') {
                        req.session.user = results[0].email_address;
                        res.redirect(303, config.sitePrefix + '/admin_start');
                    }
                    else {
                        if (bcrypt.compareSync(password, results[0].password)) {
                            req.session.user = results[0].email_address;
                            res.redirect(303, config.sitePrefix + '/patients');
                        }
                        else {
                            res.header('Content-Type', 'text/html');
                            res.render('pages/auth/login', {
                                surveyQuestions: surveyQuestions,
                                title: 'Login',
                                loginMessage: 'Incorrect email or password.'
                            });
                        }
                    }
                }
                else {
                    if (bcrypt.compareSync(password, results[0].password)) {
                        req.session.user = results[0].email_address;
                        dbconn.query('SELECT email_address FROM mailer;', function(err, results, fields){
                                if (results[0].email_address === 'pesa.testing@gmail.com'){
                                    res.redirect(303, config.sitePrefix + '/admin_edit_mailer');
                                } else {
                                    // req.session.user = results[0].email_address;
                                    res.redirect(303, config.sitePrefix + '/patients/' + req.session.user);
                                }
                            });
                        }
                    else {
                        res.header('Content-Type', 'text/html');
                        res.render('pages/auth/login', {
                            surveyQuestions: surveyQuestions,
                            title: 'Login',
                            loginMessage: 'Incorrect email or password.'
                        })
                    }
                }
            }
        })
};
exports.setEmailToVerified =  function(req, res, next) {
    var email_address = req.body['login_email_address'];
    console.log('set email verified field function called');
    dbconn.query('select * from users where email_address = ?;', [email_address], function (err, result, fields) {
        if (results.email_verified === '1') {
        console.log('already verified');
        next();
        }
        else if (results.email_verified === '0') {
            dbconn.query('update users set email_verified = 1 where email_address = ?;', [email_address], function (err, result, fields) {
                if (err) {
                    console.log('An error occurred.  Did not update email_verified field')
                }
                else {
                    console.log('email_verified field updated!')
                }
            });
        }
    });
};

exports.registerAdmin = function(req, res, next){
    var first_name = req.body['first_name'];
    var last_name = req.body['last_name'];
    var email_address = req.body['email_address'];
    var email_confirm = req.body['email_address_confirm'];
    var password = req.body['passwordNew'];
    var password_confirm = req.body['passwordNew_confirm'];
    var security_question = req.body['security_question'];
    var security_answer = req.body['security_answer'];
    var salt = bcrypt.genSaltSync(10);
    var hashedPassword = bcrypt.hashSync(password, salt);
    var hashedAnswer = bcrypt.hashSync(security_answer, salt);

    var regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    //assumes 1 admin
    if (email_address === email_confirm && password === password_confirm && regex.test(password)) {
            var query = "UPDATE Users SET firstName = '" + first_name + "', lastName = '" + last_name + "', securityQuestion = '" + security_question + "', securityAnswer = '" + hashedAnswer + "', email_address = '" + email_address + "', password = '" + hashedPassword + "' WHERE role = 'admin';";
            dbconn.query(
                query, function (err, result, fields) {
                    if (err) {
                        var errMsg;
                        if (err.code === 'ER_DUP_ENTRY') {
                            errMsg = 'That email is already taken, please try another.';
                            console.log(errMsg);
                        }
                        else {
                            errMsg = 'An error occurred trying to register you. Please try again.';
                            console.log(err)

                        }
                        res.header('Content-Type', 'text/html');
                        res.render('pages/auth/register', {
                            title: 'Login',
                            surveyQuestions: surveyQuestions,
                            loginMessage: errMsg
                        });
                    }
                    else {
                        // console.log('============= Admin account has been updated =============');
                        res.redirect(303, config.sitePrefix + '/mail_sent');
                        verifyAdminEmail(email_address, 'P3$A1234')
                    }
                });
        }
        else {
            console.log('fail');
            res.header('Content-Type', 'text/html');
            res.render('pages/admin_start', {
                title: 'administratttttt',
                surveyQuestions: surveyQuestions,
                loginMessage: ''
            });
        }

};

exports.registerNewUser = function(req, res, next) {
    var first_name = req.body['first_name'];
    var last_name = req.body['last_name'];
    var email_address = req.body['email_address'];
    var email_confirm = req.body['email_address_confirm'];
    var password = req.body['passwordNew'];
    var password_confirm = req.body['passwordNew_confirm'];
    var security_question = req.body['security_question'];
    var security_answer = req.body['security_answer'];
    var salt = bcrypt.genSaltSync(10);
    var hashedPassword = bcrypt.hashSync(password, salt);
    var hashedAnswer = bcrypt.hashSync(security_answer, salt);
    var role = 'user';
    var registrationId = uuidV1();
    registrationId = registrationId.toString();
    var email_verified = 'N';
    var account_verified = 'N';
    var regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    //assumes 1 admin
    if (email_address === email_confirm && password === password_confirm && regex.test(password)) {
        dbconn.query(
            'INSERT INTO Users ( registrationId, firstname, lastname, role, email_address, password, securityQuestion, securityAnswer,email_verified,account_verified) VALUES (?,?,?,?,?,?,?,?,?,?);',
            [registrationId, first_name, last_name, role, email_address, hashedPassword, security_question, hashedAnswer, email_verified,account_verified], function (err, result, fields) {
                if (err) {
                    var errMsg;
                    if (err.code === 'ER_DUP_ENTRY') {
                        errMsg = 'That email is already taken, please try another.';
                        console.log(errMsg)

                    }
                    else {
                        errMsg = 'An error occurred trying to register you. Please try again.';
                        console.log(errMsg)
                    }
                    res.header('Content-Type', 'text/html');
                    res.render('pages/auth/register', {
                        title: 'Register',
                        surveyQuestions: surveyQuestions,
                        messages: messages,
                        loginMessage: errMsg

                    });
                }
                else {
                    console.log('===Registered new user===');
                    res.redirect(303, config.sitePrefix + '/mail_sent');
                    verifyRegisterEmail(email_address, registrationId);

                }
            });
        // console.log('url: ' + 'http://localhost:3003/team3/auth/' + registrationId + '/login');
    }
};

// This version of registerMailer hashes the password, which is ideal but for sendEmail function, credentials are not hashed;
// exports.registerMailer = function(req, res, next) {
//     var email_address = req.body['email_address'];
//     var confirm_email = req.body['email_address_confirm'];
//     var password = req.body['password'];
//     var salt = bcrypt.genSaltSync(10);
//     var hashedPassword = bcrypt.hashSync(password, salt);
//     var tempId = uuidV1();
//     tempId = tempId .toString();
//     if (email_address === confirm_email) {
//         //need to check if mailer exists; if it does, do not insert but rather UPDATE. if doesnt exist, insert;
//         dbconn.query(
//             'DELETE FROM MAILER; INSERT INTO mailer (email_address, password, verified, tempId) VALUES (?,?,?,?);',
//             [email_address, hashedPassword, 'N', tempId], function (err, result, fields) {
//                 if (err) {
//                     var errMsg;
//                     if (err.code === 'ER_DUP_ENTRY') {
//                         errMsg = 'That email is already taken, please try another.';
//                         console.log(errMsg)
//                     }
//                     else {
//                         errMsg = 'An error occurred trying to register you. Please try again.';
//                         console.log(err)
//                     }
//                     res.header('Content-Type', 'text/html');
//                     res.render('pages/admin_edit_mailer', {
//                         title: 'Register',
//                         surveyQuestions: surveyQuestions,
//                         messages: messages,
//                         loginMessage: errMsg
//                     });
//                 }
//                 else {
//                     res.redirect(303, config.sitePrefix + '/auth/login');
//                     console.log('--------------Sender Email Updated----------------')
//                 }
//             });
//         //From here, need sendEmail function adapted, or new function to send verification email to verify sendout email.
//
//         //This needs to work;
//
//         mailerEmailVerify(email_address, tempId );
//         console.log('url: ' + 'http://localhost:3003/team3/verified/' + tempId);
//     } else {
//         console.log('MAILER FAILED');
//         res.header('Content-Type', 'text/html');
//         res.render('pages/admin_edit_mailer', {
//             title: 'administratttttt',
//             surveyQuestions: surveyQuestions,
//             loginMessage: ''
//         });
//     }
// };

exports.registerMailer = function(req, res, next) {
    var email_address = req.body['email_address'];
    var confirm_email = req.body['email_address_confirm'];
    var password = req.body['password'];
    // var salt = bcrypt.genSaltSync(10);
    // var hashedPassword = bcrypt.hashSync(password, salt);
    var tempId = uuidV1();
    tempId = tempId .toString();
    if (email_address === confirm_email) {
        //need to check if mailer exists; if it does, do not insert but rather UPDATE. if doesnt exist, insert;
        dbconn.query(
            'DELETE FROM MAILER; INSERT INTO mailer (email_address, password, verified, tempId) VALUES (?,?,?,?);',
            [email_address, password, 'N', tempId], function (err, result, fields) {
                if (err) {
                    var errMsg;
                    if (err.code === 'ER_DUP_ENTRY') {
                        errMsg = 'That email is already taken, please try another.';
                        console.log(errMsg)
                    }
                    else {
                        errMsg = 'An error occurred trying to register you. Please try again.';
                        console.log(err)
                    }
                    res.header('Content-Type', 'text/html');
                    res.render('pages/admin_edit_mailer', {
                        title: 'Register',
                        surveyQuestions: surveyQuestions,
                        messages: messages,
                        loginMessage: errMsg
                    });
                }
                else {
                    res.redirect(303, config.sitePrefix + '/auth/login');
                    console.log('--------------Sender Email Updated----------------');
                    mailerEmailVerify(email_address, tempId );
                    console.log('URL to validate the new mailer email: ' + 'http://localhost:3003/team3/verified/' + tempId);
                }
            });
        //From here, need sendEmail function adapted, or new function to send verification email to verify sendout email.
    } else {
        console.log('MAILER FAILED');
        res.header('Content-Type', 'text/html');
        res.render('pages/admin_edit_mailer', {
            title: 'administratttttt',
            surveyQuestions: surveyQuestions,
            loginMessage: ''
        });
    }
};


exports.authHandler = function(req, res, next) {
      if (req.session && req.session.user) {
          dbconn.query('SELECT email_address, firstname, lastname FROM Users WHERE email_address = ?;',
            [req.session.user], function(err, results, fields) {
                if (err || results === null) {
                    res.render('pages/auth/login', {
                        title: 'Login',
                        loginMessage: null,
                        surveyQuestions : surveyQuestions
                    });
                }
                else if (results.length === 1) {
                    res.locals.user = results[0];
                    next();

                }
                else {
                    req.session.reset();
                    res.redirect(303, config.sitePrefix + '/auth/login');
                }
            });
    }
    else {
        next();
    }
};

var verifyRegisterEmail = function(emailAddress, registrationID) {
    dbconn.query('SELECT email_address, password, verified FROM mailer', function (err, result, field) {
        if (err) {
            console.log(err);
        } else {
            var info = {
                user: result[0].email_address,
                pass: result[0].password
            };
            var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: info.user,
                    pass: info.pass
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            var mailOptions = {
                from: 'AKTSystems',
                to: emailAddress,
                subject: 'Verification of User email address',
                text: 'This is a test using Node.js module nodemailer',
                html: '<html><body>Dear ' + emailAddress + ', <br><p>You need to verify your email. Click the link below: </p><br><a href="http://localhost:3003/team3/verified/U/' + registrationID + '">Click here</a><br><br></body></html>'
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    var transporter = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                            user: 'pesa.testing@gmail.com',
                            pass: 'Conestoga1'
                        },
                        tls: {
                            rejectUnauthorized: false
                        }
                    });
                    var mailOptions = {
                        from: 'Primary Care Clinic <pesa.testing@gmail.com>',
                        to: emailAddress,
                        subject: 'Patient Experience Survey',
                        text: 'This is a test using Node.js module nodemailer',
                        html: '<html><body>Dear ' + emailAddress + ', <br><p>You need to verify your email. Click the link below: </p><br><a href="http://localhost:3003/team3/verified/U/' + registrationID + '">Click here</a><br><br><p>testing!!!</p></body></html>'
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error)
                        } else {
                            console.log('SOMEWHAT SUCCESS: Message sent using default Mailer address')
                        }
                    })
                } else {
                    console.log('SUCCESS: Message sent from: ' + result[0].email_address);
                }
            });

        }
    });
};

var verifyAdminEmail = function(emailAddress, registrationID) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'pesa.testing@gmail.com',
            pass: 'Conestoga1'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    var mailOptions = {
        from: 'Primary Care Clinic <pesa.testing@gmail.com>',
        to:  emailAddress,
        subject: 'Verify the Administrator email',
        text: 'This is a test using Node.js module nodemailer',
        html: '<html><body>Dear ' + emailAddress + ', <br><p>You need to verify your email address. Click the link below to verify: </p><br><a href="http://localhost:3003/team3/verified/A/' + registrationID + '">Click here</a><br><br></body></html>'
    };

    //html: '<html><body>Dear ' + emailAddress + ', <br><p>Reset password</p><a href="https://github.com/khangsin/AKTSystems/blob/master/patientExp4.1/routes/pes-app.js">Click here</a><br><br><p>testing!!!</p></body></html>'
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Admin email verification sent: ' + info.response);
        }
    });
};



var sendEmail = function(patientFirstName, emailAddress, surveyRunId) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'pesa.testing@gmail.com',
            pass: 'Conestoga1'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    var mailOptions = {
        from: 'Primary Care Clinic <pesa.testing@gmail.com>',
        to:  emailAddress,
        subject: 'Patient Experience Survey',
        text: 'This is a test using Node.js module nodemailer',
        html: '<html><body>Dear ' + patientFirstName + ':<br />According to our records, you have visited our office recently. We would appreciate your feedback to allow us to improve your future experience.  Please follow the link to complete our survey: <a href="localhost:3003/team3/survey_run/' + surveyRunId.toString() + '/language">Start</a><br>Best Wishes,<br>Conestoga Primary Care Clinic</body></html>'
    };

    //html: '<html><body>Dear ' + emailAddress + ', <br><p>Reset password</p><a href="https://github.com/khangsin/AKTSystems/blob/master/patientExp4.1/routes/pes-app.js">Click here</a><br><br><p>testing!!!</p></body></html>'
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
    //for testing
    console.log('url: ' + 'http://localhost:3003/team3/survey_run/' + surveyRunId.toString() + '/language');
};

var UpdatedSendEmail = function(patientFirstName, emailAddress, surveyRunId) {
    dbconn.query('SELECT email_address, password FROM mailer', function (err, result, field) {
        if (err) {
            console.log(err);
        } else {
            console.log(result)
        }
    });
    // var transporter = nodemailer.createTransport({
    //     service: 'Gmail',
    //     auth: {
    //         user: 'pesa.testing@gmail.com',
    //         pass: 'Conestoga1'
    //     }
    // });
    // var mailOptions = {
    //     from: 'Primary Care Clinic <pesa.testing@gmail.com>',
    //     to:  emailAddress,
    //     subject: 'Patient Experience Survey',
    //     text: 'This is a test using Node.js module nodemailer',
    //     html: '<html><body>Dear ' + patientFirstName + ':<br />According to our records, you have visited our office recently. We would appreciate your feedback to allow us to improve your future experience.  Please follow the link to complete our survey: <a href="localhost:3003/team3/survey_run/' + surveyRunId.toString() + '/language">Start</a><br>Best Wishes,<br>Conestoga Primary Care Clinic</body></html>'
    // };

    //html: '<html><body>Dear ' + emailAddress + ', <br><p>Reset password</p><a href="https://github.com/khangsin/AKTSystems/blob/master/patientExp4.1/routes/pes-app.js">Click here</a><br><br><p>testing!!!</p></body></html>'
    // transporter.sendMail(mailOptions, function(error, info){
    //     if(error){
    //         console.log(error);
    //     }else{
    //         console.log('Message sent: ' + info.response);
    //     }
    // });
};

var getMailerInfo= function(){
    dbconn.query('SELECT email_address, password FROM mailer', function (err, result, field) {
        if (err) {
            console.log(err);
        } else {
            console.log(result[0].password)
        }
    });

};

var mailerEmailVerify = function(emailAddress, registrationID) {
    dbconn.query('SELECT email_address, password, verified FROM mailer', function (err, result, field) {
        if (err) {
            console.log(err);
        } else {
            var info = {
                user: result[0].email_address,
                pass: result[0].password
            };
            var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: info.user,
                    pass: info.pass
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            var mailOptions = {
                from: 'Primary Care Clinic <pesa.testing@gmail.com>',
                to: emailAddress,
                subject: 'Verification of Mailer email address',
                text: 'This is a test using Node.js module nodemailer',
                html: '<html><body>Dear ' + emailAddress + ', <br><p>You need to verify your email. Click the link below: </p><br><a href="http://localhost:3003/team3/verified/' + registrationID + '">Click here</a><br><br></body></html>'
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    var transporter = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                            user: 'pesa.testing@gmail.com',
                            pass: 'Conestoga1'
                        },
                        tls: {
                            rejectUnauthorized: false
                        }
                    });
                    var mailOptions = {
                        from: 'Primary Care Clinic <pesa.testing@gmail.com>',
                        to: emailAddress,
                        subject: 'Patient Experience Survey',
                        text: 'This is a test using Node.js module nodemailer',
                        html: '<html><body>Dear ' + emailAddress + ', <br><p>You need to verify your email. Click the link below: </p><br><a href="http://localhost:3003/team3/verified/' + registrationID + '">Click here</a><br><br><p>testing!!!</p></body></html>'
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error)
                        } else {
                            console.log('SOMEWHAT SUCCESS: Message sent using default Mailer address')
                        }
                    })
                } else {
                    console.log('SUCCESS: Message sent from newly set Mailer email address');
                }
            });

        }
    });
};

var sendPasswordReset = function(emailAddress, registrationID) {
    dbconn.query('SELECT email_address, password, verified FROM mailer', function (err, result, field) {
        if (err) {
            console.log(err);
        } else {
            var info = {
                user: result[0].email_address,
                pass: result[0].password
            };
            var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: info.user,
                    pass: info.pass
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            var mailOptions = {
                from: 'Primary Care Clinic <pesa.testing@gmail.com>',
                to: emailAddress,
                subject: 'Password Reset for AKTSystems',
                text: 'This is a test using Node.js module nodemailer',
                html: '<html><body>Dear ' + emailAddress + ', <br><p>Password reset! </p><br><a href="http://localhost:3003/team3/auth/reset_password/' + registrationID + '">Click here</a><br><br><p>testing!!!</p></body></html>'
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    var transporter = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                            user: 'pesa.testing@gmail.com',
                            pass: 'Conestoga1'
                        },
                        tls: {
                            rejectUnauthorized: false
                        }
                    });
                    var mailOptions = {
                        from: 'Primary Care Clinic <pesa.testing@gmail.com>',
                        to: emailAddress,
                        subject: 'Patient Experience Survey',
                        text: 'This is a test using Node.js module nodemailer',
                        html: '<html><body>Dear ' + emailAddress + ', <br><p>You need to verify your email. Click the link below: </p><br><a href="http://localhost:3003/team3/verified/' + registrationID + '">Click here</a><br><br><p>testing!!!</p></body></html>'
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error)
                        } else {
                            console.log('SOMEWHAT SUCCESS: Message sent using default Mailer address')
                        }
                    })
                } else {
                    console.log('SUCCESS: Password reset email sent from ' + result[0].email_address);
                }
            });

        }
    });
};

// get patients
exports.getPatients = function(req, res, next) {
    var param = req.params.user;
    // console.log(param)
    var urlObj = url.parse(req.url, true);
    var status = urlObj.query['status'];
    console.log(urlObj);
    console.log(status)
    var msg = null;
    if (status==='S_du') {
        msg = 'User(s) have been deleted!';
    }
    else if (status === 'F_ra') {
        msg = 'Recipient already exists!'
    }
    else if (status === 'S_ra'){
        msg = 'Recipient has been added!';
    }
    // else if (status === 'S_ra'){
    //     msg = 'Recipient has been added!';
    // }
    else{
     msg = null;
    }
    dbconn.query('SELECT first_name, last_name, email_address FROM recipients WHERE added_by = ?; SELECT firstname, lastname, role, email_address, email_verified FROM Users where email_address = ?; ' +
        'SELECT registrationId, firstname, lastname, email_address, email_verified FROM users WHERE role = "user"' ,[param, param],
        function(err, results, fields) {
            if (err) {
                next();
            }
            res.render('pages/patients', {
                //this could be improved by being more specific; patients should be results[0],
                // and the code from patients.ejs should be changed accordingly
                loginMessage: null,
                surveyQuestions : surveyQuestions,
                recipients: results,
                message: msg,
                profile: results,
                email_verified: results[1][0].email_verified,
                regularUsers: results[2]
            });
        });
    // dbconn.query('SELECT email_verified FROM users WHERE email_address = ?', [param],
    // function (err, results, fields){
    //     if (err) {
    //         console.log(err);
    //         next();
    //     }
    //     res.render('pages/patients', {
    //         verified: results
    //     })
    // })
};


exports.postNewPatient = function(req, res, next) {
    var user = req.session.user;
    var patientFirstName = req.body['patientFirstName'];
    var patientLastName = req.body['patientLastName'];
    var patientEmailAddress = req.body['patientEmailAddress'];

    dbconn.query('SELECT email_address FROM recipients WHERE added_by = ?', [user], function (err, result, fields) {
        var email_exist = false;
        for (var i = 0; i < result.length; i++) {
            if (result[i].email_address === patientEmailAddress) {
                console.log('FAILURE: Recipient %s already exists in your recipient list!', patientEmailAddress);
                email_exist = true;
                res.redirect(303, config.sitePrefix + '/patients/' + user + '/?status=F_ra');
                break;
            }
        }
        if (!email_exist) {
            dbconn.query('INSERT INTO recipients(first_name, last_name, email_address, added_by) VALUES (?, ?, ?, ?);',
                [patientFirstName, patientLastName, patientEmailAddress, user], function (err, result, fields) {
                    if (err) {
                        console.log(err);
                        //is this needed?
                        next();
                    } else {
                        console.log('SUCCESS:\'%s\' has been added to user %s\'s list of recipients!', patientEmailAddress, user)
                    }
                    res.redirect(303, config.sitePrefix + '/patients/' + user + '/?status=S_ra');
                });
        }
    })
}

exports.postDeleteUsers = function(req, res, next) {
    var user = req.session.user;
    dbconn.query('SELECT registrationId FROM users WHERE role = "user";', function(err, result, fields){
        var deleteStmt = '';
        for(var i = 0; i < result.length; i++) {
            var checkboxId = result[i].registrationId;
            if(req.body[checkboxId] === 'on'){
                deleteStmt += "DELETE FROM users WHERE registrationId = '" + checkboxId + "'; ";
            }
        }
        dbconn.query(deleteStmt, function(err, result, fields){
            if (err){
                console.log(err);
                next();
            } else {
                console.log('SUCCESS: User(s) have been deleted!')

            }
            res.redirect(303, config.sitePrefix + '/patients/' + user + '/?status=S_du');
        })
        // res.render('pages/patients', {loginMessage: 'User(s) have been deleted!',
        //     surveyQuestions : surveyQuestions});
    })
    // if (Object.keys(req.body).length > 0) {
    //     Object.keys(req.body).forEach(function (key) {
    //         var currRecipient = key.split(';');
    //         var currUuid = uuidV1();
    //         deleteStmt += 'INSERT INTO SurveyRuns(id, completedFor) VALUES (?, ?);';
    //         params.push(currUuid.toString(), parseInt(currRecipient[0]));
    //         sendEmail(currRecipient[1], currRecipient[2], currUuid);
    //     });
    //
    //     dbconn.query(insertStmt, params, function (err, result, fields) {
    //         if (err) {
    //             next();
    //         }
    //         res.redirect(303, config.sitePrefix + '/patients?status=ss');
    //     })
    // }
    // else {
    //     res.redirect(303, config.sitePrefix + '/patients?status=ns');
    //
    // }
};


exports.postRecipients = function(req, res, next) {
    var insertStmt = '';
    var params = [];

    if (Object.keys(req.body).length > 0) {
        Object.keys(req.body).forEach(function (key) {
            var currRecipient = key.split(';');
            var currUuid = uuidV1();
            insertStmt += 'INSERT INTO SurveyRuns(id, completedFor) VALUES (?, ?);';
            params.push(currUuid.toString(), parseInt(currRecipient[0]));
            sendEmail(currRecipient[1], currRecipient[2], currUuid);
        });

        dbconn.query(insertStmt, params, function (err, result, fields) {
            if (err) {
                next();
            }
            res.redirect(303, config.sitePrefix + '/patients?status=ss');
        })
    }
    else {
        res.redirect(303, config.sitePrefix + '/patients?status=ns');

    }
 };


//survey pages
exports.getLanguage = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/language', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions });
};

exports.postLanguage = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var language = req.body['language'];
    if (language === 'fr') {
        surveyQuestions = JSON.parse(fs.readFileSync('data/surveyContent-fr.json'));
        res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/start');
    }
    else if (language === 'en') {
        surveyQuestions = JSON.parse(fs.readFileSync('data/surveyContent-en.json'));
        res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/start');
    }
};

exports.getStart = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/start', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
};

exports.getMailSent = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/mail_sent', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
};

//specific to mailer ONLY
exports.getMailerVerified = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/verified', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
    var path = url.parse(req.url).pathname;
    var pathObj = path.split('/');
    var mailerTempId = pathObj[pathObj.length-1];
    dbconn.query(
        'UPDATE mailer SET verified = "Y" WHERE tempid = ?', [mailerTempId], function(err, result, fields) {
            if (err) {
                console.log(err);
                next();
            }
            else {
                console.log('SUCCESS: Mailer email address verified!');
            }
        })
};
exports.getUserVerified = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/verified', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
    var path = url.parse(req.url).pathname;
    var pathObj = path.split('/');
    var regID = pathObj[pathObj.length-1];
    dbconn.query(
        'UPDATE users SET email_verified = "Y" WHERE registrationId = ?', [regID], function(err, result, fields) {
            if (err) {
                console.log(err);
                next();
            }
            else {
                console.log('SUCCESS: USER email address verified!');
            }
        })
};

exports.getAdminVerified = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/verified', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
    var path = url.parse(req.url).pathname;
    var pathObj = path.split('/');
    var regID = pathObj[pathObj.length-1];
    dbconn.query(
        'UPDATE users SET email_verified = "Y" WHERE registrationId = ?', [regID], function(err, result, fields) {
            if (err) {
                console.log(err);
                next();
            }
            else {
                console.log('SUCCESS: USER email address verified!');
            }
        })
};

exports.postStart = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var timeStarted = new Date();
    var q0 = req.body['q0'];

    if (q0 === 'other') {
        var q0_other = req.body['q0_other'];

        dbconn.query(
            'UPDATE SurveyRuns SET timeStarted = ?, q0 = 4, q0_other = ? WHERE id = ?;',
            [timeStarted, q0_other, surveyRunId], function(err, result, fields) {
                if (err) {
                    next();
                }

                res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section1');
            });
    } else {
        dbconn.query(
            'UPDATE SurveyRuns SET timeStarted = ?, q0 = ? WHERE id = ?;',
            [timeStarted, q0, surveyRunId], function(err, result, fields) {
                if (err) {
                    next();
                }

                res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section1');
            });
    }
};

exports.getSection1 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/section1', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
};

exports.postSection1 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var q1 = parseInt(req.body['q1']);
    var q2a = parseInt(req.body['q2a']);
    var q2b = parseInt(req.body['q2b']);
    if (q1 === 6) {
        var q1_other = req.body['q1_other'];
        dbconn.query(
            'UPDATE SurveyRuns SET q1 = 6, q1_other = ?, q2a = ?, q2b = ? WHERE id = ?;',
            [q1_other, q2a, q2b, surveyRunId], function(err, result, fields) {
                if (err) {
                    next();
                }

                res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section2');
            });
    } else {
        dbconn.query(
            'UPDATE SurveyRuns SET q1 = ?, q2a = ?, q2b = ? WHERE id = ?;',
            [q1, q2a, q2b, surveyRunId], function(err, result, fields) {
                if (err) {
                    next();
                }

                res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section2');
            });
    }
};

exports.getSection2 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/section2', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});

};

exports.postSection2 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var q3a = parseInt(req.body['q3a']);
    var q3b = parseInt(req.body['q3b']);
    var q3c = parseInt(req.body['q3c']);
        dbconn.query(
            'UPDATE SurveyRuns SET q3a = ?, q3b = ?, q3c = ? WHERE id = ?;',
            [q3a, q3b, q3c, surveyRunId], function(err, result, fields) {
                if (err) {
                    next();
                }
                res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section3');
            });
};

exports.getSection3 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/section3', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
};

exports.postSection3 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var q4a = parseInt(req.body['q4a']);
    var q4b = parseInt(req.body['q4b']);
    var q4c = parseInt(req.body['q4c']);
    var q4d = parseInt(req.body['q4d']);
    var q4e = parseInt(req.body['q4e']);
    var q4f = parseInt(req.body['q4f']);
    var q4g = parseInt(req.body['q4g']);
    var q4h = parseInt(req.body['q4h']);
    dbconn.query(
        'UPDATE SurveyRuns SET q4a = ?, q4b = ?, q4c = ?, q4d = ?, q4e = ?, q4f = ?, q4g = ?, q4h = ? WHERE id = ?;',
        [q4a, q4b, q4c, q4d, q4e, q4f,q4g, q4h, surveyRunId], function(err, result, fields) {
            if (err) {
                next();
            }
            res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section4');
        });
};

exports.getSection4 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/section4', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
};

exports.postSection4 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var q5a = parseInt(req.body['q5a']);
    var q5b = parseInt(req.body['q5b']);
    var q5c = parseInt(req.body['q5c']);
    var q5d = parseInt(req.body['q5d']);
    var q5e = parseInt(req.body['q5e']);
    dbconn.query(
        'UPDATE SurveyRuns SET q5a = ?, q5b = ?, q5c = ?, q5d = ?, q5e = ? WHERE id = ?;',
        [q5a, q5b, q5c, q5d, q5e, surveyRunId], function(err, result, fields) {
            if (err) {
                next();
            }
            res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section5');
        });
};

exports.getSection5 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/section5', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});

};

exports.postSection5 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var q6a = parseInt(req.body['q6a']);
    var q6b = parseInt(req.body['q6b']);
    var q7a = parseInt(req.body['q7a']);
    var q7b = parseInt(req.body['q7b']);
    var q7c = parseInt(req.body['q7c']);
    var q8 = parseInt(req.body['q8']);
    if (q6b === 3 && q8 === 1) {
        var q6b_specify = req.body['q6b_specify'];
        dbconn.query(
            'UPDATE SurveyRuns SET q6a = ?, q6b = 3, q6b_specify = ?, q7a = ?, q7b = ?, q7c = ?, q8 = ? WHERE id = ?;',
            [q6a, q6b_specify, q7a, q7b, q7c, q8, surveyRunId], function (err, result, fields) {
                if (err) {
                    next();
                }
                res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section5a');
            });
    } else if (q6b === 3 && q8 === 2) {
        dbconn.query(
            'UPDATE SurveyRuns SET q6a = ?, q6b = 3, q6b_specify = ?, q7a = ?, q7b = ?, q7c = ?, q8 = ? WHERE id = ?;',
            [q6a, q6b_specify, q7a, q7b, q7c, q8, surveyRunId], function (err, result, fields) {
                if (err) {
                    next();
                }
                res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section5b');
            });
    } else if (q8 === 2) {
        dbconn.query(
            'UPDATE SurveyRuns SET q6a = ?, q6b = ?, q7a = ?, q7b = ?, q7c = ?, q8 = ? WHERE id = ?;',
            [q6a, q6b, q7a, q7b, q7c, q8, surveyRunId], function (err, result, fields) {
                if (err) {
                    next();
                }
                res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section5b');
            });
    } else {
        dbconn.query(
            'UPDATE SurveyRuns SET q6a = ?, q6b = ?, q7a = ?, q7b = ?, q7c = ?, q8 = ? WHERE id = ?;',
            [q6a, q6b, q7a, q7b, q7c, q8, surveyRunId], function (err, result, fields) {
                if (err) {
                    next();
                }

                res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section5a');
            });
     }
};

exports.getSection5a = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/section5a', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});

};

exports.postSection5a = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var q9a = parseInt(req.body['q9a']);
    var q9b = parseInt(req.body['q9b']);
    var q9c = parseInt(req.body['q9c']);
    var q9d = parseInt(req.body['q9d']);
    dbconn.query(
        'UPDATE SurveyRuns SET q9a = ?, q9b = ?, q9c = ?, q9d = ? WHERE id = ?;',
        [q9a, q9b, q9c, q9d, surveyRunId], function(err, result, fields) {
            if (err) {
                next();
            }
            res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section5b');
        });
};

exports.getSection5b = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/section5b', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
};

exports.postSection5b = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var q10 = parseInt(req.body['q10']);
    dbconn.query(
        'UPDATE SurveyRuns SET q10 = ? WHERE id = ?;',
        [q10, surveyRunId], function(err, result, fields) {
            if (err) {
                next();
            }
            res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/section6');
        });
};

exports.getSection6 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/section6', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});

};

exports.postSection6 = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var q11 = parseInt(req.body['q11']);
    var q12 = parseInt(req.body['q12']);
    var q13 = parseInt(req.body['q13']);
    var q14 = parseInt(req.body['q14']);
    dbconn.query(
        'UPDATE SurveyRuns SET q11 = ?, q12 = ?, q13 = ?, q14 = ? WHERE id = ?;',
        [q11, q12, q13, q14, surveyRunId], function(err, result, fields) {
            if (err) {
                next();
            }
            res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/feedback');
        });
};

exports.getFeedback = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/feedback', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
};

exports.postFeedback = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    var q15a1 = req.body['q15a1'] || ' ';
    var q15a2 = req.body['q15a2'] || ' ';
    var q15b1 = req.body['q15b1'] || ' ';
    var q15b2 = req.body['q15b2'] || ' ';
    var q15c = req.body['q15c'] || ' ';
    var timeCompleted = new Date();
    dbconn.query(
        'UPDATE SurveyRuns SET q15a1 = ?, q15a2 = ?, q15b1 = ?, q15b2 = ?, q15c = ?, timeCompleted = ? WHERE id = ?;',
        [q15a1, q15a2, q15b1, q15b2, q15c, timeCompleted, surveyRunId], function(err, result, fields) {
            if (err) {
                next();
            }
            res.redirect(303, config.sitePrefix + '/survey_run/' + surveyRunId + '/thankYou');
        });
};

exports.getThankYou = function(req, res, next) {
    var surveyRunId = req.params.surveyRunId;
    res.header('Content-Type', 'text/html');
    res.render('pages/thankYou', {surveyRunId: surveyRunId, surveyQuestions: surveyQuestions});
};



// exports.createAdmin = function(req, res, next){
//     var salt = bcrypt.genSaltSync(10);
//     var hashedPassword = bcrypt.hashSync('Administrator1!', salt);
//     dbconn.query(
//         'INSERT INTO Users (email_address, firstname, lastname, password, role) VALUES (?,?,?,?,?);',
//         [administrator_account, 'admin', 'admin', hashedPassword, 'admin'], function(err, result, fields) {
//             if (err) {
//                 var errMsg;
//                 if (err.code === 'ER_DUP_ENTRY') {
//                     errMsg = 'That email is already taken, please try another.';
//                     console.log(errMsg)
//                 }
//                 else {
//                     errMsg = 'An error occurred trying to register you. Please try again.';
//                     console.log(errMsg);
//                 }
//                 res.header('Content-Type', 'text/html');
//                 res.render('pages/admin_start', {
//                     title: 'Admin start',
//                     surveyQuestions : surveyQuestions,
//                     loginMessage: errMsg
//                 });
//             }
//             else {
//                 console.log('created account successfully');
//                 res.redirect(303, config.sitePrefix + '/admin_start');
//             }
//             console.log('end of function createAdmin');
//         });
// };


// exports.registerNewUser = function(req, res, next) {
//     var firstname = req.body['firstname'];
//     var lastname = req.body['lastname'];
//     var email_address = req.body['email_address'];
//     var password = req.body['password'];
//     var salt = bcrypt.genSaltSync(10);
//     var hashedPassword = bcrypt.hashSync(req.body['password'], salt);
//
//     dbconn.query(
//         'INSERT INTO Users (email_address,firstname,lastname,password) VALUES (?,?,?,?);',
//         [email_address, firstname, lastname, hashedPassword], function(err, result, fields) {
//             if (err) {
//                 var errMsg;
//                 if (err.code === 'ER_DUP_ENTRY') {
//                     errMsg = 'That email is already taken, please try another.';
//                 }
//                 else {
//                     errMsg = 'An error occurred trying to register you. Please try again.';
//                 }
//                 res.header('Content-Type', 'text/html');
//                 res.render('pages/auth/register', {
//                     title: 'Register',
//                     surveyQuestions : surveyQuestions,
//                     loginMessage: errMsg,
//                     messages : messages
//                 });
//             }
//             else {
//
//                 res.redirect(303, config.sitePrefix + '/auth/login');
//             }
//         });
// };
/*
exports.adminTest = function (req, res, next) {
    res.header('Content-Type', 'text/html');
    res.render('pages/admin_test', {loginMessage: null,
        surveyQuestions: surveyQuestions})
};*/
