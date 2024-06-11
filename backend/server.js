const express = require("express");
const path = require("path");
const handlebars = require("handlebars");
const nodemailer = require("nodemailer");
const multer = require("multer");
const app = express();
const port = process.env.PORT || 8000;
require("dotenv").config();
const fs = require('fs');

app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
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


const emailTemplate = handlebars.compile(`
<!DOCTYPE html>
<html lang="en">
<body>
    <div class="email-container">
        <header class="email-header">
            <img src="{{logoUrl}}" alt="OM Logistics Ltd. Logo" class="logo">
        </header>
        <main>
            <div class="welcome-section">
                <h1>Welcome to <span>OM Logistics Ltd.</span></h1>
                <div class="profile-container">
                    <img src="{{profilePictureUrl}}" alt="{{name}}" class="profile-photo">
                    <div class="profile-info">
                        <h2>{{name}}</h2>
                        <p>{{designation}}</p>
                    </div>
                </div>
                <img src="{{truckUrl}}" alt="OM Logistics Truck" class="truck-image">
            </div>
            <section class="content">
                <p>Dear All,</p>
                <p>I'm delighted to announce that we have a new addition to our team, <strong>{{name}}</strong>, who has joined us as our new <strong>{{designation}}</strong>. We're truly excited to have {{name}} join us!</p>
                <p>Let's take a moment to extend a heartfelt welcome to <strong>{{name}}</strong> and ensure {{name}} feels like a valued member of our team from the start. With {{experience}} years of experience gained from esteemed company like <strong>{{pastCompanies}}</strong>, {{name}} brings a wealth of expertise to our team.</p>
                <p>Let's work together to ensure {{name}}'s journey with us is both positive and memorable. I'm eager to witness the undoubtedly positive impact {{name}} will bring to our team.</p>
                <p>Once again, please join me in warmly welcoming {{name}}.</p>
                <div class="regards">
                    <p>{{regards}}</p>
                </div>
            </section>
        </main>
        <footer class="email-footer">
            <p>&copy; 2023, Om Logistics Ltd. All Rights Reserved</p>
        </footer>
    </div>
</body>
</html>
`);


async function sendWelcomeEmail(name, designation, experience, pastCompanies, profilePicture, senderEmail, senderPassword, receiverEmails, regards, subject) {
  try {
    const toEmails = receiverEmails.join(", ");
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
      secure: true,
    });
    const profilePictureUrl = profilePicture ? `http://localhost:8000/uploads/${profilePicture.filename}` : '';
    const emailContent = emailTemplate({
      logoUrl: "http://localhost:8000/logo.png",
      truckUrl: "http://localhost:8000/truck.png",
      name,
      designation,
      experience,
      pastCompanies: pastCompanies.join(", "),
      profilePictureUrl,
      regards,
    });
    const mailOptions = {
      from: senderEmail,
      to: toEmails,
      subject: subject,
      html: emailContent,
    };
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully");
    const filePath = path.join(__dirname, 'public', 'uploads', profilePicture.filename);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      } else {
        console.log('Uploaded profile picture deleted successfully');
      }
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

app.post("/send-welcome-email", upload, async (req, res) => {
  try {
    const { name, designation, experience, regards, subject } = req.body;
    const profilePicture = req.files['profile-picture'][0];
    const pastCompanies = req.body['past-companies'];
    const receiverEmails = req.body['receiver-emails'];
    const senderEmail = req.body['sender-email'];
    const senderPassword = req.body['sender-password'];

    console.log("Received data:", {
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

    // Check if profile picture is provided
    if (!profilePicture) {
      return res.status(400).json({ error: "Please provide a profile picture" });
    }

    // Convert pastCompanies to an array if it's not empty
    const pastCompaniesArray = typeof pastCompanies === 'string' ? pastCompanies.split(";").map((company) => company.trim()) : pastCompanies || [];

    // Convert receiverEmails to an array if it's not empty
    const receiverEmailsArray = typeof receiverEmails === 'string' ? receiverEmails.split(";").map((email) => email.trim()) : receiverEmails || [];

    // Validate required fields
    if (!name || !designation || !experience || !senderEmail || !senderPassword || !regards || !subject) {
      console.log("Missing required fields");
      return res.status(400).json({ error: "Please provide all the required fields" });
    }

    // Validate email format for sender email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      return res.status(400).json({ error: "Please provide a valid sender email address" });
    }

    // Validate email format for receiver emails
    for (const email of receiverEmailsArray) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Please provide valid receiver email addresses" });
      }
    }

    // Send the welcome email
    await sendWelcomeEmail(name, designation, experience, pastCompaniesArray, profilePicture, senderEmail, senderPassword, receiverEmailsArray, regards, subject);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send welcome email" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});