# CareOS

Originally called Pill Pilot, CareOS is a caregiver's caregiver that manages and optimizes complex medication schedules for people under their care.

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

# Technical Writeup (Shorter version of below description)

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



# Description (from Devpost)

## Inspiration

Medication management can become surprisingly complicated when a caregiver is responsible for multiple people and medications. Different medications can have different preferred times, time windows, food requirements, and spacing rules, and real life rarely follows a perfect schedule.

Among the sea of options in benefiting the field of medical care, we initially considered building another medication reminder. But then, we realized that reminders only work when someone has already figured out the schedule. The harder problem is **creating and adapting that schedule in the first place**.

That became the idea behind CareOS: a tool designed not just to remind caregivers what to do, but to help determine **when everything should happen**.

## What it does

**CareOS is a dynamic medication scheduling tool for caregivers.** A caregiver enters the people they manage, their medications, and the scheduling rules that need to be followed. CareOS then generates a schedule that satisfies those rules while staying as close as possible to the caregiver's preferred times.

For example, a caregiver might specify:

* Medication A: around 8:00 AM
* Medication B: around 9:00 AM
* A and B: at least 2 hours apart
* B: must be taken with food

CareOS could resolve this into:

**8:00 AM: Medication A**
**10:00 AM: Medication B**

More importantly, the schedule isn't static. If Medication A is actually taken at **8:17 AM**, CareOS can use that real timestamp when recalculating the schedule, moving Medication B to **10:17 AM** if the spacing rule requires it.

If the caregiver misses or delays a dose, the remaining schedule can be recalculated accordingly.

This creates a core loop of:

**Define → Schedule → Take/Miss → Record → Recalculate**

CareOS is a scheduling tool, not a medical decision-maker. All medication rules and requirements are provided by the caregiver; CareOS does not determine dosages, medication compatibility, or medical recommendations.

## How we built it

We built CareOS using **Next.js and Node.js**, with **PostgreSQL through supabase.js and Supabase’s data API** for persistent data storage and authentication.

The most important part of the application is the scheduling engine. We envisioned the data model in a way that medications represent their scheduling rules, individual doses represent specific occurrences/instances, and schedules represent the arrangement of those doses.

The scheduling engine processes caregiver-defined constraints such as preferred times, time windows, meal requirements, medication ordering, and minimum spacing. When doses are taken, delayed, or missed, the system can use the new state to recalculate affected future doses.

We designed the product requirements and visual system ourselves, then used AI coding tools to accelerate implementation during the 48-hour hackathon.

## Challenges we ran into

Our biggest challenge was determining what problem CareOS should actually solve.

Our initial concept was much closer to a traditional medication reminder. As we developed the idea, we realized that simply reminding someone at a predetermined time didn't address the more interesting problem: **helping caregivers construct and maintain a schedule across multiple constraints.**

Turning that idea into a concrete scheduling system was challenging because we had to define which rules the engine should understand, how those rules should interact, and what should happen when they conflict.

On the implementation side, Supabase authentication was also a major learning curve for us, as we had very little previous experience implementing authentication and persistent user data.

Despite these challenges, we were able to turn the concept into a functional product within 48 hours, particularly as this was only our second hackathon.

## Accomplishments we're proud of

We're most proud of turning a relatively complex scheduling problem into a working product under a 48-hour deadline.

In particular, we were able to implement:

* Multi-person medication management
* Caregiver-defined scheduling constraints
* Automated schedule generation
* Conflict detection and resolution
* Taken and missed dose tracking
* Dynamic rescheduling based on actual dose times
* A focused caregiver-oriented interface

We're also proud of the product direction itself. Instead of building another static reminder system, we built around the idea that **the schedule should adapt to reality**.

## What we learned

This hackathon taught us a lot about product design and, more importantly, how much product design happens before writing code.

We learned that identifying a meaningful problem is only the beginning. We had to repeatedly narrow our concept, understand what caregivers would actually need, determine which features were essential, and make difficult scope decisions to keep the product achievable within 48 hours.

Technically, we also gained experience with authentication, persistent data, database-backed applications, and designing logic that has to handle interacting constraints rather than a simple linear workflow.

## What's next for CareOS

The next step for CareOS would be validating the concept with real caregivers and learning which scheduling problems are most common in practice.

From there, we would like to expand the scheduling engine, improve explanations when scheduling conflicts occur, add notifications, and eventually support more advanced caregiver workflows.

We would also want extensive safety testing and appropriate clinical review before the application were ever used as part of real-world medication management.

Our long-term goal is to make medication management less of a scheduling burden for caregivers by turning a complicated collection of rules into a plan that is easier to understand, follow, and adapt.
