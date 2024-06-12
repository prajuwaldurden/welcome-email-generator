const express = require('express');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const app = express();
const Buffer = require('buffer').Buffer;
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

const emailTemplate = handlebars.compile(`
<!DOCTYPE html>
<html>
 <head>
   <meta charset="UTF-8">
   <title>Welcome to OM Logistics Ltd.</title>
   <style type="text/css">
     body, table, td, p, a, h1, h2 {
       font-family: Arial, sans-serif;
     }
     table {
       max-width: 600px;
       margin: 0 auto;
       background-color: #ffffff;
       border-collapse: collapse;
     }
     td {
       padding: 0;
     }
     img {
       border: 0;
       max-width: 100%;
       height: auto;
     }
     .header {
       background-color: #002266;
       padding: 20px;
       text-align: center;
     }
     .header img {
       max-width: 200px;
     }
     .banner {
       background-color: #0080D5;
       padding: 20px;
       text-align: center;
       position: relative;
       overflow: hidden;
     }
     .banner h1 {
       color: #FFFFFF;
       font-size: 24px;
       margin: 0;
       z-index: 1;
       position: relative;
     }
     .profile {
       padding: 20px;
       text-align: center;
       display: flex;
       justify-content: center;
       align-items: center;
     }
     .profile-info {
       text-align: left;
       margin-right: 20px;
     }
     .profile img {
       width: 120px;
       height: 120px;
       border-radius: 50%;
       object-fit: cover;
     }
     .profile h2 {
       color: #333333;
       font-size: 20px;
       margin: 10px 0;
     }
     .profile p {
       color: #666666;
       font-size: 16px;
       margin: 0;
     }
     .content {
       padding: 20px;
     }
     .content p {
       margin: 10px 0;
       line-height: 1.5;
     }
     .regards {
       margin-top: 20px;
     }
     .real-footer {
       background-color: #002266;
       color: #FFFFFF;
       font-size: 12px;
       padding: 10px;
       text-align: center;
     }
   </style>
 </head>
 <body>
   <table width="100%" border="0" cellspacing="0" cellpadding="0">
     <tr>
       <td align="center">
         <table border="0" cellspacing="0" cellpadding="0">
           <tr>
             <td class="header">
               <img src="{{logoBase64}}" alt="OM Logistics Ltd. Logo">
             </td>
           </tr>
           <tr>
             <td class="banner">
               <h1>Welcome to OM Logistics Ltd.</h1>
             </td>
           </tr>
           <tr>
             <td class="profile">
               <div class="profile-info">
                 <img src="{{profilePictureBase64}}" alt="{{name}}'s Profile Picture">
                 <h2>{{name}}</h2>
                 <p>{{designation}}</p>
               </div>

             </td>
           </tr>
           <tr>
             <td class="content">
               <p>Dear All,</p>
               <p>I'm delighted to announce that we have a new addition to our team, {{name}}, who has joined us as our new {{designation}}.</p>
               <p>We're truly excited to have {{name}} join us!</p>
               <p>Let's take a moment to extend a heartfelt welcome to {{name}} and ensure {{name}} feels like a valued member of our team from the start.</p>
               <p>With {{experience}}+ years of experience gained from esteemed companies like {{pastCompanies}}, {{name}} brings a wealth of expertise to our team.</p>
               <p>Let's work together to ensure {{name}}'s journey with us is both positive and memorable. I'm eager to witness the undoubtedly positive impact {{name}} will bring to our team.</p>
               <p>Once again, please join me in warmly welcoming {{name}}.</p>
               <div class="regards">
                 <p>{{regards}}</p>
               </div>
             </td>
           </tr>
           <tr>
             <td class="real-footer">
               &copy; 2024, Om Logistics Ltd. All Rights Reserved
             </td>
           </tr>
         </table>
       </td>
     </tr>
   </table>
 </body>
</html>





`);
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
      pastCompanies: pastCompanies.join(', '),
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
