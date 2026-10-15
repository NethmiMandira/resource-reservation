# Resource Reservation Management System

A web application that lets an organization manage its shared resources (meeting rooms, vehicles, equipment) and book them without scheduling conflicts. Built for the PrimeWave Lab software engineering internship technical assessment.

- **Stack:** Next.js 16 (App Router), TypeScript, PostgreSQL, Prisma 6, Zod, Tailwind CSS 4, Vitest

## The problem

Reservations were handled through informal communication and manual records, which caused overlapping bookings, scheduling confusion and uncertainty about what is available. This application gives the organization one place to:

- keep an organized list of resources, grouped into categories
- book a resource for a time slot, with **double bookings made impossible**
- see at a glance what is free right now and what is booked on any day
- cancel reservations without losing the history

## Features

- **Dashboard:** resources that are free right now, today's schedule, the next 14 days, and the signed-in user's upcoming reservations
- **Resources:** card list filtered by category and status, resource details, create and edit (admin only)
- **Availability calendar:** a 24-hour timeline per resource and day showing free and booked time. Move with **Previous day**, **Today** and **Next day**, or jump to any date with the date picker
- **Booking form:** pick a resource, title, date and start/end time. The time you pick is previewed on the availability calendar (green if free, red if it overlaps). A rejected booking explains the conflict and says who holds the slot. Reservations are always made for the user who is currently acting
- **Reservations list:** shows upcoming reservations by default, with filters for upcoming/past/all, resource, booked by and status. Each row has a status badge (confirmed, cancelled or ended), a **View** link and, where allowed, a **Cancel** button
- **Reservation details:** resource and category, who booked it, start and end time, when it was booked, and cancel with a confirmation dialog
- **Cancelling:** the **Cancel** button only appears for reservations that are confirmed, have not ended yet, and belong to the acting user (admins see it on every such reservation)
- **Categories:** list, create, edit and delete (admin only)
- **Roles:** members manage their own reservations, admins manage resources, categories and can cancel any reservation
- **Users:** read-only list of users and roles (admin only)

## Getting started

### Prerequisites

- Node.js 20 or newer (developed on Node 22)
- PostgreSQL 16 or newer, running locally. The `btree_gist` extension must be available (it ships with the standard PostgreSQL installers)

### 1. Install dependencies

```bash
git clone https://github.com/<your-username>/resource-reservation.git
cd resource-reservation
npm install
```

### 2. Create the database

Using `psql` (use the superuser you set up when installing PostgreSQL):

```sql
CREATE DATABASE reservation;
```

### 3. Configure the environment

Copy the example file and put your own PostgreSQL password in it:

```bash
# macOS / Linux
cp .env.example .env

# Windows (Command Prompt / PowerShell)
copy .env.example .env
```

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/reservation?schema=public"
```

If your password contains special characters such as `@`, `#`, `/` or `:`, percent-encode them in the URL (`@` becomes `%40`, and so on).

### 4. Create the tables and load demo data

```bash
npx prisma migrate dev
npx prisma db seed
```

