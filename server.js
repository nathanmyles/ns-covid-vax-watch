"use strict";
const axios = require('axios');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const { EmailStore } = require("./email-store");

console.log('--------------------------------------------')
console.log('Covid Scrapper started');
console.log('--------------------------------------------\n')


const config = require('./config');

const emailStore = new EmailStore();

schedule.scheduleJob(`*/1 * * * *`, queryCovid);

queryCovid();

function queryCovid() {
  axios
    .get('https://sync-cf2-1.canimmunize.ca/fhir/v1/public/booking-page/17430812-2095-4a35-a523-bb5ce45d60f1/appointment-types?preview=false')
    .then(response => {
      for (const age in config.targetAgeToEmails) {
        const minAge = response.data.results
          .map(result => result.minAge)
          .reduce((a, b) => Math.min(a, b))

        const resultsUnderAgeFound = minAge < age
        if (!resultsUnderAgeFound) {
          console.log('No results under ' + age + ' found')
        } else {
          console.log()
          console.log('-------------------------------------------------')
          console.log('-------------------------------------------------')
          console.log('-------------------------------------------------')
          console.log('APPOINTMENT FOR ' + minAge + ' FOUND!!!')
          console.log('-------------------------------------------------')
          console.log('-------------------------------------------------')
          console.log('-------------------------------------------------')
          console.log()
          notifyEmails(config.targetAgeToEmails[age], minAge)
        }
      }
    })
}

function notifyEmails(emails, age) {
  if (!emails.length) {
    return
  }

  let transporter = getMailerTransport();
  if (!transporter) {
    return;
  }
  emails.forEach(email => {
    if (emailStore.includes(email)) {
      return;
    }
    // setup e-mail data with unicode symbols
    let mailOptions = {
      from: `Covid Vax Watch <${config.email.gmailUser}@gmail.com>`, // sender address
      to: `${email}`, // list of receivers
      subject: `Vaccine is available for people >${age} years old!`, // Subject line
      text: 'GO GO GO GO!!!', // plaintext body
      html: (
          '<div>' +
          '<p>GO GO GO GO!</p>' +
          '<p>Book an appointment here: <a href="https://novascotia.flow.canimmunize.ca/en/9874123-19-7418965">https://novascotia.flow.canimmunize.ca/en/9874123-19-7418965</a></p>' +
          '</div>'    
      ) // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, error => {
      if (error) {
        return console.log(`Email failed: ${error}`);
      }

      emailStore.add(email);
      console.log('Email sent successfully\n');
    });
  });
}

function getMailerTransport() {
  if (config.email.gmailPassword) {
    return nodemailer.createTransport(
      `smtps://${config.email.gmailUser}%40gmail.com:${config.email.gmailPassword}@smtp.gmail.com`);
  }
}
