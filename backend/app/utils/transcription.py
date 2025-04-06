"""
/app/utils/transcription.py
This module contains the logic for transcribing audio files.
"""
from faster_whisper import WhisperModel

def transcribe_audio(file_path: str, model_size="base") -> str:
    """
    Transcribe an audio file using the Whisper model.
    
    Args:
        file_path (str): Path to the audio file
        model_size (str): Size of the Whisper model to use
        
    Returns:
        str: The transcribed text
    """
    # Use CPU instead of GPU since CUDA is not available
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(file_path)
    return " ".join([seg.text.strip() for seg in segments])


