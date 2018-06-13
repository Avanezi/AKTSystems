var mysql = require('mysql');
var fs = require('fs');
var url = require('url');
var uuidV1 = require('uuid/v1');
var nodemailer = require('nodemailer');
var bcrypt = require('bcryptjs');

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
    console.log('about to create admin');
    var salt = bcrypt.genSaltSync(10);
    var hashedPassword = bcrypt.hashSync('Administrator1!', salt);
    dbconn.query(
        'INSERT INTO Users (email_address, firstname, lastname, password, role) VALUES (?,?,?,?,?);',
        ['admin@admin', 'admin', 'admin', hashedPassword, 'admin'], function(err, result, fields) {
            if (err) {
                var errMsg;
                if (err.code === 'ER_DUP_ENTRY') {
                    errMsg = 'That email is already taken, please try another.';
                }
                else {
                    errMsg = 'An error occurred trying to register you. Please try again.';
                }
                res.header('Content-Type', 'text/html');
                res.render('pages/admin_test', {
                    title: 'Admin Test',
                    surveyQuestions : surveyQuestions,
                    loginMessage: errMsg
                });
            }
            else {
                console.log('account created!')
            }
        });
};


//authentication
exports.requireLoginHandler = function(req, res, next) {
        if (!req.session.user) {
        console.log('In requireLoginHandler; no user in session yet.');
            res.header('Content-Type', 'text/html');
        res.render('pages/auth/login', {loginMessage: null,
            surveyQuestions : surveyQuestions});
        res.redirect(303, config.sitePrefix + '/auth/login');
    }
    else {
        console.log('In requireLoginHandler; user: ' + req.session.user);
        next();
    }
};



exports.checkAdminExist = function (req, res, next){
    dbconn.query("SELECT * FROM Users where role = 'admin'",
        function(err, result, fields) {
            console.log('checking if admin account exists...');
            if (result.length === 0){
                console.log('no results found!');
                createAdmin();
                next();
            }
            else if (result[0].role === 'admin') {
                console.log('admin account exists;');
                next()
            }
        }
    )};

exports.getAdminInterface = function (req, res, next) {
    res.header('Content-Type', 'text/html');
    res.render('pages/admin_start', {loginMessage: null,
        surveyQuestions: surveyQuestions})
};

exports.adminTest = function (req, res, next) {
    res.header('Content-Type', 'text/html');
    res.render('pages/admin_test', {loginMessage: null,
        surveyQuestions: surveyQuestions})
};

exports.getLogin = function(req, res, next) {
    res.header('Content-Type', 'text/html');
    res.render('pages/auth/login', {loginMessage: null,
    surveyQuestions : surveyQuestions});
};
exports.getRegister = function(req, res, next) {

    res.header('Content-Type', 'text/html');
    res.render('pages/auth/register', {loginMessage: null,
    surveyQuestions : surveyQuestions,
        messages : messages})
};

//this function needs to be updated to check the tempUsers table. No registered users can login because it only checks the Users table.
exports.postLoginRequest = function(req, res, next) {
    var email_address = req.body['email_address'];
    var password = req.body['password'];

    dbconn.query('SELECT email_address, password FROM Users WHERE email_address = ?;',
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

                        res.redirect(303, config.sitePrefix + '/patients');
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

exports.registerAdmin = function(req, res, next){
    var email_address = req.body['email_address'];
    var password = req.body['passwordNew'];
    var security_question = req.body['security_question'];
    var security_answer = req.body['security_answer'];
    var salt = bcrypt.genSaltSync(10);
    var hashedPassword = bcrypt.hashSync(password, salt);
    var hashedAnswer = bcrypt.hashSync(security_answer, salt);
    // var hashedAnswer = bcrypt.hashSync(security_answer, salt);
    // console.log('pw: ', hashedPassword, 'answer: ', hashedAnswer);
    //assumes 1 admin
    var query = "UPDATE Users SET securityQuestion = '" + security_question + "', securityAnswer = '" + hashedAnswer + "', email_address = '" + email_address + "', password = '" + hashedPassword + "' WHERE role = 'admin';";
    dbconn.query(
        query, function(err, result, fields) {
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
                    surveyQuestions : surveyQuestions,
                    loginMessage: errMsg
                });
            }
            else {
                console.log('============= Admin account has been updated =============');
                res.redirect(303, config.sitePrefix + '/auth/login');
            }
        });
};

