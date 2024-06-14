const express = require('express');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 8000;
require('dotenv').config();

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage }).fields([
  { name: 'profile-picture', maxCount: 1 },
  { name: 'past-companies', maxCount: 1 },
  { name: 'receiver-emails', maxCount: 1 },
  { name: 'sender-email', maxCount: 1 },
  { name: 'sender-password', maxCount: 1 }
]);

// Convert static images to Base64
const getBase64Image = (filePath) => {
  try {
    const file = fs.readFileSync(filePath);
    return `data:image/png;base64,${file.toString('base64')}`;
  } catch (error) {
    console.error(`Error reading file at ${filePath}:`, error);
    return '';
  }
};

const logoBase64 = getBase64Image(path.join(__dirname, 'public/logo.png'));
const truckBase64 = getBase64Image(path.join(__dirname, 'public/truck.png'));

const mjml2html = require('mjml');
const welcomeEmailMJML = fs.readFileSync(path.join(__dirname, 'welcome-email.mjml'), 'utf8');

const emailTemplate = handlebars.compile(mjml2html(welcomeEmailMJML).html);
async function sendWelcomeEmail({ name, designation, experience, pastCompanies, profilePicture, senderEmail, senderPassword, receiverEmails, regards, subject }) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
      secure: true,
    });

    let profilePictureBase64 = '';
    if (profilePicture) {
      const filePath = path.join(__dirname, 'public', 'uploads', profilePicture.filename);
      profilePictureBase64 = getBase64Image(filePath);
    } else {
      console.warn('Profile picture not provided');
    }

    const emailContent = emailTemplate({
      logoBase64,
      truckBase64,
      profilePictureBase64,
      name,
      designation,
      experience,
      pastCompanies: pastCompanies
      .slice(0, -1)
      .join(', ')
      .concat(pastCompanies.length > 1 ? ' and ' + pastCompanies.slice(-1) : ''),
      regards,
    });

    const mailOptions = {
      from: senderEmail,
      subject: subject,
      html: emailContent,
    };

   
    for (const email of receiverEmails) {
      mailOptions.to = email;
      await transporter.sendMail(mailOptions);
    }

    console.log('Welcome emails sent successfully');

    const filePath = path.join(__dirname, 'public', 'uploads', profilePicture.filename);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      } else {
        console.log('Uploaded profile picture deleted successfully');
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
app.post('/send-welcome-email', upload, async (req, res) => {
  try {
    const { name, designation, experience, regards, subject } = req.body;
    const profilePicture = req.files['profile-picture'][0];
    const pastCompanies = req.body['past-companies'];
    const receiverEmails = req.body['receiver-emails'];
    const senderEmail = req.body['sender-email'];
    const senderPassword = req.body['sender-password'];

    console.log('Received data:', {
      name,
      designation,
      experience,
      pastCompanies,
      senderEmail,
      senderPassword,
      receiverEmails,
      regards,
      subject,
      profilePicture,
    });

    const pastCompaniesArrayDup =  pastCompanies.flatMap(company => company.split(';')).map(company => company.trim());
    const pastCompaniesArray = Array.from(new Set(pastCompaniesArrayDup))
  
    const receiverEmailsArrayDup = receiverEmails.flatMap(email => email.split(';')).map(email => email.trim());
const receiverEmailsArray = Array.from(new Set(receiverEmailsArrayDup))

    if (!name || !designation || !experience || !senderEmail || !senderPassword || !regards || !subject || !profilePicture) {
      return res.status(400).json({ error: 'Please provide all the required fields' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      return res.status(400).json({ error: 'Please provide a valid sender email address' });
    }

    for (const email of receiverEmailsArray) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please provide valid receiver email addresses' });
      }
    }

    await sendWelcomeEmail({
      name,
      designation,
      experience,
      pastCompanies: pastCompaniesArray,
      profilePicture,
      senderEmail,
      senderPassword,
      receiverEmails: receiverEmailsArray,
      regards,
      subject,
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
