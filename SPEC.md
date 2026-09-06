# AI House Designer — SPEC.md



## 0. Project Overview



Build a production-quality web application that allows a user to enter their land/plot dimensions, location, family requirements, budget, architectural preferences, and optional Vastu preferences, and then generates **3 feasible house-design concepts**.



The product should not be an image-generation toy.



The core system must maintain a **structured, editable house model** containing:



* Plot geometry

* Setbacks/buildable area

* Floors

* Rooms

* Room dimensions

* Room positions

* Doors

* Windows

* Staircases

* Parking

* Balconies

* Open spaces

* Orientation

* Design metadata

* Cost estimates



AI is responsible for understanding user intent, generating design alternatives, explaining designs, and accepting natural-language modifications.



A deterministic geometry/constraint engine is responsible for ensuring that designs remain geometrically coherent.



The initial target market is **India**, but the architecture must allow additional countries/regions later.



---



# 1. Product Vision



## Core user problem



A person owns a plot of land and wants to build a house but does not know:



* What layout to choose

* How many rooms can fit

* What the house could look like

* How much it might cost

* How to compare different layouts

* What to tell an architect/engineer

* How to iterate on the design



The product provides an AI-assisted workflow:



```text

I have land

    ↓

Tell us about the land

    ↓

Tell us about your family and requirements

    ↓

Generate 3 house concepts

    ↓

Compare concepts

    ↓

Select one

    ↓

Modify using natural language

    ↓

View floor plans and 3D visualization

    ↓

See estimated cost

    ↓

Export/share design

    ↓

Optionally connect with professionals

```



---



# 2. Product Positioning



Do NOT position the product as:



> "Replace your architect."



Position it as:



> "Design your dream home with AI."



or:



> "Turn your plot into a house plan."



or:



> "See what you can build on your land before spending lakhs on professional design."



The application must clearly distinguish:



1. AI-generated conceptual designs

2. Estimated costs

3. Professional/engineering documentation

4. Legally approved construction drawings



The MVP does NOT claim that AI output is automatically suitable for construction or regulatory approval.



---



# 3. MVP Goals



The MVP must allow a user to:



1. Create an account or continue as a guest.

2. Enter plot dimensions.

3. Enter location.

4. Specify road direction/orientation.

5. Specify number of floors.

6. Specify bedrooms.

7. Specify bathrooms.

8. Specify parking.

9. Specify common rooms.

10. Specify budget.

11. Select architectural style.

12. Optionally enable Vastu preferences.

13. Enter free-form requirements.

14. Generate 3 house concepts.

15. View floor plans.

16. View room dimensions.

17. View basic 3D exterior visualization.

18. View estimated construction cost.

19. Select one concept.

20. Modify the selected concept using natural language.

21. Regenerate affected geometry.

22. Save design versions.

23. Download/share a design summary PDF.



---



# 4. Non-Goals for MVP



Do NOT implement these in the first release unless explicitly requested:



* Certified structural engineering drawings

* Automatic building-permit submission

* Automatic legal approval

* Full BIM authoring

* Construction project management

* Contractor marketplace

* Material marketplace

* Interior marketplace

* Real-time construction monitoring

* Fully accurate local construction quotations

* Structural load calculations

* Electrical engineering certification

* Plumbing engineering certification

* Automatic compliance guarantee

* Native iOS/Android applications



These can be future phases.



---



# 5. Recommended Tech Stack



Use the following unless there is a compelling technical reason to change it.



## Frontend



* Next.js

* React

* TypeScript

* Tailwind CSS

* shadcn/ui

* React Hook Form

* Zod

* TanStack Query where useful

* Zustand or equivalent lightweight state management where needed



## Backend



Python:



* FastAPI

* Pydantic

* SQLAlchemy

* Alembic



The geometry engine should be isolated from the API layer.



## Database



PostgreSQL.



Recommended:



* Supabase PostgreSQL

* Supabase Auth

* Supabase Storage



The application must not become dependent on Supabase-specific functionality in core business logic.



## AI



Implement an abstraction:



```text

AIProvider

```



with support for:



* OpenAI-compatible models

* Anthropic-compatible models

* Future providers



Do not hard-code business logic around one LLM.



## Image Generation



Implement:



```text

ImageGenerationProvider

```



The actual provider should be configurable through environment variables.



## PDF



Use a server-side PDF generator.



## Payments



Design an abstraction:



```text

PaymentProvider

```



For India, Razorpay can be the first implementation.



Stripe may be added later.



---



# 6. High-Level Architecture



```text

┌───────────────────────────────┐

│          Next.js UI           │

└───────────────┬───────────────┘

                │

                ▼

┌───────────────────────────────┐

│         FastAPI API           │

└───────────────┬───────────────┘

                │

        ┌───────┼─────────┐

        │       │         │

        ▼       ▼         ▼

   AI Service  Geometry  Cost Engine

        │       Engine      │

        │          │        │

        └──────────┼────────┘

                   ▼

             House Model

                   │

       ┌───────────┼────────────┐

       ▼           ▼            ▼

    Database    Renderer     PDF Engine

       │           │            │

       └───────────┼────────────┘

                   ▼

                 User

```



---



# 7. Core Design Principle



## AI must NOT directly own geometry.



Bad architecture:



```text

User → LLM → "generate floor plan"

```



Good architecture:



```text

User

 ↓

LLM

 ↓

Structured Design Intent

 ↓

Constraint Engine

 ↓

Geometry Generator

 ↓

Validation

 ↓

House Model

 ↓

Renderer

```



The LLM proposes.



The geometry engine constructs.



The validator verifies.



---



# 8. Units



Internally use SI units.



Recommended internal representation:



```text

millimeters

```



User-facing units:



* feet/inches

* meters



Store all geometry in millimeters.



Example:



