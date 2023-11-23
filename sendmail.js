const nodemailer = require('nodemailer');

const sendEmailReport = async (report) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use your email service
        auth: {
            user: 'gptgroup0@gmail.com', // Your email
            pass: 'bfintgcucbaoolcz' // Your email password
        }
    });

    const mailOptions = {
        from: 'gptgroup0@gmail.com',
        to: 'psam4268@gmail.com', // Your recipient
        subject: 'Daily Visitor Report',
        text: report
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};



module.exports = sendEmailReport;