# Retreat Registration Database Schema

## Overview

The retreat registration system supports both **individual** and **family** registrations. A family registration has a single main registrant (the contact person) and can include multiple family members.

## Database Tables

### `retreat_registrations`

Main registration record. Each registration can be either:
- **Individual**: Single person registration
- **Family**: Multiple people under one main contact

**Fields:**
- `id` (UUID): Primary key
- `type` (enum): 'individual' or 'family'
- `profileId` (UUID): Reference to the main registrant's profile
- `contactName` (string): Name of the contact person
- `contactEmail` (string): Email of the contact person
- `contactPhone` (string, optional): Phone number of the contact person
- `status` (enum): 'pending', 'confirmed', 'cancelled', or 'waitlisted'
- `notes` (text, optional): Additional notes from registration form
- `createdAt` (timestamp): When the registration was created
- `updatedAt` (timestamp): Last update time

### `retreat_registrants`

Individual people registered for the retreat. For individual registrations, there will be one registrant. For family registrations, there will be multiple registrants linked to the same registration.

**Fields:**
- `id` (UUID): Primary key
- `registrationId` (UUID): Foreign key to `retreat_registrations` (cascade delete)
- `profileId` (UUID, optional): Link to existing user profile if available
- `firstName` (string): First name
- `lastName` (string): Last name
- `age` (integer, optional): Age of the registrant
- `isAdult` (boolean): true for adult, false for child
- `dietaryRestrictions` (text, optional): Any dietary restrictions
- `medicalNotes` (text, optional): Medical information
- `emergencyContactName` (string, optional): Emergency contact name
- `emergencyContactPhone` (string, optional): Emergency contact phone
- `createdAt` (timestamp): When the registrant was added
- `updatedAt` (timestamp): Last update time

## Usage Examples

### Individual Registration

```typescript
await createRetreatRegistration({
  type: 'individual',
  profileId: 'user-profile-uuid',
  contactName: 'John Doe',
  contactEmail: 'john@example.com',
  contactPhone: '555-1234',
  registrants: [
    {
      firstName: 'John',
      lastName: 'Doe',
      age: 35,
      isAdult: true,
      dietaryRestrictions: 'Vegetarian',
    }
  ]
});
```

### Family Registration

```typescript
await createRetreatRegistration({
  type: 'family',
  profileId: 'user-profile-uuid', // Main family registrant
  contactName: 'Jane Smith',
  contactEmail: 'jane@example.com',
  contactPhone: '555-5678',
  notes: 'Looking forward to the retreat!',
  registrants: [
    {
      firstName: 'Jane',
      lastName: 'Smith',
      age: 32,
      isAdult: true,
      profileId: 'user-profile-uuid', // Link to existing profile
    },
    {
      firstName: 'Bob',
      lastName: 'Smith',
      age: 34,
      isAdult: true,
    },
    {
      firstName: 'Emma',
      lastName: 'Smith',
      age: 8,
      isAdult: false,
      dietaryRestrictions: 'No nuts',
      medicalNotes: 'Mild asthma',
      emergencyContactName: 'Grandma Smith',
      emergencyContactPhone: '555-9999',
    }
  ]
});
```

## API Endpoints

- `POST /api/retreat` - Create a new registration
- `GET /api/retreat/:id` - Get registration by ID with all registrants
- `GET /api/retreat/profile/:profileId` - Get all registrations for a user

## Service Functions

- `createRetreatRegistration()` - Create a new registration
- `getRetreatRegistrationById()` - Get registration with registrants
- `getRetreatRegistrationsByProfileId()` - Get user's registrations
- `getAllRetreatRegistrations()` - Admin: get all registrations
- `updateRegistrationStatus()` - Update registration status

## Migration

After creating the schema, run:

```bash
npm run db:generate
npm run db:migrate
```

This will create the necessary tables and enums in your PostgreSQL database.