```text

30 ft = 9144 mm

50 ft = 15240 mm

```



Never store floating-point feet as the canonical geometry representation.



Use integer millimeters wherever possible.



---



# 9. Core Domain Model



## Project



```typescript

Project {

  id: UUID

  userId: UUID | null

  name: string

  status: ProjectStatus

  createdAt: datetime

  updatedAt: datetime

}

```



## Plot



```typescript

Plot {

  id: UUID

  projectId: UUID



  widthMm: integer

  lengthMm: integer



  roadSide: RoadSide

  northDirectionDegrees: number



  locationCountry: string

  locationState: string | null

  locationCity: string | null

  postalCode: string | null



  plotShape: PlotShape

}

```



Initially support:



```text

RECTANGLE

```



Future:



```text

L_SHAPE

IRREGULAR

CUSTOM_POLYGON

```



---



# 10. Requirements Model



```typescript

HouseRequirements {

  floors: integer



  bedrooms: integer

  bathrooms: integer

  kitchens: integer



  parkingCars: integer



  livingRooms: integer

  diningRooms: integer



  pujaRoom: boolean

  homeOffice: boolean

  balcony: boolean

  terrace: boolean

  utilityRoom: boolean

  storeRoom: boolean

  laundryRoom: boolean



  vastuEnabled: boolean



  architecturalStyle: ArchitecturalStyle



  budgetMin: number | null

  budgetMax: number | null

  currency: string



  additionalRequirements: string

}

```



---



# 11. Architectural Styles



Initial enum:



```text

MODERN

CONTEMPORARY

TRADITIONAL

MINIMAL

LUXURY

INDIAN_MODERN

```



Future:



```text

COLONIAL

MEDITERRANEAN

INDUSTRIAL

JAPANDI

TROPICAL

```



---



# 12. House Model



The House Model is the central object in the system.



```typescript

HouseModel {

  id: UUID

  projectId: UUID



  version: integer



  plot: PlotGeometry



  floors: Floor[]



  totalBuiltUpAreaMm2: number

  totalOpenAreaMm2: number



  orientation: Orientation



  constraints: ConstraintResult[]



  score: DesignScore



  estimatedCost: CostEstimate



  metadata: DesignMetadata

}

```



---



# 13. Floor Model



```typescript

Floor {

  id: UUID

  floorNumber: integer



  elevationMm: integer



  rooms: Room[]

  doors: Door[]

  windows: Window[]

  stairs: Staircase[]

  balconies: Balcony[]

  openSpaces: OpenSpace[]



  builtAreaMm2: number

}

```



---



# 14. Room Model



```typescript

Room {

  id: UUID



  type: RoomType

  name: string



  xMm: integer

  yMm: integer



  widthMm: integer

  lengthMm: integer



  rotationDegrees: number



  floorNumber: integer



  minimumWidthMm: integer

  minimumAreaMm2: integer



  windows: UUID[]

  doors: UUID[]



  preferredOrientation: Direction | null



  metadata: Record<string, unknown>

}

```



Initial room types:



```text

LIVING

DINING

KITCHEN

BEDROOM

MASTER_BEDROOM

CHILDREN_BEDROOM

GUEST_BEDROOM

BATHROOM

POWDER_ROOM

PUJA

OFFICE

UTILITY

STORE

LAUNDRY

STAIRCASE

CORRIDOR

BALCONY

PARKING

TERRACE

```



---



# 15. Geometry Rules



Every generated design must satisfy:



## Plot containment



All buildable geometry must remain inside the permitted buildable polygon.



## Room containment



Every room must be inside the floor's buildable area.



## No unacceptable overlap



Rooms must not overlap unless explicitly designed to do so.



## Connectivity



Required rooms must be reachable.



## Door connectivity



A room should have at least one valid entrance unless it is intentionally an open-plan area.



## Bathroom access



Bathrooms must connect to circulation or a permitted bedroom configuration.



## Staircase connectivity



For multi-floor houses, floors must be connected.



## Parking access



Parking must connect to the road/access side.



## Minimum room dimensions



The system must maintain configurable minimum dimensions.



These values must live in configuration, not be hard-coded throughout the codebase.



Example configuration:



```yaml

room_constraints:

  bedroom:

    min_width_mm: 3000

    min_length_mm: 3300



  master_bedroom:

    min_width_mm: 3600

    min_length_mm: 4200



  bathroom:

    min_width_mm: 1500

    min_length_mm: 2100



  kitchen:

    min_width_mm: 2400

    min_length_mm: 3000

```



These are **conceptual defaults**, not claims of universal Indian building-code compliance.



---



# 16. Local Regulation Architecture



Do not hard-code building regulations into the geometry engine.



Create:



```text

RegulationProvider

```



Interface:



```python

class RegulationProvider:

    def get_rules(

        self,

        country: str,

        state: str | None,

        city: str | None,

        postal_code: str | None

    ) -> BuildingRules:

        ...

```



`BuildingRules` may contain:



```text

front_setback

rear_setback

side_setback

max_ground_coverage

max_floors

max_height

parking_rules

far_fsi

road_width_rules

```



For MVP:



If verified local rules are unavailable:



```text

status = UNKNOWN

```



Do NOT invent regulatory values.



The UI must communicate:



> Local regulatory requirements have not been independently verified for this location.



---



# 17. Design Generation Pipeline



Implement:



```text

generate_designs(requirements)

```



Pipeline:



### Step 1



Normalize user input.



### Step 2



Resolve units.



### Step 3



Calculate plot geometry.



### Step 4



Load available regulation/configuration data.



### Step 5



Calculate buildable area.



### Step 6



Create room requirements.



### Step 7



Generate candidate layouts.



### Step 8



Validate candidates.



### Step 9



Score candidates.



### Step 10



Select diverse top candidates.



