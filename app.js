const state = {
  dates: [],
  sessions: [],
  selectedSession: ""
};

const $ = id => document.getElementById(id);

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

function message(text) {
  const box = $("message");
  box.textContent = text;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 3000);
}

function formatDate(date) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

async function loadEvent() {
  const data = await api("/api/event");

  $("eventName").textContent = data.name;
  $("eventDescription").textContent = data.description;
  $("location").textContent = data.location;
  $("timings").textContent = data.timings;

  state.dates = data.dates;

  $("date").innerHTML = state.dates
    .map(d => `<option value="${d}">${formatDate(d)}</option>`)
    .join("");

  loadSessions();
}

async function loadSessions() {
  const date = $("date").value;
  const data = await api(`/api/sessions?date=${date}`);

  state.sessions = data;

  if (!state.sessions.some(s => s.id === state.selectedSession && s.available > 0)) {
    state.selectedSession = "";
  }

  $("sessions").innerHTML = state.sessions.map(session => `
    <button
      type="button"
      class="session ${state.selectedSession === session.id ? "selected" : ""}"
      data-id="${session.id}"
      ${session.available <= 0 ? "disabled" : ""}>
      <strong>${session.name}</strong>
      <span>${session.time}</span>
      <span>${session.available} seats available</span>
    </button>
  `).join("");

  document.querySelectorAll(".session").forEach(button => {
    button.addEventListener("click", () => {
      state.selectedSession = button.dataset.id;
      loadSessions();
      updateSummary();
    });
  });

  updateSummary();
}

function updateSummary() {
  const session = state.sessions.find(s => s.id === state.selectedSession);

  $("summaryDate").textContent = $("date").value
    ? formatDate($("date").value)
    : "Not selected";

  $("summarySession").textContent = session
    ? session.name
    : "Not selected";

  $("summaryVisitors").textContent = $("visitors").value;
}

function formData() {
  return {
    name: $("name").value.trim(),
    contact: $("contact").value.trim(),
    date: $("date").value,
    visitors: Number($("visitors").value),
    sessionId: state.selectedSession
  };
}

function validateForm() {
  const data = formData();

  if (data.name.length < 2) {
    message("Please enter a valid name.");
    return false;
  }

  if (!/^\d{10}$/.test(data.contact)) {
    message("Please enter a valid 10-digit mobile number.");
    return false;
  }

  if (!state.selectedSession) {
    message("Please select a session.");
    return false;
  }

  if (data.visitors < 1 || data.visitors > 10) {
    message("Visitors must be between 1 and 10.");
    return false;
  }

  return true;
}

$("bookingForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!validateForm()) return;

  const id = $("editId").value;
  const method = id ? "PUT" : "POST";
  const url = id ? `/api/bookings/${id}` : "/api/bookings";

  try {
    const data = await api(url, {
      method,
      body: JSON.stringify(formData())
    });

    message(data.message);
    resetForm();
    loadBookings();
    loadSessions();
  } catch (error) {
    message(error.message);
  }
});

$("date").addEventListener("change", () => {
  state.selectedSession = "";
  loadSessions();
});

$("visitors").addEventListener("input", updateSummary);

$("cancelEdit").addEventListener("click", resetForm);

$("searchButton").addEventListener("click", loadBookings);

$("search").addEventListener("keydown", event => {
  if (event.key === "Enter") loadBookings();
});

function resetForm() {
  $("bookingForm").reset();
  $("editId").value = "";
  $("visitors").value = 1;
  $("submitButton").textContent = "Confirm Booking";
  $("cancelEdit").classList.add("hidden");
  state.selectedSession = "";
  loadSessions();
}

async function loadBookings() {
  const search = encodeURIComponent($("search").value.trim());
  const bookings = await api(`/api/bookings?search=${search}`);

  if (!bookings.length) {
    $("bookingList").innerHTML = "<p>No bookings found.</p>";
    return;
  }

  $("bookingList").innerHTML = bookings.map(booking => `
    <div class="booking">
      <div>
        <h3>${booking.name}</h3>
        <p>Booking ID: ${booking.id}</p>
        <p>${formatDate(booking.date)} | ${booking.session} | ${booking.visitors} visitor(s)</p>
        <p>${booking.contact}</p>
      </div>

      <div class="actions">
        <span class="status ${booking.status === "CANCELLED" ? "cancelled" : ""}">
          ${booking.status}
        </span>

        <button class="button small" onclick="viewBooking('${booking.id}')">
          Details
        </button>

        ${booking.status !== "CANCELLED" ? `
          <button class="button small" onclick="editBooking('${booking.id}')">
            Edit
          </button>
          <button class="button small danger" onclick="cancelBooking('${booking.id}')">
            Cancel
          </button>
        ` : ""}

        <button class="button small light" onclick="deleteBooking('${booking.id}')">
          Delete
        </button>
      </div>
    </div>
  `).join("");
}

async function viewBooking(id) {
  const booking = await api(`/api/bookings/${id}`);

  alert(
    `Booking Details\\n\\n` +
    `ID: ${booking.id}\\n` +
    `Name: ${booking.name}\\n` +
    `Mobile: ${booking.contact}\\n` +
    `Date: ${formatDate(booking.date)}\\n` +
    `Session: ${booking.session}\\n` +
    `Visitors: ${booking.visitors}\\n` +
    `Status: ${booking.status}`
  );
}

async function editBooking(id) {
  const booking = await api(`/api/bookings/${id}`);

  $("editId").value = booking.id;
  $("name").value = booking.name;
  $("contact").value = booking.contact;
  $("date").value = booking.date;
  $("visitors").value = booking.visitors;
  state.selectedSession = booking.sessionId;

  $("submitButton").textContent = "Update Booking";
  $("cancelEdit").classList.remove("hidden");

  await loadSessions();

  location.hash = "book";
}

async function cancelBooking(id) {
  if (!confirm("Cancel this booking?")) return;

  try {
    const data = await api(`/api/bookings/${id}/cancel`, {
      method: "PATCH"
    });

    message(data.message);
    loadBookings();
    loadSessions();
  } catch (error) {
    message(error.message);
  }
}

async function deleteBooking(id) {
  if (!confirm("Delete this booking permanently?")) return;

  try {
    const data = await api(`/api/bookings/${id}`, {
      method: "DELETE"
    });

    message(data.message);
    loadBookings();
    loadSessions();
  } catch (error) {
    message(error.message);
  }
}

loadEvent();
loadBookings();
