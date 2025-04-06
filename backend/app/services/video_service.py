import os
import uuid
from app.utils.transcription import transcribe_audio
from app.utils.summarization import summarize_text
from app.models.video_note import VideoNote
from sqlalchemy.ext.asyncio import AsyncSession

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_video_file(file, db: AsyncSession, user_id: int) -> VideoNote:
    """
    Process a video file by transcribing and summarizing it.
    
    Args:
        file: The uploaded file
        db: Database session
        user_id: ID of the user uploading the file
        
    Returns:
        VideoNote: The created video note
    """
    filename = f"{uuid.uuid4()}.mp4"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        # Save the uploaded file
        with open(file_path, "wb") as f:
            f.write(file.file.read())

        # Process the video - only transcribe for now
        transcript = transcribe_audio(file_path)
        
        # Create and save the note with just the transcript
        note = VideoNote(
            file_name=file.filename,
            user_id=user_id,
            transcript=transcript,
            summary="[Summary generation temporarily disabled]"  # Placeholder summary
        )
        db.add(note)
        await db.commit()
            
        return note
    
    except Exception as e:
        await db.rollback()
        raise e
    finally:
        # Clean up the temporary file
        if os.path.exists(file_path):
            os.remove(file_path)