### Step 11



Generate 3D visualization prompts/assets.



### Step 12



Calculate cost.



### Step 13



Return 3 design alternatives.



---



# 18. Candidate Layout Generation



Do NOT depend exclusively on an LLM.



Use a deterministic or semi-deterministic search algorithm.



Possible implementation:



```text

Generate candidate room sizes

        ↓

Generate candidate room positions

        ↓

Generate adjacency graphs

        ↓

Generate layouts

        ↓

Constraint validation

        ↓

Score

        ↓

Rank

```



Possible algorithms:



* Constraint satisfaction

* Backtracking

* Simulated annealing

* Genetic algorithms

* Mixed integer optimization

* Heuristic search



Start with heuristic placement + backtracking.



Optimize later.



---



# 19. Room Adjacency Graph



Before geometry generation, generate a logical graph.



Example:



```text

Living

 ├── Dining

 ├── Kitchen

 └── Bedroom



Dining

 └── Kitchen



Master Bedroom

 └── Master Bathroom



Bedroom 2

 └── Common Bathroom

```



This allows the geometry engine to understand relationships rather than placing rectangles randomly.



---



# 20. Design Diversity



The three designs must not be superficial variations.



They should represent different optimization strategies.



## Design 1 — Budget Optimized



Prioritize:



* compact circulation

* lower construction complexity

* efficient structural footprint

* lower estimated cost



## Design 2 — Family Comfort



Prioritize:



* larger living spaces

* better room relationships

* natural light

* comfortable circulation

* family usability



## Design 3 — Premium



Prioritize:



* larger rooms

* visual impact

* balconies

* premium spaces

* architectural features



The generated designs should have materially different layouts where possible.



---



# 21. Design Scoring



Each candidate receives a score.



Example:



```typescript

DesignScore {

  geometryScore: number

  spaceEfficiencyScore: number

  circulationScore: number

  requirementMatchScore: number

  budgetScore: number

  orientationScore: number

  vastuScore: number

  lightVentilationScore: number

  overallScore: number

}

```



Weights should be configurable.



Example:



```yaml

weights:

  requirement_match: 0.25

  space_efficiency: 0.15

  circulation: 0.15

  budget: 0.15

  orientation: 0.10

  vastu: 0.10

  light_ventilation: 0.10

```



Do not expose fake precision to users.



Internally scores may be numeric, but UI should communicate them naturally.



---



# 22. Vastu



Vastu must be treated as an **optional user preference**, not as an objective scientific requirement.



If enabled, the system may use configurable preferences such as:



```text

Entrance direction

Kitchen placement

Puja placement

Master bedroom orientation

Bedroom orientation

Bathroom preferences

```



The UI should describe these as:



> "Vastu preferences"



not:



> "Guaranteed Vastu-compliant."



If a preference conflicts with geometric feasibility, explain the conflict.



Example:



> "Your preferred kitchen direction could not be satisfied without reducing the master bedroom below the selected minimum size."



---



# 23. AI Design Intent Contract



The LLM should output structured JSON.



Example:



```json

{

  "plot": {

    "width_mm": 9144,

    "length_mm": 15240

  },

  "floors": 2,

  "requirements": {

    "bedrooms": 3,

    "bathrooms": 3,

    "parking_cars": 1

  },

  "preferences": {

    "style": "modern",

    "vastu": true

  },

  "priorities": [

    "large_living_room",

    "natural_light",

    "family_comfort"

  ]

}

```



The backend must validate this using Pydantic/Zod.



Never trust raw model output.



---



# 24. AI Modification Contract



Users can modify designs through natural language.



Example:



> "Make the master bedroom larger."



The LLM must NOT directly return arbitrary geometry.



Instead return an operation:



```json

{

  "operation": "RESIZE_ROOM",

  "target": {

    "room_id": "master-bedroom-1"

  },

  "parameters": {

    "width_change_mm": 300,

    "length_change_mm": 300

  },

  "reason": "User requested a larger master bedroom."

}

```



Other operations:



```text

MOVE_ROOM

RESIZE_ROOM

ADD_ROOM

REMOVE_ROOM

CHANGE_ROOM_TYPE

ADD_BALCONY

REMOVE_BALCONY

ADD_PARKING

REMOVE_PARKING

MOVE_STAIRCASE

CHANGE_STYLE

CHANGE_BUDGET

CHANGE_FLOOR_COUNT

CHANGE_ORIENTATION

```



---



# 25. Modification Pipeline



```text

User message

    ↓

LLM intent parser

    ↓

Structured operation

    ↓

Operation validator

    ↓

Geometry engine

    ↓

Constraint validation

    ↓

If valid → apply

    ↓

If invalid → propose alternative

    ↓

Create new version

```



Never mutate the previous design destructively.



Every modification creates:



```text

Design Version N+1

```



---



# 26. Example Modification



User:



> "Add a second car parking."



System:



1. Detect `ADD_PARKING`.

2. Determine required parking area.

3. Check available plot/buildable area.

4. Search for valid placement.

5. Recalculate circulation.

6. Validate.

7. Recalculate cost.

8. Create new version.



If impossible:



> "Two-car parking cannot fit without reducing the ground-floor living area or changing the staircase position. I found two alternatives."



Show alternatives.



---



# 27. AI Conversational UX



The design editor should have:



```text

┌─────────────────────────────────────┐

│ AI House Designer                   │

├─────────────────────────────────────┤

│                                     │

│        FLOOR PLAN / 3D VIEW         │

│                                     │

├─────────────────────────────────────┤

│ What would you like to change?      │

│                                     │

│ [ Make the kitchen larger... ]      │

│                              [Send] │

└─────────────────────────────────────┘

```



Suggested quick actions:



```text

Make bedrooms larger

Add parking

Reduce cost

Add balcony

Improve natural light

Move kitchen

Add puja room

Make it more modern

```



