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

      // Clear loading message and activity select to avoid duplicates
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participantsArr = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participantsArr.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants list (created with DOM methods to avoid raw-html injection)
        const participantsContainer = document.createElement("div");
        if (participantsArr.length) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          participantsArr.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;
            li.appendChild(span);

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "participant-delete";
            delBtn.title = "Remove participant";
            delBtn.innerHTML = "&times;";
            delBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );
                const resJson = await resp.json();
                if (resp.ok) {
                  messageDiv.textContent = resJson.message;
                  messageDiv.className = "success";
                  // Refresh list
                  await fetchActivities();
                } else {
                  messageDiv.textContent = resJson.detail || "Failed to remove participant";
                  messageDiv.className = "error";
                }
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
              } catch (err) {
                messageDiv.textContent = "Failed to remove participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error removing participant:", err);
              }
            });

            li.appendChild(delBtn);
            ul.appendChild(li);
          });
          participantsContainer.appendChild(ul);
        } else {
          const pEl = document.createElement("p");
          pEl.className = "no-participants";
          pEl.textContent = "No participants yet";
          participantsContainer.appendChild(pEl);
        }

        activityCard.appendChild(participantsContainer);
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
        // Refresh activities so the new participant appears immediately
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
