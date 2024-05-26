const express = require("express");
const path = require("path");
const handlebars = require("handlebars");
const nodemailer = require("nodemailer");

const app = express();
const port = process.env.PORT || 3000;

// Serve the frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// Parse incoming request bodies in JSON format
app.use(express.json());

// Define the email template
const emailTemplate = handlebars.compile(`
<html>
  <body>
    <h1>Welcome to our team, {{name}}!</h1>
    <p>We're thrilled to have you on board. With your {{experience}} years of experience at {{pastCompanies}}, we're confident that you'll be a valuable addition to our organization.</p>
    <img src="{{profilePicture}}" alt="{{name}}'s Profile Picture">
  </body>
</html>
`);

// Define the email sending function
async function sendWelcomeEmail(
  name,
  experience,
  pastCompanies,
  profilePicture,
  emailAddress
) {
  try {
    // Create a transporter using your email service provider's credentials
    const transporter = nodemailer.createTransport({
      // Add your email service provider configuration here
    });

    const emailContent = emailTemplate({
      name,
      experience,
      pastCompanies,
      profilePicture,
    });

    // Send the email
    await transporter.sendMail({
      from: "your-company@example.com",
      to: emailAddress,
      subject: "Welcome to our team!",
      html: emailContent,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Define the API endpoint to receive new employee data
app.post("/send-welcome-email", (req, res) => {
  const { name, experience, pastCompanies, profilePicture, emailAddress } =
    req.body;
  sendWelcomeEmail(
    name,
    experience,
    pastCompanies,
    profilePicture,
    emailAddress
  )
    .then(() => res.sendStatus(200))
    .catch((error) => res.status(500).json({ error: error.message }));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