---



# 28. 3D Visualization



The application should maintain two separate concepts:



### Structured model



Used for:



* dimensions

* editing

* validation

* calculations



### Visual render



Used for:



* aesthetics

* marketing

* user experience



Never derive exact dimensions from an AI-generated image.



The render is always secondary to the structured model.



---



# 29. Floor Plan Rendering



The MVP should render a clean 2D plan directly from geometry.



Use:



* SVG

* Canvas

* or a suitable vector rendering library



Each room should display:



```text

Room name

Width

Length

```



Example:



```text

MASTER BEDROOM

14' × 16'

```



Add:



* walls

* doors

* windows

* stairs

* dimensions

* north arrow

* plot boundary



The floor plan should be deterministic and reproducible.



---



# 30. 3D MVP



Do not over-engineer the 3D engine initially.



The first version may use:



1. Basic procedural 3D model, or

2. AI-generated exterior concept render.



Future:



* WebGL

* Three.js

* procedural geometry

* interactive walkthrough



The architecture should allow a future `ThreeDRenderer` implementation.



---



# 31. Cost Engine



Create a separate service:



```text

CostEngine

```



Input:



```text

built_up_area

location

quality_level

floors

style

```



Output:



```typescript

CostEstimate {

  currency: string



  low: number

  expected: number

  high: number



  categories: CostCategory[]



  assumptions: string[]

}

```



Example categories:



```text

structure

masonry

flooring

roof

doors_windows

electrical

plumbing

painting

kitchen

sanitary

labour

miscellaneous

```



---



# 32. Cost Disclaimer



Always display:



> "This is an indicative estimate, not a construction quotation. Actual costs vary based on location, materials, specifications, labour, soil conditions, contractor pricing, and market conditions."



Never present estimates as guaranteed prices.



---



# 33. Cost Data Architecture



Use:



```text

LocationCostProfile

```



Example:



```typescript

LocationCostProfile {

  city: string

  state: string



  standardRatePerSqFt: number

  premiumRatePerSqFt: number

  luxuryRatePerSqFt: number



  effectiveFrom: date

  source: string

}

```



Do not hard-code city prices throughout the application.



Prices must be versioned.



---



# 34. Authentication



Support:



* Email/password

* Google OAuth

* Guest session



A guest can generate limited designs.



Require authentication for:



* saving projects

* downloading premium packages

* payments

* professional referrals



---



# 35. Project Dashboard



After login:



```text

My Projects



┌─────────────────────────────┐

│ Modern 3BHK — Bangalore     │

│ 30 × 50 ft                  │

│ Last edited 2 hours ago     │

│                             │

│ [Open Project]              │

└─────────────────────────────┘

```



Actions:



* Open

* Rename

* Duplicate

* Delete

* Export



---



# 36. Main Routes



Use:



```text

/

 /design

 /design/[projectId]

 /design/[projectId]/results

 /design/[projectId]/editor

 /design/[projectId]/versions

 /dashboard

 /pricing

 /login

 /signup

 /account

 /api/...

```



Future:



```text

/professionals

/contractors

/materials

```



---



# 37. Homepage



Hero:



> Design Your Dream Home with AI



Subheading:



> Enter your plot details, tell us what you need, and get 3 personalized house concepts in minutes.



CTA:



> Start Designing



Secondary:



> See How It Works



Sections:



1. Hero

2. How it works

3. Example designs

4. Features

5. Cost estimation

6. AI customization

7. Professional verification

8. FAQ

9. CTA



---



# 38. Design Wizard



Use a multi-step wizard rather than one overwhelming form.



## Step 1 — Plot



```text

Width

Length

Unit

Location

Road side

North direction

```



## Step 2 — Family



```text

Bedrooms

Bathrooms

Floors

Parking

```



## Step 3 — Rooms



```text

Living

Dining

Kitchen

Puja

Office

Utility

Balcony

Terrace

```



## Step 4 — Budget



```text

Budget

Construction quality

```



## Step 5 — Style



```text

Modern

Contemporary

Traditional

Minimal

Luxury

Indian Modern

```



## Step 6 — Preferences



```text

Vastu

Natural light

Privacy

Large rooms

Low cost

Open spaces

```



## Step 7 — Additional Requirements



Free-form text.



---



# 39. Generation Experience



Generation should feel intentional.



Display stages:



```text

Understanding your requirements...

Analyzing your plot...

Calculating available space...

Planning room relationships...

Creating layout alternatives...

Checking design constraints...

Estimating cost...

Preparing visualizations...

```



Do not fake progress percentages unless actual backend progress is available.



Use a real job state:



```text

QUEUED

PROCESSING

VALIDATING

RENDERING

COMPLETED

FAILED

```



---



# 40. Asynchronous Generation



Generation may take time.



Use a job architecture.



```text

POST /projects/{id}/generate

        ↓

GenerationJob

        ↓

Worker

        ↓

AI

        ↓

Geometry

        ↓

Validation

        ↓

Rendering

        ↓

Database

```



Frontend polls or subscribes to job status.



Do not keep a synchronous HTTP request open for expensive image generation.



---



# 41. API Endpoints



## Projects



```http

POST /api/projects

GET /api/projects

GET /api/projects/{id}

PATCH /api/projects/{id}

DELETE /api/projects/{id}

```



## Generation



```http

POST /api/projects/{id}/generate

GET /api/generation-jobs/{id}

```



## Designs



```http

GET /api/projects/{id}/designs

GET /api/designs/{id}

POST /api/designs/{id}/modify

GET /api/designs/{id}/versions

POST /api/designs/{id}/duplicate

```



## Export



```http

POST /api/designs/{id}/export/pdf

GET /api/exports/{id}

```



## Cost



