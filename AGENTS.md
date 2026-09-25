# HSWRMS Project Context

Project: HeavenStay Wellness Resort Management System (HSWRMS)

## Primary Requirement Sources

* @02\_Requirement/SRS/HSWRMS\_ISP392\_G1\_SRS.pdf
* @02\_Requirement/SRS/HSWRMS\_ISP392\_G1\_SRS.docx
* @02\_Requirement/Project\_Specification/HSWRMS\_ISP392\_Project\_Specification.md
* @02\_Requirement/Screen\_Inventory/Screen\_List.md

## UI/UX Source of Truth

* @03\_Design/UI\_UX/HSWRMS\_DESIGN.md

## AI Implementation Prompt Reference

* @03\_Design/Prompts/HSWRMS\_Antigravity\_Prompts.md

## Current Goal

Build a front-end prototype/demo of HSWRMS for presentation purposes.

The current phase focuses on:

* page structure
* navigation
* role-based layouts
* visual design
* screen coverage
* mocked data
* simulated UI states

Production backend functionality is NOT required yet.

## Mandatory Rules

* Use the project name HSWRMS consistently.
* Use the term Customer consistently instead of Guest.
* Follow Screen\_List.md for the baseline screen scope.
* Follow HSWRMS\_DESIGN.md for UI/UX decisions.
* Do not invent business rules that contradict the SRS.
* Respect role-based access and sensitive-data minimization.
* Therapist sees only treatment-relevant health notes.
* F\&B Staff/Chef sees only relevant allergy/dietary information.
* Receptionist must not see unnecessary sensitive health information.
* Manager is not a full Admin.
* Spa booking is confirmed only when both Therapist and Treatment Room are available.
* Checkout cannot complete while unpaid Spa/F\&B charges remain.
* Payment success is not the same as checkout completion.
* Review \& Rating is optional and post-checkout.

## Implementation Location

All front-end prototype source code must be created inside:

@04\_Implement/Frontend\_Prototype/

Do not place application source code in Requirement or Design folders.

