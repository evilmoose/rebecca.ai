import os
import uuid
import yt_dlp
from app.utils.transcription import transcribe_audio
from app.utils.summarization import summarize_text
from app.models.video_note import VideoNote
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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

async def process_youtube_video(url: str, db: AsyncSession, user_id: int) -> VideoNote:
    """
    Process a YouTube video by downloading, transcribing, and summarizing it.
    
    Args:
        url (str): YouTube video URL
        db: Database session
        user_id: ID of the user processing the video
        
    Returns:
        VideoNote: The created video note
    """
    # Check if video already exists in database
    stmt = select(VideoNote).where(
        VideoNote.file_name == url,
        VideoNote.user_id == user_id
    )
    result = await db.execute(stmt)
    existing_note = result.scalar_one_or_none()
    
    if existing_note:
        return existing_note

    filename = f"{uuid.uuid4()}.mp4"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        # Download video using yt-dlp
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': file_path,
            'quiet': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_title = info.get('title', 'Unknown Title')

        # Transcribe the video
        transcript = transcribe_audio(file_path)
        
        # Generate summary
        summary = summarize_text(transcript)
        
        # Create and save the note
        note = VideoNote(
            file_name=url,
            user_id=user_id,
            transcript=transcript,
            summary=summary,
            topic=video_title
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