`migrate dev` creates the tables **and** the database-level overlap rule (see [Design decisions](#design-decisions)).

> `prisma db seed` empties the tables before inserting, so only run it against a development database.

### 5. Start the app

```bash
npm run dev
```

Open <http://localhost:3000>.

### Demo data

There is no login. Use the **Acting as** menu in the top right to choose who you are:

| User | Role |
| --- | --- |
| Sunil Perera | Admin |
| Nimal Silva | Member |
| Kamala Fernando | Member |

The seed also creates 3 categories (Meeting Rooms, Vehicles, Equipment), 5 resources (one marked unavailable) and a few reservations on the next two days, so the dashboard and calendar are not empty. Reservation dates are relative to the day you run the seed (the bookings are placed on "tomorrow"); run `npx prisma db seed` again if they have drifted into the past.

### A quick tour

1. Switch to **Kamala**, open **Resources**, choose **Board Room A**, and click **Next day →** to see tomorrow (or pick a date with the date picker). Tomorrow has two bookings, 10:00 to 11:00 and 11:00 to 12:00.
2. Click **Book this resource** (the date is carried over), enter a title, set the time to 10:30 to 11:30 and book. The calendar preview turns red and the request is rejected with a message saying who holds the slot (HTTP 409).
3. Change the time to 12:00 to 13:00, which starts exactly when the last booking ends. Back-to-back bookings are allowed, so this succeeds and you land on the Reservations list with a confirmation message.
4. Cancel that reservation from the Reservations page (or its detail page) and confirm in the dialog, then book 12:00 to 13:00 again. Cancelling frees the slot.
5. Switch to **Nimal** and notice there is no cancel button on Kamala's reservations. Switch to **Sunil** (admin) to add resources and categories, or to cancel any reservation.

## Tests

```bash
npm test
```

11 integration tests run against the real PostgreSQL database (mocking the database would not exercise the overlap constraint). They cover overlapping and nested bookings, back-to-back bookings, bookings on different or inactive resources, cancelling, re-booking a cancelled slot, permissions and availability. They create their own data with a random suffix and remove it afterwards, so the demo data is untouched.

There is also an end-to-end API check that talks to a running server. Start `npm run dev` first, then:

```bash
node scripts/api-smoke-test.mjs
```

It walks through 401, 409, 201, 403 and 400 responses and prints a pass or fail line for each.

## Design decisions

**Overlaps are prevented by the database, not just by application code.** A check-then-insert in code has a race condition: two people booking the same slot at the same moment can both pass the check. The `reservations` table has a PostgreSQL exclusion constraint instead:

```sql
ALTER TABLE reservations ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  ) WHERE (status = 'confirmed');
```

- Time ranges are half-open (`[start, end)`), so a booking that ends at 11:00 and one that starts at 11:00 do not conflict.
- The `WHERE status = 'confirmed'` clause means cancelled reservations do not block the slot.
- A `CHECK (end_time > start_time)` constraint rejects invalid ranges.
- The service catches the constraint violation and turns it into a friendly 409 that names the existing booking.

**Input is validated before it reaches the database.** Zod rejects a booking (400) when the title is empty or longer than 120 characters, the end time is not after the start time, or the start time is in the past. Invalid filter values on the Reservations page are ignored instead of breaking the page, and malformed ids show a 404 page.

**Cancelling keeps history.** A cancelled reservation keeps its row and gets `status = 'cancelled'`. A resource that already has reservations is deactivated instead of deleted.

**Layered architecture.** Each layer has one job:

| Layer | Location | Responsibility |
| --- | --- | --- |
| UI | `src/app`, `src/components` | Pages and components |
| API | `src/app/api` | Validate input (Zod), identify the user, map errors to HTTP status codes |
| Services | `src/services` | Business rules |
| Data | `prisma/`, `src/lib/prisma.ts` | Schema, migrations, database access |

Services throw meaningful errors (`ConflictError`, `NotFoundError`, `ForbiddenError`) and one function (`handleError`) maps them to 409, 404, 403, 400, 401 and 500, so route handlers stay short.

**Permissions are enforced on the server.** The UI hides buttons a user cannot use, but the API checks the role as well, so calling the API directly returns 403. A reservation can only be cancelled by its owner or an admin.

**Time zones.** Times are stored as `timestamptz` and shown in Sri Lanka time (`Asia/Colombo`, UTC+05:30, no daylight saving), so the same moment is displayed identically wherever the server runs. The date and time a user enters in the booking form are interpreted as Sri Lanka time, and the daily availability window uses the same fixed offset.

**Rendering.** Pages depend on who is acting and on the current time, so they are rendered per request. Next.js Cache Components are not enabled.

## Data model

```mermaid
erDiagram
  USERS ||--o{ RESERVATIONS : makes
  RESOURCE_CATEGORIES ||--o{ RESOURCES : groups
  RESOURCES ||--o{ RESERVATIONS : "is booked in"
  USERS {
    uuid id PK
    string name
    string email UK
    enum role
    timestamptz created_at
  }
  RESOURCE_CATEGORIES {
    uuid id PK
    string name UK
    string description
  }
  RESOURCES {
    uuid id PK
    uuid category_id FK
    string name
    string location
    int capacity
    boolean is_active
  }
  RESERVATIONS {
    uuid id PK
    uuid resource_id FK
    uuid user_id FK
    string title
    timestamptz start_time
    timestamptz end_time
    enum status
    timestamptz created_at
  }
```

`role` is `admin | member` and `status` is `confirmed | cancelled`, both PostgreSQL enums. The full diagram is linked at the top of this file.

## API overview

Responses use `{ "data": ... }` on success and `{ "error": { "code", "message", "details" } }` on failure.

| Method and path | Who | Description |
| --- | --- | --- |
| `GET /api/users` | anyone | List users |
| `GET` / `POST /api/users/current` | anyone | Read or set the acting user (`{ "userId" }`) |
| `GET /api/categories` | anyone | List categories with resource counts |
| `POST /api/categories` | admin | Create a category |
| `PATCH /api/categories/:id` | admin | Update a category |
| `DELETE /api/categories/:id` | admin | Delete a category |
| `GET /api/resources?categoryId=&active=` | anyone | List resources |
| `POST /api/resources` | admin | Create a resource |
| `GET /api/resources/:id` | anyone | Resource details |
| `PATCH /api/resources/:id` | admin | Update a resource |
| `DELETE /api/resources/:id` | admin | Delete, or deactivate if it has reservations |
| `GET /api/resources/:id/availability?date=YYYY-MM-DD` | anyone | Confirmed bookings for that day |
| `GET /api/reservations?resourceId=&userId=&status=&from=&to=` | anyone | List reservations, ordered by start time. `from` and `to` return reservations that overlap that window |
| `POST /api/reservations` | acting user | Create `{ resourceId, title, startTime, endTime }` for the acting user |
| `GET /api/reservations/:id` | anyone | Reservation details |
| `PATCH /api/reservations/:id` | owner or admin | Cancel with `{ "status": "CANCELLED" }` |

Status codes: `400` invalid input, `401` no user selected, `403` not allowed, `404` not found, `409` conflict (overlap, inactive resource, already cancelled).

## Project structure

```
prisma/
  schema.prisma              data model
  migrations/                SQL migrations, including the overlap constraint
  seed.ts                    demo data
src/
  app/                       pages and API routes (App Router)
    page.tsx                 dashboard
    layout.tsx, error.tsx, not-found.tsx, globals.css
    api/
      categories/            route.ts, [id]/route.ts
      reservations/          route.ts, [id]/route.ts
      resources/             route.ts, [id]/route.ts, [id]/availability/route.ts
      users/                 route.ts, current/route.ts
    categories/              list page, [id]/edit
    reservations/            list page, new, [id] details
    resources/               list page, new, [id] details with availability calendar, [id]/edit
    users/                   users list (admin)
  components/
    categories/              CategoryForm, DeleteCategoryButton
    layout/                  Navbar, NavLinks, UserSwitcher
    reservations/            AvailabilityCalendar, CancelButton, ReservationFilters,
                             ReservationForm, ReservationTable, StatusBadge
    resources/               DeleteResourceButton, ResourceCard, ResourceFilters, ResourceForm
    ui/                      Badge, Button, Input, Modal, Select, Table, Toast
  lib/                       api-response, current-user, dates, errors, permissions, prisma, utils
  services/                  category, reservation, resource and user services (business logic)
  validators/                Zod schemas for categories, reservations and resources
tests/                       integration tests (Vitest)
scripts/                     API smoke test
```

## Assumptions and trade-offs

- **No real authentication.** The assessment does not ask for it, so a user switcher stands in. The acting user is kept in a plain cookie, which means anyone can pretend to be anyone. This is fine for a demo and would be replaced by real authentication (for example Auth.js) in production. Only `getCurrentUser()` would need to change.
- **Bookings are always for the acting user.** Admins cannot book on behalf of someone else; they can cancel any reservation. To book as another person, switch user with the **Acting as** menu.
- **Reservations are within a single day in the UI.** The booking form takes one date with a start and end time. The API and the database accept any range.
- **Rescheduling is not implemented.** Cancel and book again; history is kept. The overlap constraint already protects updates, so adding an edit later needs no new conflict logic.
- **No pagination.** Lists are small for this scope.