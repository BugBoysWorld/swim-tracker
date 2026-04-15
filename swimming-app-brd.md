# Business Requirements Document (BRD)
## Swimming Placement Tracker Application

---

## Document Information

**Document Version:** 1.0  
**Date:** April 14, 2026  
**Status:** Final  
**Prepared By:** Product Team  

---

## Executive Summary

The Swimming Placement Tracker is a competitive swim time analysis application designed to help swim coaches and team managers evaluate swimmer performance relative to competitor times across various swimming events. The application enables users to track swimmer times, compare them against competitor data, and determine competitive placement rankings to inform training strategies and event selection.

---

## Business Objectives

### Primary Objectives
1. Enable rapid assessment of swimmer competitiveness across multiple events
2. Streamline data entry and management of competitor times and swimmer performance data
3. Provide clear, actionable placement insights to inform coaching decisions
4. Reduce time spent on manual time comparison and placement calculations

### Success Metrics
- Time saved in competitive analysis (target: 75% reduction vs. manual methods)
- User adoption rate among target coaching staff
- Data accuracy and completeness
- User satisfaction score (target: 4.5/5.0)

---

## Target Users

### Primary User Persona: Swim Coach
- **Role:** Head coach or assistant coach for competitive swim team
- **Responsibilities:** Training strategy, event selection, performance tracking
- **Pain Points:** 
  - Manual comparison of times is time-consuming
  - Difficult to track multiple swimmers across numerous events
  - Hard to visualize competitive standing quickly
- **Needs:** Fast access to placement data, easy data entry, clear visual presentation

### Secondary User Persona: Team Manager
- **Role:** Administrative support for swim team
- **Responsibilities:** Data management, meet preparation
- **Pain Points:** Managing large volumes of competitor data
- **Needs:** Bulk data entry capabilities, organized event management

---

## Functional Requirements

### FR-1: Event Management

**FR-1.1 Pre-loaded Events**
- The system shall provide a default set of 20 standard swimming events
- Events include: Boys and Girls categories for 50/100/200/500 Free, 50/100 Back, 50/100 Breast, 50/100 Fly
- Events shall be displayed in alphabetical order

**FR-1.2 Custom Event Creation**
- Users shall be able to add custom events with user-defined names
- Event names shall support alphanumeric characters and spaces
- System shall prevent duplicate event names

**FR-1.3 Event Deletion**
- Users shall be able to delete events
- System shall warn users that deleting an event will remove all associated data
- System shall require confirmation before deletion

**FR-1.4 Event Persistence**
- All events shall be saved automatically
- Events shall persist between application sessions

---

### FR-2: Competitor Time Management

**FR-2.1 Single Time Entry**
- Users shall be able to enter individual competitor times for any event
- Times shall be entered in seconds with one decimal place precision (e.g., 27.5)
- System shall validate that times are positive numbers

**FR-2.2 Bulk Time Entry**
- Users shall be able to enter multiple competitor times sequentially
- System shall provide navigation between entry fields
- System shall automatically create new entry fields as needed
- Users shall be able to remove individual entry fields

**FR-2.3 Duplicate Prevention**
- System shall automatically prevent duplicate times for the same event
- If a user attempts to enter a time that already exists for an event, the system shall ignore the duplicate

**FR-2.4 Time Display**
- All times shall be displayed as decimal numbers with one decimal place
- Times shall be sorted in ascending order (fastest to slowest)
- Each event shall display the count of competitor times

**FR-2.5 Time Deletion**
- Users shall be able to delete individual competitor times
- System shall update placement calculations immediately upon deletion

---

### FR-3: Swimmer Management

**FR-3.1 Swimmer Creation**
- Users shall be able to add swimmers by name
- System shall prevent duplicate swimmer names
- Swimmers shall be displayed in alphabetical order

**FR-3.2 Swimmer Name Editing**
- Users shall be able to edit swimmer names
- System shall update all associated time records when a name is changed
- System shall prevent saving empty names

**FR-3.3 Swimmer Deletion**
- Users shall be able to delete swimmers
- System shall warn that deletion will remove all swimmer times
- System shall require confirmation before deletion

