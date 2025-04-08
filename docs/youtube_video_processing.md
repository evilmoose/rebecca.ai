# YouTube Video Processing Implementation

## Overview
This document describes the implementation of YouTube video processing functionality in the application. The feature allows users to input YouTube video URLs, which are then downloaded, transcribed, and summarized using the same pipeline as local video uploads.

## Components

### 1. Video Service (`video_service.py`)
The `process_youtube_video` function handles the core YouTube video processing:

```python
async def process_youtube_video(url: str, db: AsyncSession, user_id: int) -> VideoNote:
```

Key features:
- Checks for existing video notes to avoid redundant processing
- Downloads video using `yt-dlp` with optimal format selection
- Extracts video title for use as the note topic
- Uses existing transcription and summarization pipelines
- Handles temporary file cleanup
- Implements database transaction management

### 2. API Endpoint (`video_router.py`)
The new `/video/youtube` endpoint:

```python
@router.post("/youtube", response_model=VideoNoteRead)
async def process_youtube(
    youtube_url: YouTubeURL,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user)
)
```

Features:
- Accepts YouTube URLs via POST request
- Validates URL format using Pydantic's HttpUrl
- Requires user authentication
- Returns VideoNoteRead schema response
- Handles errors with appropriate HTTP status codes

### 3. Data Model
Uses existing `VideoNote` model with fields:
- `id`: UUID primary key
- `user_id`: Foreign key to users table
- `file_name`: Stores YouTube URL
- `transcript`: Video transcription text
- `summary`: Generated summary
- `topic`: Video title from YouTube
- `created_at`/`updated_at`: Timestamps

## Processing Flow

1. **URL Submission**
   - User submits YouTube URL via POST request
   - URL is validated using Pydantic's HttpUrl

2. **Duplicate Check**
   - System checks if video was previously processed
   - Returns existing note if found

3. **Video Download**
   - Downloads video using yt-dlp
   - Saves to temporary directory
   - Extracts video metadata (title)

4. **Processing Pipeline**
   - Transcribes audio using faster-whisper
   - Generates summary using Gemini via LangChain
   - Creates VideoNote record in database

5. **Cleanup**
   - Removes temporary video file
   - Returns processed note to user

## Error Handling

The implementation includes comprehensive error handling:
- Invalid URL format
- Download failures
- Transcription errors
- Database transaction failures
- File system errors

All errors are properly caught and returned with appropriate HTTP status codes.

## Security Considerations

1. **Authentication**
   - All endpoints require user authentication
   - User ID is tracked for all operations

2. **File Management**
   - Temporary files are properly cleaned up
   - Files are stored in a dedicated temp directory
   - File paths are sanitized

3. **Data Isolation**
   - Users can only access their own video notes
   - Database queries include user_id filter

## Usage Example

```python
# Example request
POST /api/v1/video/youtube
{
    "url": "https://www.youtube.com/watch?v=example"
}

# Example response
{
    "id": "uuid",
    "user_id": 123,
    "file_name": "https://www.youtube.com/watch?v=example",
    "transcript": "Transcribed text...",
    "summary": "Generated summary...",
    "topic": "Video Title",
    "created_at": "2024-03-21T12:00:00Z",
    "updated_at": "2024-03-21T12:00:00Z"
}
```

## Dependencies

- yt-dlp: YouTube video downloading
- faster-whisper: Audio transcription
- langchain-google-genai: Text summarization
- SQLAlchemy: Database operations
- FastAPI: API framework
- Pydantic: Data validation

## Future Enhancements

Potential improvements:
1. Progress tracking for long videos
2. Video thumbnail extraction
3. Video duration limits
4. Batch processing support
5. Caching layer for frequently accessed videos 