"""
/app/utils/doc_reader.py
Document reader and summarizer tool.
"""
from typing import Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.summarize import load_summarize_chain
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class DocumentReader:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-pro",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.2
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000,
            chunk_overlap=200
        )

    async def read_and_summarize(self, text: str) -> str:
        """Read and summarize a document."""
        try:
            # Split text into chunks
            docs = self.text_splitter.create_documents([text])
            
            # Create and run summarization chain
            chain = load_summarize_chain(
                llm=self.llm,
                chain_type="map_reduce",
                verbose=True
            )
            
            summary = await chain.arun(docs)
            return summary
        except Exception as e:
            logger.error(f"Document summarization failed: {str(e)}")
            return f"Error summarizing document: {str(e)}"

    def should_use(self, context: str) -> bool:
        """Determine if this tool should be used based on context."""
        doc_keywords = ["document", "text", "read", "summarize", "article"]
        return any(keyword in context.lower() for keyword in doc_keywords)