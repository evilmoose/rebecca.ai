from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.api.users import current_active_user
from app.models.user import User
from app.schemas.video_note import VideoNoteRead
from app.services.video_service import process_video_file

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
