create DATABASE pesdb3;
USE pesdb3;

CREATE TABLE mailer (
id int not null auto_increment,
tempId varchar(250),
email_address varchar(50) not null,
password varchar (256) not null,
verified char(1) not null,
primary key(id)
);

CREATE TABLE Patients
(
id INT NOT NULL AUTO_INCREMENT,
patientFirstName VARCHAR(256) NOT NULL,
patientLastName VARCHAR(256) NOT NULL,
patientEmailAddress VARCHAR (256) NOT NULL,
PRIMARY KEY (id)
);

CREATE TABLE recipients
(
id INT NOT NULL AUTO_INCREMENT,
first_name VARCHAR(256) NOT NULL,
last_name VARCHAR(256) NOT NULL,
email_address VARCHAR (256) NOT NULL,
added_by VARCHAR (256) NOT NULL,
opt_in CHAR(1) NOT NULL,
PRIMARY KEY (id)
);

CREATE TABLE Users
(
	registrationId varchar(250)NOT NULL,
	firstname VARCHAR(128) not null,
    lastname VARCHAR(128) not null,
    role VARCHAR(128) not null,
	email_address VARCHAR(256) NOT NULL UNIQUE,
	password VARCHAR(256) not null,
	securityQuestion VARCHAR(250),
	securityAnswer VARCHAR(250),
    email_verified char(1) not null,
    account_verified char(1) not null,
    tempId varchar(250),
	PRIMARY KEY (registrationId)
);

CREATE TABLE SurveyRuns
(
    id VARCHAR(256) NOT NULL,
    completedFor INT NOT NULL,
    timeSent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    timeStarted TIMESTAMP NULL,
    q0 VARCHAR(64) NULL,
    q0_other VARCHAR(128) NULL,
    q1 INT NULL,
    q1_other VARCHAR(128) NULL,
    q2a INT NULL,
    q2b INT NULL,
    q3a INT NULL,
    q3b INT NULL,
    q3c INT NULL,
    q4a INT NULL,
    q4b INT NULL,
    q4c INT NULL,
    q4d INT NULL,
    q4e INT NULL,
    q4f INT NULL,
    q4g INT NULL,
    q4h INT NULL,
    q5a INT NULL,
    q5b INT NULL,
    q5c INT NULL,
    q5d INT NULL,
    q5e INT NULL,
	q6a INT NULL,
    q6b INT NULL,
    q6b_specify varchar(10) NULL,
	q7a INT NULL,
    q7b INT NULL,
    q7c INT NULL,
    q8 INT NULL,
    q9a INT NULL,
    q9b INT NULL,
    q9c INT NULL,
    q9d INT NULL,
    q10 INT NULL,
    q11 INT NULL,
    q12 INT NULL,
    q13 INT NULL,
    q14 INT NULL,
    q15a1 varchar(500) NULL,
    q15a2 varchar(500) NULL,
    q15b1 varchar(500) NULL,
    q15b2 varchar(500) NULL,
    q15c varchar(500) NULL,
    timeCompleted TIMESTAMP NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (completedFor) REFERENCES Patients(id)
);

