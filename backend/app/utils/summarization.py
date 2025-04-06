"""
/app/utils/summarization.py
This module contains the logic for summarizing text.
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.summarize import load_summarize_chain
from langchain_core.documents import Document

def summarize_text(text: str) -> str:
    """
    Summarize a given text using Google's Gemini model.
    
    Args:
        text (str): The text to summarize
        
    Returns:
        str: The summarized text
    """
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro")
    chain = load_summarize_chain(llm, chain_type="map_reduce")
    chunks = [Document(page_content=text[i:i+1000]) for i in range(0, len(text), 1000)]
    return chain.run(chunks)




