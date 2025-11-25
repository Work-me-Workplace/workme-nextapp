# Holiday Builder System

Complete holiday content generation system for WorkMe app.

## Overview

The Holiday Builder System provides a comprehensive solution for creating, managing, and generating holiday-related content including social graphics, captions, and ALT text.

## Features

### 1. Holiday Management
- Create and manage holidays (Thanksgiving, Veterans Day, Memorial Day, etc.)
- Routes: `/holiday`, `/holiday/[holidayId]`, `/holiday/new`

### 2. Photo Repository
- Grid layout showing images
- Filter by category (holiday, workforce, shipyard, general)
- Filter by holiday
- Upload assets (admin)
- Routes: `/assets`, `/assets/[assetId]`, `/assets/upload`

### 3. DVIDS Downloader
- Admin-only tool for importing images from DVIDS
- Route: `/assets/import/dvids`
- Automatically fetches, normalizes, and stores images

### 4. AI Content Generation
- Auto-generate social graphics, captions, ALT text
- Internal workforce version
- External public version
- 1-click download export pack

## Database Schema

### Holiday Model
```prisma
model Holiday {
  id         String   @id @default(cuid())
  name       String
  slug       String   @unique
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  assets     Asset[]
}
```

### Asset Model
```prisma
model Asset {
  id          String   @id @default(cuid())
  url         String
  fileName    String
  category    String   // "holiday", "workforce", "shipyard", "general"
  holidaySlug String?
  createdAt   DateTime @default(now())
  holiday     Holiday? @relation(fields: [holidaySlug], references: [slug])
}
```

## API Routes

### Holidays
- `GET /api/holidays` - List all holidays
- `POST /api/holidays/create` - Create a new holiday
- `POST /api/holidays/generate` - Generate holiday content using AI

### Assets
- `GET /api/assets` - Get assets (query params: `category`, `holiday`)
- `POST /api/assets/upload` - Upload asset (file or URL)
- `POST /api/assets/import/dvids` - Import asset from DVIDS

## File Structure

```
app/
├── holiday/
│   ├── page.tsx                    # Holiday list
│   ├── new/
│   │   └── page.tsx                # Create holiday
│   └── [holidayId]/
│       └── page.tsx                # Holiday builder
├── assets/
│   ├── page.tsx                    # Asset repository
│   ├── [assetId]/
│   │   └── page.tsx                # Asset detail
│   ├── upload/
│   │   └── page.tsx                # Upload asset
│   └── import/
│       └── dvids/
│           └── page.tsx            # DVIDS importer
└── api/
    ├── holidays/
    │   ├── route.ts                # List holidays
    │   ├── create/
    │   │   └── route.ts            # Create holiday
    │   └── generate/
    │       └── route.ts            # Generate content
    └── assets/
        ├── route.ts                # List assets
        ├── upload/
        │   └── route.ts            # Upload asset
        └── import/
            └── dvids/
                └── route.ts        # DVIDS import

components/
└── holiday/
    ├── AssetCard.tsx               # Asset card component
    ├── AssetGrid.tsx                # Asset grid layout
    ├── AssetCategorySelector.tsx    # Category filter
    ├── HolidaySelector.tsx          # Holiday filter
    ├── HolidayGeneratorPanel.tsx    # AI generation panel
    └── DownloadPackageButton.tsx   # Export button

lib/
└── holiday/
    ├── generate.ts                 # AI content generation
    ├── storage.ts                  # File storage helpers
    └── dvids.ts                    # DVIDS importer
```

## Usage

### Creating a Holiday

1. Navigate to `/holiday/new`
2. Enter holiday name and slug
3. Click "Create Holiday"

### Generating Holiday Content

1. Navigate to `/holiday/[holidayId]`
2. Click "Generate Content"
3. AI will generate:
   - Title
   - Social media caption
   - Internal workforce caption
   - External public caption
   - ALT text
   - Recommended asset

### Uploading Assets

1. Navigate to `/assets/upload`
2. Choose file upload or URL
3. Select category
4. Optionally assign to a holiday
5. Click "Upload Asset"

### Importing from DVIDS

1. Navigate to `/assets/import/dvids`
2. Enter DVIDS URL
3. Preview image (optional)
4. Select category
5. Click "Import Asset"

## File Storage

All assets are stored locally in:
```
/public/assets/[category]/[hash].jpg
```

The system automatically:
- Generates hashed filenames
- Creates category directories
- Stores metadata in database

## AI Generation

The holiday generator uses OpenAI to create:
- Professional, government-appropriate content
- Separate versions for internal and external audiences
- Descriptive ALT text for accessibility
- Asset recommendations

## Migration

Run the migration to create the database tables:
```bash
npx prisma migrate deploy
```

Or in development:
```bash
npx prisma migrate dev
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - For AI content generation
- `DATABASE_URL` - PostgreSQL connection string

## Notes

- All routes require authentication via Firebase
- Assets are stored locally (can be migrated to cloud storage later)
- DVIDS importer extracts metadata from HTML (simplified parser)
- Export package downloads as JSON (can be extended to ZIP with images)

