const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Missing email credentials. Set EMAIL_USER and EMAIL_PASS in your .env');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `TaskFlow <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        if (err && err.code === 'EAUTH') {
            console.error('Email send failed: Authentication error (EAUTH).');
            console.error('If you are using Gmail, create an App Password and set it as EMAIL_PASS,');
            console.error('or configure OAuth2. See: https://support.google.com/mail/?p=BadCredentials');
        }
        console.error('Email send failed:', err.message || err);
        throw err;
    }
};

module.exports = sendEmail;
