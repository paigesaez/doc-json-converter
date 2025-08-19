# Create New Topics

A web application that converts labeling instruction documents into structured JSON for generating Google Sheets. Built for creating consistent topic tagging templates for labeling workflows.

## Features

- **Two Input Modes:**
  - **From Document**: Paste labeling instructions → auto-extracts topic, subtopics, and edge cases
  - **Manual Input**: Type or paste directly into fields
- **Automatic Cleaning:** Removes bullets, numbers, quotes, duplicates
- **Live JSON Preview:** See exactly what will be submitted
- **Editable Fields:** Review and modify extracted data before submission
- **Google Sheets Integration:** Generates "Topic Tagging: [topic]" sheets

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## How It Works

1. **Paste** your labeling instruction document (or enter data manually)
2. **Review** the extracted topic, subtopics, and edge cases
3. **Edit** any fields as needed
4. **Submit** to generate a Google Sheet for labeling

### Document Format

The parser expects labeling documents with:
- **Title** ending in "Labeling Instructions" → becomes Main Topic
- **Section 3** (Keyword Reference) → becomes Sub-Topics
- **Section 5** (Edge Case Guidance) → becomes Edge Cases

## Deployment

### Vercel
1. Push to GitHub
2. Import repo on vercel.com
3. Add environment variable: `VITE_WEBHOOK_URL`
4. Deploy (auto-detects Vite)

## Webhook Integration

### Request Format
The app sends a POST request to the configured webhook URL with:

**Endpoint:** `POST {WEBHOOK_URL}`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "json": {
    "main_topic": "string",
    "sub_topics": ["string", "..."],
    "edge_cases": ["string", "..."]
  },
  "meta": {
    "source_hash": "sha256 hash of source document",
    "submitted_at": "2024-01-01T12:00:00.000Z",
    "app_version": "create-new-topics@1.0.0"
  }
}
```

### Response Format

**Success (2xx):**
```json
{
  "sheet_url": "https://docs.google.com/spreadsheets/d/..." // optional
}
```

If `sheet_url` is provided, the UI will display a link to open the Google Sheet.

**Error (4xx/5xx):**
Any non-2xx status will show an error in the UI with retry capability.

## Document Parsing Rules

The app automatically parses documents with this structure:

```
Main Topic (first non-empty line)

1. Keyword Reference
Label1: Description
Label2: Description  
Catch-All: Everything else

2. Edge Case Guidance
- Edge case 1
- Edge case 2
```

### Parsing Logic
- **Main Topic:** First non-empty line of the document
- **Sub-Topics:** Lines matching `Label:` pattern in "Keyword Reference" section
- **Edge Cases:** All lines in "Edge Case Guidance" section
- Sections detected by regex (case-insensitive)
- Preserves exact text including punctuation and special characters

## Configuration

### Environment Variables
- `VITE_WEBHOOK_URL` - The webhook endpoint URL (required for production)

### Local Development
Default webhook URL can be modified in `src/App.tsx:7`

## JSON Schema

```typescript
type Conversion = {
  main_topic: string;      // Required, non-empty
  sub_topics: string[];    // Required, min 1 item
  edge_cases: string[];    // Optional, can be empty
}
```

## Validation Rules
- Submit button disabled unless:
  - `main_topic` is non-empty
  - `sub_topics` has at least 1 item
- Real-time validation feedback in UI
- JSON preview always shows valid, serializable JSON

## Tech Stack
- React 19.1.0
- TypeScript 5.8.3  
- Vite 7.0.6
- Tailwind CSS (via CDN)
- Lucide React (icons)

## Project Structure
```
src/
  App.tsx         # Main UI component with submit logic
  parser.ts       # Document parsing functions
  types.ts        # TypeScript type definitions
  utils.ts        # Helper functions (hashing, JSON formatting)
  main.tsx        # React entry point
  styles/         # Global CSS
```

## Testing the Webhook

Use a service like [webhook.site](https://webhook.site) to test:
1. Get a unique URL from webhook.site
2. Set as `VITE_WEBHOOK_URL`
3. Submit a document
4. View the received payload on webhook.site

## Backend Implementation Notes

Your backend webhook should:
1. Validate the incoming JSON structure
2. Process the data (e.g., create Google Sheet)
3. Return 2xx status for success
4. Optionally return `{ "sheet_url": "..." }` for direct sheet access

## Error Handling
- Network errors display user-friendly messages
- Failed submissions can be retried
- Form data persists after errors for correction
- All errors logged to browser console

## Browser Support
Modern browsers with ES2020 support (Chrome 80+, Firefox 75+, Safari 13.1+, Edge 80+)
