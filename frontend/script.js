const API_URL = 'http://localhost:8000';
document.getElementById("welcome-email-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const name = formData.get("name").trim();
  const designation = formData.get("designation").trim();
  const experience = formData.get("experience").trim();
  const pastCompaniesInput = formData.get("past-companies").trim();
  const pastCompanies = pastCompaniesInput ? pastCompaniesInput.split(";").map((company) => company.trim()) : [];
  const profilePictureInput = document.getElementById("profile-picture");
  const profilePicture = profilePictureInput.files[0];
  const senderEmail = formData.get("sender-email").trim();
  const senderPassword = formData.get("sender-password").trim();
  const receiverEmailsInput = formData.get("receiver-emails").trim();
  const receiverEmails = receiverEmailsInput ? receiverEmailsInput.split(";").map((email) => email.trim()) : [];
  const regards = formData.get("regards").trim();
  const subject = formData.get("subject").trim();
  
  console.log("Name:", name);
  console.log("Designation:", designation);
  console.log("Experience:", experience);
  console.log("Past Companies:", pastCompanies);
  console.log("Profile Picture:", profilePicture);
  console.log("Sender Email:", senderEmail);
  console.log("Sender Password:", senderPassword);
  console.log("Receiver Emails:", receiverEmails);
  console.log("Regards:", regards);
  console.log("Subject:", subject);
  
  if (!name || !designation || !experience || !profilePicture || !senderEmail || !senderPassword || !receiverEmails.length || !regards || !subject) {
    alert("Please fill in all the required fields.");
    return;
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    alert("Please enter a valid sender email address.");
    return;
  }
  
  for (const email of receiverEmails) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter valid receiver email addresses.");
      return;
    }
  }
  
  const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedFileTypes.includes(profilePicture.type)) {
    alert("Please upload a valid image file (JPEG, PNG, GIF).");
    return;
  }

  formData.append("past-companies", pastCompanies.join(";"));
  formData.append("receiver-emails", receiverEmails.join(";"));
  
  try {
    const response = await fetch(`${API_URL}/send-welcome-email`, {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      alert("Welcome email sent successfully!");
      form.reset();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error);
    }
  } catch (error) {
    console.error("Error:", error);
    alert(error.message);
  }
});