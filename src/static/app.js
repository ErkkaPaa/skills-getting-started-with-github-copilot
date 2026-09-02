document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participants = details.participants || [];
        const participantsMarkup = participants.length
          ? `<ul class="participants-list">${participants
              .map(
                (participant) => `
                  <li>
                    <span>${participant}</span>
                    <button class="remove-participant" type="button" data-email="${participant}" aria-label="Remove ${participant}">
                      <span aria-hidden="true">&#128465;</span>
                    </button>
                  </li>`
              )
              .join("")}</ul>`
          : '<p class="no-participants">No students signed up yet.</p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-collapsible">
            <button class="participants-toggle" type="button" aria-expanded="false">
              <span>Participants</span>
              <span class="toggle-icon">+</span>
            </button>
            <div class="participants-content" hidden>
              ${participantsMarkup}
            </div>
          </div>
        `;

        const toggleButton = activityCard.querySelector(".participants-toggle");
        const participantsContent = activityCard.querySelector(".participants-content");
        const toggleIcon = activityCard.querySelector(".toggle-icon");
        const removeButtons = activityCard.querySelectorAll(".remove-participant");

        toggleButton.addEventListener("click", () => {
          const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
          toggleButton.setAttribute("aria-expanded", String(!isExpanded));
          participantsContent.hidden = isExpanded;
          toggleIcon.textContent = isExpanded ? "+" : "−";
        });

        removeButtons.forEach((removeButton) => {
          removeButton.addEventListener("click", async () => {
            const email = removeButton.dataset.email;
            removeButton.disabled = true;

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Unable to unregister participant");
              }

              await fetchActivities();
            } catch (error) {
              removeButton.disabled = false;
              console.error("Error unregistering participant:", error);
            }
          });
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