```http

GET /api/designs/{id}/cost

```



---



# 42. API Security



Every endpoint must verify ownership.



Never rely on:



```text

projectId from URL

```



alone.



Check:



```text

authenticatedUser.id === project.userId

```



For guest projects, use secure session tokens.



Never expose internal database IDs unnecessarily.



---



# 43. Database Schema



Minimum tables:



```text

users

projects

plots

house_requirements

designs

design_versions

floors

rooms

doors

windows

stairs

balconies

generation_jobs

cost_estimates

cost_categories

exports

subscriptions

payments

ai_conversations

ai_operations

```



---



# 44. AI Conversation Persistence



Store:



```text

conversation_id

project_id

design_id

user_message

assistant_message

operation

created_at

```



Do not send the entire historical conversation to the LLM on every request.



Build a compact project/design context.



---



# 45. Design Versioning



Every design modification creates a new version.



Example:



```text

Design 2

 ├── Version 1 — original

 ├── Version 2 — larger kitchen

 ├── Version 3 — added balcony

 └── Version 4 — reduced budget

```



Allow:



```text

Restore version

Compare versions

Duplicate version

```



---



# 46. Undo/Redo



The editor must support:



```text

Undo

Redo

```



Implement using immutable version history rather than trying to reverse arbitrary geometry operations.



---



# 47. Payments



MVP monetization:



## Free



* 3 concepts

* basic plan

* basic visualization

* limited modifications



## Pro



Example:



```text

₹1,999 one-time

```



Includes:



* detailed plan

* more modifications

* detailed cost estimate

* PDF export

* saved versions



Prices must be configurable.



Do not hard-code pricing in UI.



---



# 48. Payment State Machine



```text

CREATED

PENDING

SUCCESS

FAILED

REFUNDED

CANCELLED

```



Never unlock paid features solely based on a frontend callback.



Verify payment server-side.



Use webhook verification.



---



# 49. Feature Entitlements



Create an entitlement system.



Example:



```typescript

Entitlement {

  userId

  feature

  limit

  used

  expiresAt

}

```



Features:



```text

DESIGN_GENERATION

AI_MODIFICATIONS

PDF_EXPORT

HIGH_RES_RENDER

COST_ESTIMATE

```



This makes pricing plans configurable.



---



# 50. PDF Export



PDF should contain:



### Cover



Project name



Plot dimensions



Date



### Page 2



Project requirements



### Page 3+



Ground-floor plan



### Page



First-floor plan



### Page



Room schedule



### Page



Cost estimate



### Page



3D visualization



### Final page



Important disclaimers.



PDF must clearly state:



> Conceptual AI-generated design. Not a substitute for site-specific architectural, structural, electrical, plumbing, or regulatory review.



---



# 51. Error Handling



Errors must be understandable.



Bad:



> `ConstraintSolverException: polygon intersection failed`



Good:



> "We couldn't fit all requested rooms within the available building area. Try reducing the number of rooms or increasing the number of floors."



Developer logs may contain technical details.



User-facing errors must not expose stack traces.



---



# 52. Impossible Requirements



The system must handle impossible inputs.



Example:



Plot:



```text

15 × 20 ft

```



Requirements:



```text

5 bedrooms

4 bathrooms

2 car parking

```



Do not hallucinate a valid design.



Return:



> "Your requirements exceed the available space."



Then provide:



### Suggested changes



* Add another floor

* Reduce bedroom count

* Reduce parking

* Increase plot/buildable area



---



# 53. Design Confidence



Every design should have internal validation status:



```text

VALID

VALID_WITH_WARNINGS

INVALID

```



Warnings might include:



```text

Local setback information unavailable

Cost estimate based on regional assumptions

Vastu preference partially satisfied

Professional review required

```



Never hide warnings.



---



# 54. Observability



Track:



```text

generation_started

generation_completed

generation_failed

design_selected

design_modified

payment_started

payment_completed

pdf_exported

```



Also track generation metrics:



```text

generation_time

candidate_count

valid_candidate_count

validation_failures

AI_latency

image_generation_latency

cost_estimation_latency

```



Do not log sensitive user information unnecessarily.



---



# 55. Analytics



Track funnel:



```text

homepage_visit

start_design

plot_completed

requirements_completed

generation_started

generation_completed

design_viewed

design_selected

modification_started

payment_started

payment_completed

exported

```



Core KPI:



```text

Design completion rate

```



Secondary:



```text

Generation success rate

Design selection rate

Modification rate

Paid conversion

Cost per generated design

Revenue per project

```



---



# 56. Privacy



User data can contain:



* property information

* location

* budget

* family requirements



Treat project data as private.



Requirements:



* authenticated access

* database row-level authorization

* signed URLs for private files

* encrypted transport

* no public project URLs by default

* deletion support

* data export support



---



# 57. AI Security



Do not trust user prompts.



The LLM must not be able to:



* execute code

* directly access the database

* directly call arbitrary APIs

* modify billing state

* bypass authorization

* modify another user's project



The LLM only produces validated structured operations.



---



# 58. Prompt Injection Protection



User free-form requirements are untrusted content.



System prompts must clearly separate:



```text

SYSTEM INSTRUCTIONS

PROJECT DATA

USER REQUIREMENTS

```



Do not allow project text to override system instructions.



---



# 59. Cost Control



AI/image generation can become the largest variable cost.



Implement:



* job queues

* caching

* retry limits

* image resolution tiers

* per-user generation limits

* usage tracking

* model abstraction

* timeouts



Do not regenerate images if the underlying geometry hasn't changed.



---



# 60. Caching



Cache:



```text

normalized requirements

regulation lookups

cost profiles

render prompts

generated assets

```



Use content hashes where appropriate.



Example:



```text

hash(plot + requirements + design_version)

```



