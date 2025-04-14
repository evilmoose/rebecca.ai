"""
/app/services/chat_service.py

This file contains the ChatService class, which is responsible for handling the chat functionality.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from dotenv import load_dotenv
import os
from typing import List, Dict, Any

load_dotenv()

class ChatService:
    def __init__(self):
        """Initialize the chat service with necessary components."""
        self._validate_api_key()
        self.llm = self._initialize_llm()
        self.memory = self._initialize_memory()
        self.chain = self._initialize_chain()

    def _validate_api_key(self) -> None:
        """Validate that the Google API key is present."""
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")

    def _initialize_llm(self) -> ChatGoogleGenerativeAI:
        """Initialize the Google Generative AI client."""
        return ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=self.api_key,
            streaming=True
        )

    def _initialize_memory(self) -> ConversationBufferMemory:
        """Initialize the conversation memory."""
        return ConversationBufferMemory(
            return_messages=True
        )

    def _initialize_chain(self) -> ConversationChain:
        """Initialize the conversation chain."""
        return ConversationChain(
            llm=self.llm,
            memory=self.memory,
            verbose=True
        )

    async def process_message(self, message: str) -> str:
        """
        Process a user message and return the AI response.
        
        Args:
            message (str): The user's message
            
        Returns:
            str: The AI's response
        """
        try:
            response = await self.chain.arun(message)
            return response
        except Exception as e:
            raise Exception(f"Error processing message: {str(e)}")

    def clear_memory(self) -> None:
        """Clear the conversation memory."""
        self.memory.clear()