**FR-3.4 Swimmer Time Entry**
- Users shall be able to record times for each swimmer by event
- Each swimmer may have one time per event
- Entering a new time for an existing swimmer/event combination shall overwrite the previous time

**FR-3.5 Swimmer Time Deletion**
- Users shall be able to delete individual times for a swimmer
- Deletion shall not affect the swimmer's other event times

---

### FR-4: Placement Calculation and Display

**FR-4.1 Placement Calculation**
- System shall calculate placement by comparing swimmer time against all competitor times for the event
- Placement shall be displayed as an ordinal rank (e.g., #1, #5, #12)
- System shall display total number of competitors (e.g., "of 25")

**FR-4.2 Surrounding Times Display**
- System shall always display the #1 fastest competitor time
- System shall display up to 3 times faster than the swimmer's time
- System shall display up to 3 times slower than the swimmer's time
- Swimmer's time shall be visually distinguished from competitor times

**FR-4.3 Real-time Updates**
- Placement calculations shall update immediately when competitor times change
- Placement calculations shall update immediately when swimmer times change

---

### FR-5: Dashboard and Navigation

**FR-5.1 Dashboard Overview**
- System shall display summary statistics: total events, total swimmers, events with competitor times
- System shall display all swimmers with their recorded event times and placements
- Each event listing shall show: event name, swimmer time, placement rank

**FR-5.2 Navigation Flow**
- Users shall be able to navigate from dashboard swimmer name to placement view with swimmer pre-selected
- Users shall be able to navigate from dashboard event listing to placement view with swimmer and event pre-selected
- Users shall be able to navigate between major sections: Dashboard, Placement, Admin

**FR-5.3 Placement View**
- After selecting a swimmer, system shall display all events where times are recorded
- Users shall be able to expand any event to view detailed placement and surrounding times
- Placement details shall be displayed inline without requiring separate screen navigation

---

### FR-6: Administrative Functions

**FR-6.1 Admin Organization**
- Administrative functions shall be grouped into three categories: Events, Competitor Times, My Swimmers
- Users shall be able to switch between admin sections using segmented controls

**FR-6.2 Data Management**
- All user data shall be saved automatically
- No explicit save action shall be required from users
- Data shall persist between application sessions

---

### FR-7: User Interface Requirements

**FR-7.1 Input Methods**
- System shall support keyboard input for all text and numeric fields
- Numeric fields shall display appropriate number keyboard
- System shall provide keyboard dismissal controls

**FR-7.2 Bulk Entry Experience**
- During bulk time entry, system shall provide "Next" navigation to advance between fields
- System shall keep keyboard active when navigating between fields
- System shall provide "Done" control to complete entry and dismiss keyboard

**FR-7.3 Confirmation Dialogs**
- System shall display confirmation dialogs for destructive actions (deletions)
- Confirmation dialogs shall clearly state consequences of the action
- Users shall be able to cancel destructive actions

**FR-7.4 Visual Feedback**
- Placement ranks shall be visually prominent
- Current swimmer's time shall be distinguished from competitor times in placement view
- Empty states shall provide clear messaging when no data exists

---

## Non-Functional Requirements

### NFR-1: Performance
- Placement calculations shall complete within 100ms
- User interface shall respond to user input within 50ms
- Application shall support minimum 100 swimmers and 50 times per event without performance degradation

### NFR-2: Data Integrity
- All data operations shall be atomic
- System shall prevent data loss during unexpected termination
- Data shall be validated before storage

### NFR-3: Usability
- Application shall be usable without training or documentation
- Common tasks shall require no more than 3 user actions
- Error messages shall be clear and actionable

### NFR-4: Reliability
- Data shall persist reliably between sessions
- Application shall handle edge cases (empty data, single entry, maximum entries)
- System shall prevent invalid data entry

### NFR-5: Scalability
- Application shall support growth to 500+ swimmers
- Application shall support 100+ times per event
- Performance shall remain acceptable as data volume increases

---

## Data Requirements

### DR-1: Data Persistence
- All application data must be stored locally on the device
- Data must persist between application sessions
- No cloud or external storage is required

### DR-2: Data Structure
- Events: name (string, unique)
- Competitor Times: event reference, time value (decimal)
- Swimmers: ID (unique), name (string)
- Swimmer Times: swimmer reference, event reference, time value (decimal)

### DR-3: Data Validation
- All time values must be positive decimal numbers
- All names must be non-empty strings
- Event names must be unique
- Swimmer names must be unique

---

## Assumptions and Dependencies

### Assumptions
1. Users have basic familiarity with competitive swimming events and terminology
2. Users will enter time data in seconds (not minutes:seconds format)
3. Competitor time data is obtained from external sources (meet results, etc.)
4. Application is used by single user (no multi-user or sharing requirements)
5. Times represent final official results (not preliminary or heat times)

### Dependencies
1. Device storage availability for data persistence
2. Device input capabilities (keyboard/touch)
3. Sufficient device performance for real-time calculations

---

## Out of Scope

The following items are explicitly excluded from the current scope:

1. **Data Import/Export:** Importing times from external files or exporting data
2. **Multi-user/Sync:** Sharing data between users or devices
3. **Historical Tracking:** Tracking performance changes over time, trend analysis
4. **Meet Management:** Managing swim meets, heat sheets, or event scheduling
5. **Time Format Conversion:** Converting between minutes:seconds and decimal seconds
6. **Automatic Data Collection:** Integration with timing systems or meet result websites
7. **Reporting:** Generating formatted reports or analytics
8. **Swimmer Profiles:** Detailed swimmer information beyond name and times
9. **Team Management:** Managing multiple teams or team rosters
10. **Authentication:** User login or access control

---

## Success Criteria

The application will be considered successful when:

1. **Functional Completeness:** All functional requirements are implemented and tested
2. **User Adoption:** Target users actively use the application for competitive analysis
3. **Time Savings:** Users report significant time savings vs. manual methods
4. **Data Accuracy:** Placement calculations are verified as accurate
5. **User Satisfaction:** Users rate the application favorably in usability testing
6. **Reliability:** Application operates without data loss or critical errors

---

## Acceptance Criteria

### Must Have (Release Blockers)
- All 20 default events are present
- Users can add custom events
- Users can add competitor times (single and bulk)
- Users can add swimmers and swimmer times
- Placement calculations are accurate
- Duplicate competitor times are prevented
- Surrounding times display includes #1 and ±3 positions
- Data persists between sessions
- Navigation from dashboard to placement works correctly

### Should Have (High Priority)
- Swimmer name editing functionality
- Individual time deletion for swimmers
- Bulk entry keyboard stays active with Next button
- Confirmation dialogs for destructive actions
- Visual distinction of swimmer time in placement view

### Nice to Have (Lower Priority)
- Empty state messaging
- Performance optimizations for large datasets
- Enhanced visual design

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss due to technical failure | High | Low | Implement robust data persistence with validation |
| User confusion with bulk entry | Medium | Medium | Provide clear UI cues and keyboard controls |
| Performance degradation with large datasets | Medium | Low | Optimize calculations and implement efficient data structures |
| Duplicate data entry errors | Low | Medium | Implement duplicate prevention and validation |
| Incorrect placement calculations | High | Low | Comprehensive testing with edge cases |

---

## Appendix

### Glossary

- **Event:** A specific swimming competition category (e.g., Girls 50 Free)
- **Competitor Time:** A time achieved by an external competitor (not tracked swimmer)
- **Swimmer Time:** A time achieved by a tracked swimmer
- **Placement:** The rank position a swimmer would achieve competing against competitor times
- **Surrounding Times:** The times immediately before and after a swimmer's time in ranking order

### Example Use Case

**Scenario:** Coach wants to determine if swimmer should compete in 50 Free or 100 Free at upcoming meet

**Steps:**
1. Coach opens application
2. Coach navigates to Dashboard
3. Coach taps swimmer name to view their events
4. Coach reviews placement for 50 Free (e.g., #5 of 32)
5. Coach taps 100 Free event to view detailed placement (e.g., #12 of 28)
6. Coach determines 50 Free shows more competitive placement
7. Coach uses this information to make event entry decision

### Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-04-14 | Product Team | Initial release |

---

**Document End**