If identical generation is requested, reuse cached output when safe.



---



# 61. Testing



Testing is mandatory because geometry bugs are dangerous.



## Unit tests



Test:



* unit conversion

* room area

* plot area

* buildable area

* room overlap

* containment

* adjacency

* cost calculation

* serialization



## Property tests



Examples:



```text

Every room must remain inside buildable area.



No two non-overlapping rooms may intersect.



Changing a room must not change the plot dimensions.



Generated designs must contain requested bedrooms.



```



## Integration tests



Test:



```text

User input

→ AI intent

→ geometry

→ validation

→ cost

→ database

```



## E2E



Test:



```text

Signup

→ create project

→ generate

→ choose design

→ modify

→ export PDF

```



---



# 62. Example Acceptance Test



Input:



```text

Plot: 30 × 50 ft

Floors: 2

Bedrooms: 3

Bathrooms: 3

Parking: 1

Budget: ₹35 lakh

Style: Modern

Vastu: enabled

```



Expected:



```text

3 design candidates

```



Each candidate must have:



```text

2 floors

3 bedrooms

3 bathrooms

1 parking

valid room geometry

cost estimate

floor plan

design metadata

```



The system must never return an unvalidated geometry object as a completed design.



---



# 63. Accessibility



The application should meet WCAG 2.2 AA as reasonably practicable.



Requirements:



* keyboard navigation

* semantic HTML

* accessible labels

* sufficient contrast

* visible focus states

* screen-reader support

* form validation messages

* reduced motion support



Do not rely exclusively on color to communicate state.



---



# 64. Responsive Design



Desktop:



```text

1440px+

```



Tablet:



```text

768–1439px

```



Mobile:



```text

<768px

```



The design editor should prioritize desktop/tablet initially, but the input wizard must work well on mobile.



---



# 65. Visual Design



Brand direction:



* modern

* trustworthy

* architectural

* premium

* approachable

* not overly futuristic



Avoid excessive:



* neon gradients

* generic AI sparkle effects

* crypto-style UI

* clutter

* dark hacker aesthetics



Use visual hierarchy inspired by modern SaaS + architecture platforms.



Primary CTA:



> Generate My House



Secondary CTA:



> Explore Designs



---



# 66. Design Results UI



Display three cards:



```text

┌──────────────────────────┐

│ Design 1                 │

│ Budget Smart             │

│                          │

│ [3D image]               │

│ [Floor plan thumbnail]   │

│                          │

│ 3 Bedrooms               │

│ 3 Bathrooms              │

│ 1 Parking                │

│                          │

│ ₹31–33 lakh              │

│                          │

│ [View Details]           │

└──────────────────────────┘

```



Design 2 can have:



> Recommended



based on scoring, but do not manipulate users deceptively.



---



# 67. Design Detail UI



Tabs:



```text

Overview

Floor Plans

3D View

Rooms

Cost

Materials

AI Editor

Versions

```



---



# 68. AI Editor UX



The AI editor must always show what changed.



Example:



> Updated master bedroom.



Then:



```text

Changes

+ Master bedroom: +2.1 sq m

- Family lounge: -1.3 sq m

Estimated cost: +₹42,000

```



Actions:



```text

Undo

Keep

Try another option

```



---



# 69. Explainability



When users ask:



> "Why did you put the kitchen here?"



The AI should answer based on actual design metadata.



Example:



> "The kitchen was placed next to the dining area to reduce circulation distance. Your Vastu preference was also considered."



Do not invent reasons after the fact.



Store design decisions where practical.



---



# 70. Professional Review CTA



After design completion:



```text

Ready to build?

```



Display:



> This AI design is a conceptual starting point. Before construction, have the design reviewed by qualified local professionals.



CTA:



> Find a Professional



This marketplace is future functionality.



For MVP, a simple placeholder is acceptable.



---



# 71. Legal/Product Disclaimer



Use clear language throughout the product.



Example:



> AI-generated house designs are conceptual and intended for planning and visualization. They are not guaranteed to satisfy local building regulations, structural requirements, site conditions, or permit requirements. Construction should proceed only after review and approval by appropriately qualified professionals and relevant authorities.



Have legal counsel review final production wording.



---



# 72. Environment Variables



Example:



```env

DATABASE_URL=

DIRECT_URL=



AUTH_SECRET=



AI_PROVIDER=

AI_API_KEY=



IMAGE_PROVIDER=

IMAGE_API_KEY=





STORAGE_BUCKET=



RAZORPAY_KEY_ID=

RAZORPAY_KEY_SECRET=

RAZORPAY_WEBHOOK_SECRET=



APP_URL=



SENTRY_DSN=



ANALYTICS_KEY=

```



Never commit secrets.



Provide:



```text

.env.example

```



---



# 73. Repository Structure



Recommended monorepo:



```text

/

├── apps/

│   ├── web/

│   └── api/

│

├── packages/

│   ├── domain/

│   ├── geometry/

│   ├── ai/

│   ├── cost-engine/

│   ├── renderer/

│   ├── pdf/

│   ├── shared-types/

│   └── config/

│

├── workers/

│   └── generation-worker/

│

├── infrastructure/

│

├── docs/

│

├── tests/

│

├── .env.example

├── docker-compose.yml

├── README.md

└── SPEC.md

```



If a monorepo introduces unnecessary complexity for the first implementation, a simpler structure is acceptable, but preserve clear module boundaries.



---



# 74. Core Interfaces



## AI Provider



```python

class AIProvider(Protocol):



    async def parse_requirements(

        self,

        user_input: str,

        context: ProjectContext

    ) -> DesignIntent:

        ...



    async def generate_design_strategy(

        self,

        requirements: HouseRequirements

    ) -> list[DesignStrategy]:

        ...



    async def parse_modification(

        self,

        message: str,

        design: HouseModel

    ) -> DesignOperation:

        ...



    async def explain_design(

        self,

        question: str,

        design: HouseModel

    ) -> str:

        ...

```



