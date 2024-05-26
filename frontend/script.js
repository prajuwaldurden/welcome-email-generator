document
  .getElementById("welcome-email-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const experience = document.getElementById("experience").value;
    const pastCompanies = document.getElementById("past-companies").value;
    const profilePictureInput = document.getElementById("profile-picture");
    const emailAddress = document.getElementById("email-address").value;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("experience", experience);
    formData.append("pastCompanies", pastCompanies);
    formData.append("emailAddress", emailAddress);
    formData.append("profilePicture", profilePictureInput.files[0]);

    try {
      await fetch("/send-welcome-email", {
        method: "POST",
        body: formData,
      });
      alert("Welcome email sent successfully!");
    } catch (error) {
      alert("Error sending welcome email: " + error.message);
    }
  });
