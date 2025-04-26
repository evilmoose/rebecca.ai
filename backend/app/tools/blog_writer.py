from langchain_core.tools import tool
import logging

# Configure logging
logger = logging.getLogger(__name__)

@tool
def blog_writer(query: str) -> str:
    """
    This tool is used to write a blog post.
    """
    logger.info(f"Blog writer tool called with query: {query}")
    
    # Create a more detailed simulated blog post
    blog_post = f"""# The Ultimate Guide to {query.title()}

## Introduction
Welcome to our comprehensive guide about {query}. In this blog post, we'll explore everything you need to know about this fascinating topic.

## Main Points
1. History and background of {query}
2. Why {query} matters in today's world
3. How to get started with {query}

## Conclusion
We hope you enjoyed learning about {query}. Stay tuned for more content!

[This is a simulated blog post created by the blog_writer tool]
"""
    
    logger.info("Blog writer tool completed successfully")
    return blog_post  