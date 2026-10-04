/* Edit these values to personalize the invitation. Use "#" until a map URL is ready. */
const EVENT_DETAILS = {
  date: "[DATE]",
  time: "[TIME]",
  location: "[VENUE / CITY]",
  attire: "[ATTIRE DESCRIPTION]",
  rsvpDeadline: "[RSVP DEADLINE]",
  locationUrl: "#"
};

document.querySelectorAll("[data-event]").forEach((element) => {
  const key = element.dataset.event;
  if (Object.hasOwn(EVENT_DETAILS, key)) {
    element.textContent = EVENT_DETAILS[key];
  }
});

const locationLink = document.querySelector("[data-location-link]");
if (locationLink) {
  locationLink.href = EVENT_DETAILS.locationUrl;
}

// Keep the mobile navigation operable by keyboard and dismiss it after selection.
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");

function closeNavigation() {
  if (!menuToggle || !navigation) return;
  menuToggle.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
}

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNavigation);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeNavigation();
      menuToggle.focus();
    }
  });
}

const form = document.querySelector("#rsvp-form");
const attendingFields = document.querySelector("#attending-fields");
const attendeeCount = document.querySelector("#attendee-count");
const additionalGuests = document.querySelector("#additional-guests");
const dietaryDetails = document.querySelector("#dietary-details");
const dietaryMore = document.querySelector("#dietary-more");
const formStatus = document.querySelector("#form-status");
const confirmation = document.querySelector("#confirmation");

function showAttendingFields(shouldShow) {
  if (!attendingFields) return;

  if (shouldShow) {
    attendingFields.hidden = false;
    requestAnimationFrame(() => attendingFields.classList.add("is-visible"));
    attendeeCount.required = true;
    form.querySelectorAll('input[name="alcohol"]').forEach((input) => {
      input.required = true;
    });
  } else {
    attendingFields.classList.remove("is-visible");
    attendingFields.hidden = true;
    attendeeCount.required = false;
    attendeeCount.value = "";
    additionalGuests.replaceChildren();
    form.querySelectorAll('input[name="alcohol"]').forEach((input) => {
      input.required = false;
      input.checked = false;
    });
    form.querySelectorAll('input[name="dietary"]').forEach((input) => {
      input.checked = false;
    });
    dietaryDetails.hidden = true;
    dietaryMore.required = false;
    dietaryMore.value = "";
  }
}

form.querySelectorAll('input[name="attendance"]').forEach((input) => {
  input.addEventListener("change", () => {
    showAttendingFields(input.value === "accept");
    clearError("attendance");
    formStatus.textContent = "";
  });
});

// Create name fields only for the additional guests in the invitation.
attendeeCount.addEventListener("change", () => {
  additionalGuests.replaceChildren();
  const count = Number(attendeeCount.value);

  for (let guestNumber = 2; guestNumber <= count; guestNumber += 1) {
    const guest = document.createElement("section");
    guest.className = "guest-fields";
    guest.setAttribute("aria-labelledby", `guest-${guestNumber}-title`);

    const heading = document.createElement("h3");
    heading.id = `guest-${guestNumber}-title`;
    heading.textContent = `Guest ${guestNumber}`;
    guest.append(heading);

    for (const [fieldName, labelText, autocomplete] of [
      ["firstName", "First Name", "given-name"],
      ["lastName", "Last Name", "family-name"]
    ]) {
      const field = document.createElement("div");
      field.className = "form-field";

      const id = `guest-${guestNumber}-${fieldName}`;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = `${labelText} *`;

      const input = document.createElement("input");
      input.id = id;
      input.name = `guest${guestNumber}${fieldName[0].toUpperCase()}${fieldName.slice(1)}`;
      input.autocomplete = autocomplete;
      input.required = true;
      input.setAttribute("aria-describedby", `${id}-error`);

      const error = document.createElement("span");
      error.className = "field-error";
      error.id = `${id}-error`;

      field.append(label, input, error);
      guest.append(field);
    }

    additionalGuests.append(guest);
  }

  clearError("attendee-count");
  formStatus.textContent = "";
});

// "No" is exclusive; allergy and other choices share a single details field.
const dietaryChoices = [...form.querySelectorAll('input[name="dietary"]')];
dietaryChoices.forEach((input) => {
  input.addEventListener("change", () => {
    if (input.value === "none" && input.checked) {
      dietaryChoices.filter((choice) => choice !== input).forEach((choice) => {
        choice.checked = false;
      });
    } else if (input.checked) {
      dietaryChoices.find((choice) => choice.value === "none").checked = false;
    }

    const needsDetails = dietaryChoices.some(
      (choice) => choice.checked && (choice.value === "allergy" || choice.value === "other")
    );
    dietaryDetails.hidden = !needsDetails;
    dietaryMore.required = needsDetails;
    if (!needsDetails) {
      dietaryMore.value = "";
      clearError("dietary-more");
    }
    clearError("dietary");
  });
});

