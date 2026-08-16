const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const sessions = [
  { id: "morning", name: "Morning Session", time: "6:00 AM - 9:00 AM", capacity: 50 },
  { id: "afternoon", name: "Afternoon Session", time: "2:00 PM - 5:00 PM", capacity: 50 },
  { id: "evening", name: "Evening Session", time: "5:00 PM - 9:00 PM", capacity: 50 }
];

let bookings = [];
let nextId = 1001;

function getDates() {
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function availableSessions(date) {
  return sessions.map(session => {
    const used = bookings
      .filter(b => b.date === date && b.sessionId === session.id && b.status === "CONFIRMED")
      .reduce((total, b) => total + b.visitors, 0);

    return {
      ...session,
      available: session.capacity - used
    };
  });
}

function validate(data) {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Enter a valid visitor name.");
  }

  if (!/^\d{10}$/.test(String(data.contact || ""))) {
    errors.push("Enter a valid 10-digit mobile number.");
  }

  if (!getDates().includes(data.date)) {
    errors.push("Select a valid date.");
  }

  if (!sessions.some(s => s.id === data.sessionId)) {
    errors.push("Select a valid session.");
  }

  if (!Number.isInteger(Number(data.visitors)) || Number(data.visitors) < 1 || Number(data.visitors) > 10) {
    errors.push("Visitors must be between 1 and 10.");
  }

  if (data.date && data.sessionId) {
    const session = sessions.find(s => s.id === data.sessionId);
    const used = bookings
      .filter(b => b.date === data.date && b.sessionId === data.sessionId && b.status === "CONFIRMED")
      .reduce((total, b) => total + b.visitors, 0);

    if (used + Number(data.visitors) > session.capacity) {
      errors.push("Not enough seats available for this session.");
    }
  }

  return errors;
}

app.get("/api/event", (req, res) => {
  res.json({
    name: "Sri Krishna Temple",
    location: "Mangaluru, Karnataka",
    timings: "6:00 AM - 9:00 PM",
    description: "A simple online system for planning and managing temple visits.",
    dates: getDates()
  });
});

app.get("/api/sessions", (req, res) => {
  if (!getDates().includes(req.query.date)) {
    return res.status(400).json({ message: "Invalid date." });
  }
  res.json(availableSessions(req.query.date));
});

app.get("/api/bookings", (req, res) => {
  const search = String(req.query.search || "").toLowerCase();

  const result = bookings.filter(b =>
    b.id.toString().includes(search) ||
    b.name.toLowerCase().includes(search) ||
    b.contact.includes(search)
  );

  res.json(result);
});

app.get("/api/bookings/:id", (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  res.json(booking);
});

app.post("/api/bookings", (req, res) => {
  const errors = validate(req.body);

  if (errors.length) {
    return res.status(400).json({ message: errors.join(" ") });
  }

  const session = sessions.find(s => s.id === req.body.sessionId);

  const booking = {
    id: String(nextId++),
    name: req.body.name.trim(),
    contact: req.body.contact,
    visitors: Number(req.body.visitors),
    date: req.body.date,
    sessionId: session.id,
    session: session.name,
    time: session.time,
    status: "CONFIRMED"
  };

  bookings.push(booking);
  res.status(201).json({ message: "Booking created successfully.", booking });
});

app.put("/api/bookings/:id", (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  if (booking.status === "CANCELLED") {
    return res.status(400).json({ message: "Cancelled bookings cannot be edited." });
  }

  const errors = validate(req.body);

  if (errors.length) {
    return res.status(400).json({ message: errors.join(" ") });
  }

  const session = sessions.find(s => s.id === req.body.sessionId);

  booking.name = req.body.name.trim();
  booking.contact = req.body.contact;
  booking.visitors = Number(req.body.visitors);
  booking.date = req.body.date;
  booking.sessionId = session.id;
  booking.session = session.name;
  booking.time = session.time;

  res.json({ message: "Booking updated successfully.", booking });
});

app.patch("/api/bookings/:id/cancel", (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  booking.status = "CANCELLED";
  res.json({ message: "Booking cancelled successfully.", booking });
});

app.delete("/api/bookings/:id", (req, res) => {
  const index = bookings.findIndex(b => b.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Booking not found." });
  }

  bookings.splice(index, 1);
  res.json({ message: "Booking deleted successfully." });
});

app.use((req, res) => {
  if (req.method === "GET") {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  res.status(404).json({ message: "Route not found." });
});

app.listen(PORT, () => {
  console.log(`TemplePass running at http://localhost:${PORT}`);
});