---



# 75. Geometry Engine Interface



```python

class GeometryEngine:



    def generate_candidates(

        self,

        requirements: HouseRequirements,

        rules: BuildingRules

    ) -> list[HouseModel]:

        ...



    def apply_operation(

        self,

        design: HouseModel,

        operation: DesignOperation

    ) -> HouseModel:

        ...



    def validate(

        self,

        design: HouseModel

    ) -> ValidationResult:

        ...



    def score(

        self,

        design: HouseModel,

        requirements: HouseRequirements

    ) -> DesignScore:

        ...

```



---



# 76. Cost Engine Interface



```python

class CostEngine:



    def estimate(

        self,

        design: HouseModel,

        location: Location

    ) -> CostEstimate:

        ...

```



---



# 77. Rendering Interface



```python

class FloorPlanRenderer:



    def render(

        self,

        floor: Floor

    ) -> RenderAsset:

        ...

```



```python

class ExteriorRenderer:



    async def render(

        self,

        design: HouseModel,

        style: ArchitecturalStyle

    ) -> RenderAsset:

        ...

```



---



# 78. Worker Architecture



Generation jobs should run outside the main API process.



Example:



```text

API

 ↓

PostgreSQL

 ↓

Queue

 ↓

Worker

 ↓

AI

 ↓

Geometry

 ↓

Validation

 ↓

Rendering

 ↓

Storage

 ↓

Database

```



Possible queue technologies:



* Redis + Celery

* Redis + RQ

* BullMQ if using Node worker

* managed queue



Pick one and keep the interface abstract.



---



# 79. Retry Strategy



Retries should be bounded.



Example:



```text

AI request

max retries = 2



Image generation

max retries = 2



Transient database operation

max retries = 3

```



Do not retry invalid geometry indefinitely.



---



# 80. Generation Failure



If generation fails:



Store:



```text

job.status = FAILED

job.error_code

job.error_message

```



User sees:



> "We couldn't generate the designs this time. Your requirements have been saved. Try again."



Do not lose the project.



---



# 81. Security Requirements



Implement:



* authentication

* authorization

* CSRF protection where applicable

* rate limiting

* request validation

* file upload validation

* secure signed file URLs

* payment webhook verification

* secret management

* dependency scanning

* SQL injection prevention through ORM/parameterized queries

* XSS protection

* secure headers



---



# 82. Rate Limits



Example initial limits:



Anonymous:



```text

3 generations/day

```



Free authenticated:



```text

5 generations/month

```



Paid:



configured by plan.



AI modification requests should also be metered.



Make all limits configurable.



---



# 83. Logging



Structured logs.



Example:



```json

{

  "event": "generation_completed",

  "project_id": "...",

  "job_id": "...",

  "duration_ms": 14200,

  "candidate_count": 87,

  "valid_candidates": 31

}

```



Never log:



* passwords

* API keys

* payment secrets

* full private user conversations unless explicitly required and appropriately protected



---



# 84. Performance Targets



Initial targets:



Homepage:



```text

LCP < 2.5s

```



Normal API:



```text

p95 < 500ms

```



Generation:



Asynchronous.



Target:



```text

< 2 minutes

```



depending on image-generation provider.



The UI must remain responsive while generation runs.



---



# 85. SEO



Public marketing pages should be SEO-friendly.



Potential pages:



```text

/ai-house-design

/house-plan-generator

/3-bedroom-house-plans

/30x50-house-plans

/40x60-house-plans

/house-design-cost-india

```



Do not create thousands of low-quality programmatic pages initially.



---



# 86. Initial Content Strategy



Useful educational pages:



* How much does it cost to build a house?

* 30×50 house plans

* 40×60 house plans

* 3-bedroom house design ideas

* How setbacks affect house design

* Vastu house planning

* Ground floor vs two-floor house

* Construction cost calculator



These can drive organic traffic to the design tool.



---



# 87. Admin Dashboard



MVP admin dashboard:



```text

Users

Projects

Generation jobs

Payments

AI usage

Errors

```



Metrics:



```text

DAU

MAU

Projects created

Designs generated

Successful generations

Paid users

Revenue

AI cost

```



---



# 88. Admin Generation Inspection



Admin should be able to inspect:



```text

Project requirements

Generation job

Generated candidates

Validation errors

Cost estimate

AI operation history

```



This will be essential during early development.



---



# 89. Feature Flags



Implement feature flags for:



```text

AI_EDITOR

THREE_D

PDF_EXPORT

PAYMENTS

VASTU

PROFESSIONAL_MARKETPLACE

```



This allows controlled rollout.



---



# 90. MVP Development Order



Implement in this exact general sequence.



## Phase 1 — Foundation



* Repository

* Database

* Authentication

* Project model

* Design domain models

* API

* Frontend shell



## Phase 2 — Plot + Requirements



* Wizard

* Validation

* Unit conversion

* Project persistence



## Phase 3 — Geometry



* Plot geometry

* Buildable area

* Room models

* Placement

* Validation

* Candidate generation



## Phase 4 — AI



* Requirement parser

* Design strategy generator

* Modification parser

* AI explanation



## Phase 5 — Rendering



* SVG floor plan

* Room labels

* Dimensions

* Basic exterior visualization



## Phase 6 — Cost



* Cost engine

* Location profiles

* Estimate UI



## Phase 7 — Editor



* Natural-language modifications

* Versioning

* Undo/redo

* Compare versions



## Phase 8 — Export



* PDF

* Shareable project



## Phase 9 — Monetization



* Pricing

* Razorpay

* Entitlements

* Webhooks



## Phase 10 — Analytics/Production



* Error tracking

