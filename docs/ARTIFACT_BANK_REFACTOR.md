# Artifact Bank Refactor

## What Changed

**Before:** Only "New Article" flow - create update directly from new article

**Now:** Two flows:
1. **Artifact Bank** - Browse existing articles/statements, select one to create update
2. **New Article** - Add new article and create update

## New Features

### 1. Artifact Bank View
- Shows all existing `CompanyPlatformUnitStatement` records for the unit
- Displays: headline, source, preview text, date
- Click to select → parses and shows update fields
- Default view when page loads

### 2. Create Update from Existing Statement
- Select statement from bank
- Automatically parses with AI
- Shows update fields (editable)
- Creates update linked to existing statement (doesn't create duplicate statement)

### 3. Create Update from New Article
- "New Article" tab
- Paste URL or text
- Parse with AI
- Creates new statement + update

## Flow

### Flow 1: From Artifact Bank
```
Artifact Bank → Select Statement → Parse → Review Fields → Create Update
```
- Uses existing statement (no duplicate)
- Update linked to statement via `statementId`

### Flow 2: New Article
```
New Article → Paste Text/URL → Parse → Review Fields → Create Update
```
- Creates new statement + update
- Statement stores raw text (source of truth)
- Update stores parsed data

## API Changes

### Updated: `/api/company/products/platform/unit/update/create`
- Now accepts optional `statementId` parameter
- If `statementId` provided: uses existing statement
- If not: creates new statement

### New: `/api/company/products/platform/unit/statement/[id]/route.ts`
- GET endpoint to fetch single statement
- (Actually, we load statements from unit endpoint, so this might not be needed)

## UI Changes

### Toggle Buttons
- **Artifact Bank** - Browse existing articles
- **New Article** - Add new article

### Artifact Bank Display
- List of statements with:
  - Headline
  - Source name
  - Preview text (first 200 chars)
  - Date
  - Click to select

### Success State
- Shows success message
- "Create Another Update" button → goes back to bank
- "View Unit" button → goes to unit detail page

## Benefits

1. **No Duplicate Statements** - Can create multiple updates from same article
2. **Reusable Articles** - Store articles once, create updates as needed
3. **Better Organization** - See all articles in one place
4. **Clear Flow** - Artifact Bank → Select → Create Update

## Summary

**The refactor adds:**
- ✅ Artifact Bank view (browse existing statements)
- ✅ Create update from existing statement
- ✅ Toggle between Bank and New Article
- ✅ No duplicate statements when creating multiple updates

**The flow is now:**
- Artifact Bank (default) → Select → Parse → Create Update
- OR New Article → Parse → Create Update
