  /* =========================================================
     PROFILE TABS
  ========================================================= */

  const profileTabs = document.querySelectorAll(".profile-tab");
  const tabPanels = document.querySelectorAll(".tab-panel");

  profileTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      profileTabs.forEach(item => item.classList.remove("active"));
      tabPanels.forEach(panel => panel.classList.remove("active"));

      tab.classList.add("active");

      const panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
    });
  });


  /* =========================================================
     EDIT PROFILE MODAL
  ========================================================= */

  const profileModal = document.getElementById("profileModal");
  const openEditProfile = document.getElementById("openEditProfile");
  const personalEditButton = document.getElementById("personalEditButton");
  const closeProfileModal = document.getElementById("closeProfileModal");

  function openProfileModal() {
    profileModal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    profileModal.classList.remove("show");
    document.body.style.overflow = "";
  }

  openEditProfile.addEventListener("click", openProfileModal);
  personalEditButton.addEventListener("click", openProfileModal);
  closeProfileModal.addEventListener("click", closeModal);

  document.getElementById("cancelBasic").addEventListener("click", closeModal);
  document.getElementById("cancelPassword").addEventListener("click", closeModal);

  profileModal.addEventListener("click", event => {
    if (event.target === profileModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && profileModal.classList.contains("show")) {
      closeModal();
    }
  });


  /* =========================================================
     EDIT PROFILE MODAL TABS
  ========================================================= */

  const modalTabs = document.querySelectorAll(".modal-tab");

  modalTabs.forEach(tab => {
    tab.addEventListener("click", () => {

      modalTabs.forEach(item => item.classList.remove("active"));
      document.querySelectorAll(".edit-panel")
        .forEach(panel => panel.classList.remove("active"));

      tab.classList.add("active");

      const target = tab.dataset.editTab;

      if (target === "basic") {
        document.getElementById("basicPanel").classList.add("active");
      }

      if (target === "password") {
        document.getElementById("passwordPanel").classList.add("active");
      }
    });
  });


  /* =========================================================
     PROFILE PHOTO UPLOAD
  ========================================================= */

  const photoInput = document.getElementById("photoInput");
  const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
  const removePhotoBtn = document.getElementById("removePhotoBtn");

  const photoPreviewImage = document.getElementById("photoPreviewImage");
  const photoInitials = document.getElementById("photoInitials");

  const profileAvatarImage = document.getElementById("profileAvatarImage");
  const profileInitials = document.getElementById("profileInitials");

  let profilePhotoUrl = "";

  uploadPhotoBtn.addEventListener("click", () => {
    photoInput.click();
  });

  photoInput.addEventListener("change", event => {

    const file = event.target.files[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please upload JPG, PNG or WEBP image.");
      photoInput.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5 MB.");
      photoInput.value = "";
      return;
    }

    if (profilePhotoUrl) {
      URL.revokeObjectURL(profilePhotoUrl);
    }

    profilePhotoUrl = URL.createObjectURL(file);

    photoPreviewImage.src = profilePhotoUrl;
    photoPreviewImage.classList.add("show");
    photoInitials.style.display = "none";
  });


  removePhotoBtn.addEventListener("click", () => {

    if (profilePhotoUrl) {
      URL.revokeObjectURL(profilePhotoUrl);
    }

    profilePhotoUrl = "";

    photoPreviewImage.removeAttribute("src");
    photoPreviewImage.classList.remove("show");
    photoInitials.style.display = "";

    photoInput.value = "";
  });


  /* =========================================================
     SAVE BASIC INFORMATION
  ========================================================= */

  document.getElementById("basicProfileForm").addEventListener("submit", event => {

    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const dob = document.getElementById("dob").value;
    const gender = document.getElementById("gender").value;
    const language = document.getElementById("language").value;
    const address = document.getElementById("address").value.trim();

    if (!fullName || !email || !phone) {
      alert("Please fill all required fields.");
      return;
    }

    document.getElementById("profileName").textContent = fullName;
    document.getElementById("topUserName").textContent = fullName;
    document.getElementById("sidebarUserName").textContent = fullName;

    document.getElementById("overviewName").textContent = fullName;
    document.getElementById("overviewEmail").textContent = email;
    document.getElementById("overviewGender").textContent = gender;
    document.getElementById("overviewLanguage").textContent = language;

    document.getElementById("personalName").textContent = fullName;
    document.getElementById("personalEmail").textContent = email;
    document.getElementById("personalGender").textContent = gender;
    document.getElementById("personalLanguage").textContent = language;

    document.getElementById("contactEmail").textContent = email;
    document.getElementById("contactPhone").textContent = phone;
    document.getElementById("contactAddress").textContent = address;

    if (dob) {
      const formattedDob = new Date(dob + "T00:00:00")
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        });

      document.getElementById("overviewDob").textContent = formattedDob;
      document.getElementById("personalDob").textContent = formattedDob;
    }

    if (profilePhotoUrl) {

      profileAvatarImage.src = profilePhotoUrl;
      profileAvatarImage.classList.add("show");
      profileInitials.style.display = "none";

      document.getElementById("topAvatar").innerHTML =
        `<img src="${profilePhotoUrl}" alt="Profile photo">`;

      document.getElementById("sidebarAvatar").innerHTML =
        `<img src="${profilePhotoUrl}" alt="Profile photo">`;
    }

    closeModal();
  });


  /* =========================================================
     PASSWORD SHOW / HIDE
  ========================================================= */

  document.querySelectorAll(".password-eye").forEach(button => {

    button.addEventListener("click", () => {

      const input = document.getElementById(button.dataset.target);
      const icon = button.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.className = "bi bi-eye-slash";
      } else {
        input.type = "password";
        icon.className = "bi bi-eye";
      }
    });

  });


  /* =========================================================
     PASSWORD RULES
  ========================================================= */

  const newPassword = document.getElementById("newPassword");

  function updateRules() {

    const value = newPassword.value;

    const rules = {
      ruleLength: value.length >= 8,
      ruleUpper: /[A-Z]/.test(value),
      ruleNumber: /[0-9]/.test(value),
      ruleSpecial: /[^A-Za-z0-9]/.test(value)
    };

    Object.entries(rules).forEach(([id, valid]) => {

      const element = document.getElementById(id);
      const icon = element.querySelector("i");

      element.classList.toggle("valid", valid);

      icon.className = valid
        ? "bi bi-check-circle-fill"
        : "bi bi-circle";
    });
  }

  newPassword.addEventListener("input", updateRules);


  /* =========================================================
     CHANGE PASSWORD VALIDATION
  ========================================================= */

  document.getElementById("passwordForm").addEventListener("submit", event => {

    event.preventDefault();

    const currentPassword =
      document.getElementById("currentPassword").value;

    const newPasswordValue =
      document.getElementById("newPassword").value;

    const confirmPassword =
      document.getElementById("confirmPassword").value;

    const message =
      document.getElementById("passwordMessage");

    message.className = "password-message";
    message.textContent = "";

    if (!currentPassword || !newPasswordValue || !confirmPassword) {
      message.textContent = "Please fill all password fields.";
      message.classList.add("error");
      return;
    }

    if (
      newPasswordValue.length < 8 ||
      !/[A-Z]/.test(newPasswordValue) ||
      !/[0-9]/.test(newPasswordValue) ||
      !/[^A-Za-z0-9]/.test(newPasswordValue)
    ) {
      message.textContent =
        "Please meet all password requirements.";
      message.classList.add("error");
      return;
    }

    if (newPasswordValue !== confirmPassword) {
      message.textContent =
        "New password and confirm password do not match.";
      message.classList.add("error");
      return;
    }

    message.textContent = "Password updated successfully.";
    message.classList.add("success");

    setTimeout(() => {

      document.getElementById("passwordForm").reset();
      updateRules();
      closeModal();

      message.textContent = "";
      message.className = "password-message";

    }, 900);
  });


  /* =========================================================
     MOBILE SIDEBAR
  ========================================================= */

  document.getElementById("mobileMenu")
    .addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
    });