exports.registerTempUser = function(req, res, next) {
    var firstname = req.body['firstname'];
    var lastname = req.body['lastname'];
    var email_address = req.body['email_address'];
    var password = req.body['password'];
    var security_question = req.body['security_question'];
    var security_answer = req.body['security_answer'];
    var role = 'user';
    var salt = bcrypt.genSaltSync(10);
    var hashedPassword = bcrypt.hashSync(password, salt);
    var hashedAnswer = bcrypt.hashSync(security_answer, salt);
    var registrationId = uuidV1();
    registrationId = registrationId.toString();
    dbconn.query(
        'INSERT INTO tempUsers (id, firstname, lastname, role, email_address, password, securityQuestion, securityAnswer) VALUES (?,?,?,?,?,?,?,?);',
        [registrationId, firstname, lastname, role, email_address, hashedPassword, security_question, hashedAnswer], function(err, result, fields) {
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
                    surveyQuestions : surveyQuestions,
                    messages : messages,
                    loginMessage: errMsg

                });
            }
            else {
                res.redirect(303, config.sitePrefix + '/auth/login');
            }
        });
    sendEmail(firstname, email_address, registrationId);
    console.log('url: ' + 'http://localhost:3003/team3/auth/' + registrationId + '/login');
};


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

//send survey

var sendEmail = function(patientFirstName, emailAddress, surveyRunId) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
             user: 'pesa.testing@gmail.com',
             pass: 'Conestoga1'
         }
    });
    var mailOptions = {
        from: 'Primary Care Clinic <pesa.testing@gmail.com>',
        to:  emailAddress,
        subject: 'Patient Experience Survey',
        text: 'This is a test using Node.js module nodemailer',
        html: '<html><body>Dear ' + patientFirstName + ':<br />According to our records, you have visited our office recently. We would appreciate your feedback to allow us to improve your future experience.  Please follow the link to complete our survey: <a href="localhost:3003/team3/survey_run/' + surveyRunId.toString() + '/language">Start</a><br>Best Wishes,<br>Conestoga Primary Care Clinic</a></body></html>'
    };
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

// get patients
exports.getPatients = function(req, res, next) {
    var urlObj = url.parse(req.url, true);
    var status = urlObj.query['status'];
    var msg = null;
    if (status==='ns') {
        msg = 'Please select email address!';
    }
    else if (status === 'np') {
        msg = 'New patient has been added!'
    }
    else if (status === 'ss'){
        msg = 'Survey has been sent!';
    }
    else{
     msg = null;
    }
    dbconn.query('SELECT id, patientFirstName, patientLastName, patientEmailAddress FROM Patients;',
        function(err, results, fields) {
            if (err) {
                next();
            }

            res.header('Content-Type', 'text/html');
            res.render('pages/patients', {
                surveyQuestions : surveyQuestions,
                patients: results,
                message: msg
            });
        });
};


exports.postNewPatient = function(req, res, next) {
    var patientFirstName = req.body['patientFirstName'];
    var patientLastName = req.body['patientLastName'];
    var patientEmailAddress = req.body['patientEmailAddress'];

    dbconn.query(
        'INSERT INTO Patients(patientFirstName, patientLastName, patientEmailAddress) VALUES (?, ?, ?);',
        [patientFirstName, patientLastName, patientEmailAddress], function(err, result, fields) {
            if (err) {
                next();
            }
            res.redirect(303, config.sitePrefix + '/patients?status=np');
        });
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