function showError(key, message, field) {
  const error = document.querySelector(`#${key}-error`);
  if (error) error.textContent = message;
  if (field) field.setAttribute("aria-invalid", "true");
}

function clearError(key) {
  const error = document.querySelector(`#${key}-error`);
  if (error) error.textContent = "";
  const field = document.querySelector(`#${key}`);
  if (field) field.removeAttribute("aria-invalid");
  if (key === "attendance" || key === "dietary" || key === "alcohol") {
    form.querySelectorAll(`input[name="${key}"]`).forEach((input) => {
      input.removeAttribute("aria-invalid");
    });
  }
}

function clearAllErrors() {
  form.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
  form.querySelectorAll("[aria-invalid='true']").forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
}

function validateForm(attending) {
  clearAllErrors();
  let isValid = true;
  const firstName = form.elements.firstName;
  const lastName = form.elements.lastName;
  const email = form.elements.email;

  if (!firstName.value.trim()) {
    showError("first-name", "Please enter your first name.", firstName);
    isValid = false;
  }
  if (!lastName.value.trim()) {
    showError("last-name", "Please enter your last name.", lastName);
    isValid = false;
  }
  if (!email.value.trim()) {
    showError("email", "Please enter your email address.", email);
    isValid = false;
  } else if (!email.validity.valid) {
    showError("email", "Please enter a valid email address.", email);
    isValid = false;
  }

  const attendance = form.querySelector('input[name="attendance"]:checked');
  if (!attendance) {
    showError("attendance", "Please let us know whether you can join us.", form.querySelector('input[name="attendance"]'));
    isValid = false;
  }

  if (attending) {
    if (!attendeeCount.value) {
      showError("attendee-count", "Please choose the number of attendees.", attendeeCount);
      isValid = false;
    } else {
      additionalGuests.querySelectorAll("input[required]").forEach((input) => {
        if (!input.value.trim()) {
          const key = input.id;
          showError(key, "Please enter this guest's name.", input);
          isValid = false;
        }
      });
    }

    if (!dietaryChoices.some((choice) => choice.checked)) {
      showError("dietary", "Please select an option, or choose No.", dietaryChoices[0]);
      isValid = false;
    }
    if (dietaryMore.required && !dietaryMore.value.trim()) {
      showError("dietary-more", "Please tell us a little more.", dietaryMore);
      isValid = false;
    }
    if (!form.querySelector('input[name="alcohol"]:checked')) {
      showError("alcohol", "Please select Yes or No.", form.querySelector('input[name="alcohol"]'));
      isValid = false;
    }
  }

  return isValid;
}

/*
 * RSVP integration point:
 * Connect this function to a trusted form service or backend when one is chosen.
 * GitHub Pages cannot store submissions. This version intentionally sends nothing.
 */
async function submitRSVP(response) {
  void response;
  return { stored: false };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "";

  const selectedAttendance = form.querySelector('input[name="attendance"]:checked');
  const attending = selectedAttendance?.value === "accept";
  if (!validateForm(attending)) {
    formStatus.textContent = "Please review the highlighted fields and try again.";
    const firstInvalid = form.querySelector("[aria-invalid='true']");
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const response = {
    firstName: form.elements.firstName.value.trim(),
    lastName: form.elements.lastName.value.trim(),
    email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.trim(),
    attendance: selectedAttendance.value,
    attendeeCount: attending ? Number(attendeeCount.value) : 0,
    guests: [...additionalGuests.querySelectorAll(".guest-fields")].map((guest) => ({
      firstName: guest.querySelector('input[name$="FirstName"]').value.trim(),
      lastName: guest.querySelector('input[name$="LastName"]').value.trim()
    })),
    dietary: attending ? dietaryChoices.filter((choice) => choice.checked).map((choice) => choice.value) : [],
    dietaryDetails: attending ? dietaryMore.value.trim() : "",
    alcohol: attending ? form.querySelector('input[name="alcohol"]:checked').value : "",
    message: form.elements.message.value.trim()
  };

  await submitRSVP(response);
  const accepted = response.attendance === "accept";
  document.querySelector("#confirmation-title").textContent = accepted
    ? "Your place at the feast is reserved."
    : "Thank you for letting us know.";
  document.querySelector("#confirmation-message").textContent = accepted
    ? "We cannot wait to celebrate with you."
    : "You will be missed, and we appreciate you celebrating with us from afar.";
  form.hidden = true;
  document.querySelector(".form-note").hidden = true;
  confirmation.hidden = false;
  confirmation.focus();
});

// Clear a field's inline error as the guest corrects their response.
form.addEventListener("input", (event) => {
  if (event.target.id) clearError(event.target.id);
  formStatus.textContent = "";
});