* Analytics

* Rate limits

* Monitoring

* Performance



---



# 91. Claude Code Development Rules



Claude must follow these rules while implementing.



## Rule 1



Do not build fake functionality.



If something is not implemented, clearly mark it as TODO.



## Rule 2



Do not use mock data in production paths.



Mocks may be used only in tests/demo mode.



## Rule 3



Do not hard-code business logic that belongs in configuration.



## Rule 4



Do not allow the LLM to directly mutate geometry.



## Rule 5



Every geometry modification must pass validation.



## Rule 6



Every user-owned resource must pass authorization checks.



## Rule 7



Do not expose secrets in source code.



## Rule 8



Write tests for every core geometry rule.



## Rule 9



Prefer small, composable modules over one huge service.



## Rule 10



Do not rewrite working architecture unnecessarily.



## Rule 11



Before implementing a feature, inspect the existing repository and reuse existing abstractions.



## Rule 12



Do not install a new dependency if the functionality can reasonably be implemented using existing dependencies.



## Rule 13



When changing the database schema, create a migration.



## Rule 14



When changing an API contract, update the corresponding types and tests.



## Rule 15



Never silently change user data.



---



# 92. Claude Implementation Workflow



For each task:



```text

1. Inspect repository

2. Identify existing architecture

3. Read relevant code

4. Identify affected modules

5. Implement smallest correct change

6. Add/update tests

7. Run type checking

8. Run linting

9. Run relevant tests

10. Fix failures

11. Summarize changes

```



Do not jump directly into coding.



---



# 93. Definition of Done



A feature is complete only when:



* functionality works

* validation exists

* authorization exists where applicable

* error states exist

* loading states exist

* tests exist

* types are correct

* lint passes

* build passes

* no secrets are committed

* documentation is updated where necessary



---



# 94. MVP Acceptance Criteria



The MVP is considered complete when a new user can:



```text

Visit homepage

        ↓

Start design

        ↓

Enter 30 × 50 ft plot

        ↓

Select 2 floors

        ↓

Select 3 bedrooms

        ↓

Select 3 bathrooms

        ↓

Select 1 parking

        ↓

Enter ₹35 lakh budget

        ↓

Select Modern

        ↓

Enable Vastu preferences

        ↓

Generate

        ↓

Receive 3 valid design candidates

        ↓

View each floor plan

        ↓

View room dimensions

        ↓

View estimated cost

        ↓

Select one

        ↓

Ask:

"Make the master bedroom larger"

        ↓

Receive validated modified design

        ↓

View new version

        ↓

Export PDF

```



---



# 95. Future Roadmap



## V2



* Interactive 3D

* Better Vastu engine

* More plot shapes

* Better regulation datasets

* Interior design

* Material estimates

* Better cost intelligence



## V3



* Architect marketplace

* Structural engineer marketplace

* Contractor marketplace

* Quote comparison

* Construction contracts

* Project management



## V4



* Materials marketplace

* Financing

* Insurance

* Construction progress tracking

* Computer vision site analysis



## V5



Full platform:



```text

LAND

 ↓

DESIGN

 ↓

ENGINEERING

 ↓

APPROVAL

 ↓

CONTRACTOR

 ↓

MATERIALS

 ↓

CONSTRUCTION

 ↓

INTERIORS

 ↓

HANDOVER

```



---



# 96. Long-Term Competitive Advantage



The most important proprietary asset should become the structured design dataset.



Store anonymized/consented data around:



```text

Plot

Requirements

Generated layouts

User-selected layout

User modifications

Budget

Location

Final preferences

Professional changes

Actual construction cost

```



Over time this can improve:



* layout generation

* cost estimation

* user preference prediction

* design ranking

* regional recommendations



Privacy and consent requirements must be respected.



---



# 97. Important Product Principle



The product should feel like:



> **"ChatGPT for designing my house."**



But technically it should behave more like:



```text

LLM

 +

Constraint Solver

 +

Geometry Engine

 +

Cost Engine

 +

Visualization Engine

```



The LLM provides intelligence and natural-language interaction.



The deterministic systems provide reliability.



---



# 98. First Release Philosophy



Do not try to solve architecture completely.



Solve this one problem extremely well:



> **"I own a plot and want to explore what kind of house I can build on it."**



The user should leave the product thinking:



> "Now I understand what I can build, what it might look like, and approximately what it might cost."



That is the MVP's core value proposition.



---



# 99. First Build Target



The first technically complete milestone should be:



```text

INPUT

30 × 50 ft

3 bedrooms

3 bathrooms

2 floors

1 parking

₹35 lakh

Modern

Vastu



        ↓



HOUSE ENGINE



        ↓



3 STRUCTURED HOUSE MODELS



        ↓



VALIDATION



        ↓



3 SVG FLOOR PLANS



        ↓



3 EXTERIOR VISUALIZATIONS



        ↓



COST ESTIMATES



        ↓



RESULTS UI



        ↓



AI MODIFICATION



"Make the master bedroom larger."



        ↓



NEW VALIDATED VERSION

```



Once this works reliably, build monetization.



---



# 100. Final Instruction to Claude



You are building a real product, not a prototype screenshot.



Prioritize:



1. Correctness

2. Structured geometry

3. Validation

4. Maintainability

5. Security

6. Good UX

7. AI integration

8. Performance

9. Monetization

10. Future extensibility



Do not confuse visual quality with architectural correctness.



Do not allow generated images to become the source of truth.



The **HouseModel** is the source of truth.



All downstream systems — floor-plan rendering, 3D visualization, cost estimation, PDF generation, AI modifications — must operate from the structured HouseModel.



When uncertain, choose the architecture that preserves this principle.



**Build the system so that a user can go from "I have a plot" to "I have three understandable, editable house concepts" in one seamless workflow.**

