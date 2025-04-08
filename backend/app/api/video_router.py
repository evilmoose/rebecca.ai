from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.api.users import current_active_user
from app.models.user import User
from app.schemas.video_note import VideoNoteRead, YouTubeURL
from app.services.video_service import process_video_file, process_youtube_video

router = APIRouter(prefix="/video", tags=["video"])

@router.post("/upload", response_model=VideoNoteRead)
async def upload_video(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user)
):
    """
    Upload and process a video file.
    
    Args:
        file: The video file to upload
        db: Database session
        user: Current authenticated user
        
    Returns:
        VideoNoteRead: The created video note
    """
    note = await process_video_file(file, db=db, user_id=user.id)
    return note

@router.post("/youtube", response_model=VideoNoteRead)
async def process_youtube(
    youtube_url: YouTubeURL,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user)
):
    """
    Process a YouTube video by downloading, transcribing, and summarizing it.
    
    Args:
        youtube_url: The YouTube video URL
        db: Database session
        user: Current authenticated user
        
    Returns:
        VideoNoteRead: The created video note
    """
    try:
        note = await process_youtube_video(str(youtube_url.url), db=db, user_id=user.id)
        return note
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
