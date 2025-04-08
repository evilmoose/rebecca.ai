"""
/app/core/logging.py
Logging configuration.
"""
import logging
from logging.handlers import RotatingFileHandler
import os

def setup_logging():
    """Configure logging for the application."""
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            RotatingFileHandler(
                'logs/app.log',
                maxBytes=10000000,  # 10MB
                backupCount=5
            ),
            logging.StreamHandler()
        ]
    )

    # Create logger for research service
    logger = logging.getLogger('research_service')
    logger.setLevel(logging.INFO)

    return logger