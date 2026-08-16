# CareOS

Originally called Pill Pilot, CareOS is a caregiver's caregiver that manages and optimizes complex medication schedules for people under their care.
Devpost: [CareOS](https://devpost.com/software/pill-pilot)

## Setup

### Prerequisites

- Node.js and npm
- Python 3.x
- A Supabase project

### 1. Clone the repository

```bash
git clone <repository-url>
cd CareOS
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

**Windows:**

```bash
.venv\Scripts\activate
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

The backend dependencies include FastAPI, Uvicorn, OR-Tools, Supabase's Python client, Pydantic, and `python-dotenv`.

Create a `.env` file based on `backend/.env.example`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Do not expose or commit the Supabase service-role key.** It is intended only for the backend environment.

Start the backend using the Uvicorn command appropriate to your `main.py` entrypoint.

### 3. Set up the frontend

```bash
cd ../CareOS-web
npm install
```

Create `.env.local` and configure:

```env
NEXT_PUBLIC_API_URL=<your-backend-url>
```

The frontend uses this variable when communicating with the scheduling API.

Start the development server:

```bash
npm run dev
```

The Next.js application will then be available at the local development address.

### 4. Supabase

CareOS uses Supabase PostgreSQL to persist people, medications, medication rules, and doses. The backend connects using the Supabase service-role key, while the frontend uses Supabase's client for authenticated user interactions.

## Architecture

```text
                    ┌───────────────────┐
                    │      CareOS       │
                    │    Web Frontend   │
                    │     Next.js       │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │    Scheduling     │
                    │      Engine       │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │     Supabase      │
                    │    PostgreSQL     │
                    └───────────────────┘
```

The CareOS frontend provides the caregiver-facing interface for managing people, medications, schedules, and dose status. The scheduling engine processes the caregiver-defined scheduling requirements and generates or updates the medication schedule. Supabase PostgreSQL stores the application's persistent data.

# Technical Writeup (Shorter version of Devpost description)

## Problem

Medication management becomes increasingly difficult when a caregiver is responsible for multiple people and medications. Different medications may have different preferred times, time windows, food requirements, and spacing rules, while real-world events such as delayed or missed doses can cause the original schedule to change.

CareOS addresses the scheduling problem behind medication reminders. Instead of requiring caregivers to manually determine when every medication should be taken, CareOS uses the scheduling requirements provided by the caregiver to generate and maintain a schedule.

## Solution

CareOS allows caregivers to manage multiple people, their medications, and the scheduling rules associated with those medications.

The application generates a daily schedule based on those requirements and displays the resulting doses through the caregiver-facing interface. When a caregiver records a dose as taken or missed, CareOS can use that new information when recalculating the remaining schedule.

The core workflow is:

**Define → Schedule → Take/Miss → Record → Recalculate**

For example, if Medication A is scheduled for 8:00 AM and Medication B must be at least two hours apart, CareOS can initially schedule B for 10:00 AM. If A is actually taken at 8:17 AM, the schedule can account for that actual event when determining the timing of B.

## Technology

CareOS was built using:

- **Next.js / React** for the web application
- **Python** for the scheduling backend
- **FastAPI** for communication between the application and scheduling logic
- **Supabase / PostgreSQL** for persistent application data and authentication
- **OR-Tools** for the scheduling and constraint-solving logic

We designed the product requirements, scheduling rules, data model, and visual system ourselves, then used AI coding tools to accelerate implementation during the 48-hour hackathon.

## Technical Approach

CareOS separates the caregiver-facing interface from the scheduling logic and persistent data.

The application stores information about people, medications, medication rules, and individual doses. When a schedule needs to be generated or recalculated, the relevant information is passed to the scheduling system, which attempts to produce a schedule satisfying the caregiver-defined requirements.

The system also distinguishes between a medication's general scheduling rules and individual dose events. This allows an actual event, such as a dose being taken later than scheduled, to influence future scheduling without changing the underlying medication rules.

If the scheduling requirements cannot all be satisfied, CareOS reports the conflict rather than silently changing the caregiver's requirements.

## Key Features

- Multi-person medication management
- Caregiver-defined scheduling rules
- Automated schedule generation
- Scheduling conflict detection
- Taken and missed dose tracking
- Dynamic schedule recalculation
- Support for medication timing, spacing, ordering, and meal-related requirements
- Caregiver-focused daily schedule

## Safety

CareOS is a scheduling tool, not a medical decision-maker.

The application does not determine medication dosages, diagnose conditions, determine medication compatibility, or provide medical recommendations. Scheduling requirements and medication information are provided by the caregiver.

CareOS would require extensive validation and appropriate clinical review before being used for real-world medication management.
