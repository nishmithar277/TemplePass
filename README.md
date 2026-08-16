# TemplePass

Simple Temple/Event Crowd Booking System for the Full Stack Development Capstone Assessment.

## Features

- Temple information
- Available dates
- Session selection
- Visitor booking
- Search bookings
- View booking details
- Edit booking
- Cancel booking
- Delete booking
- Input validation
- Success and error messages
- Responsive design
- REST API

## Technology

Frontend:
- HTML
- CSS
- JavaScript
- DOM
- Fetch API

Backend:
- Node.js
- Express.js
- REST API
- JSON
- In-memory array

## Run

Open the project folder in VS Code.

Open Terminal and run:

```bash
npm install
npm start
```

Then open:

http://localhost:3000

## API

GET /api/event
GET /api/sessions?date=YYYY-MM-DD
GET /api/bookings
GET /api/bookings/:id
POST /api/bookings
PUT /api/bookings/:id
PATCH /api/bookings/:id/cancel
DELETE /api/bookings/:id

## Important

No database is required for this assessment. Bookings are stored temporarily in memory, so they reset when the server restarts.

## Submission

Add the project to GitHub and include screenshots of the working website and API testing.
