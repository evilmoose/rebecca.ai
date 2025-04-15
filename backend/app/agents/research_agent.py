"""
/app/agents/research_agent.py

Contains a new LangChain agent with role prompt + tavily_search
"""

from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.agents import initialize_agent, AgentType
from langchain.tools import Tool
from app.core.config import settings

# Set up Tavily as a LangChain tool
tavily_search = Tool(
    name="tavily_search",
    func=TavilySearchResults(k=3, tavily_api_key=settings.TAVILY_API_KEY).run,
    description="Search the web for current or recent information"
)

# Set up ResearchAgent: Gemini + Tavily
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=settings.GOOGLE_API_KEY,
    convert_system_message_to_human=True,
    streaming=True
)

# Agent that uses tootls and follows the React Agent protocol
research_agent = initialize_agent(
    tools=[tavily_search],
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    handle_parsing_errors=True
)

# LangGraph-compatible wrapper node function
def research_agent_node(state: dict) -> dict:
    """
    LangGraph node function that uses the research_agent to answer questions
    """
    messages = state["messages"]
    
    # Find the last human message - extract the query
    last_human = next((m for m in reversed(messages) if isinstance(m, HumanMessage)), None)
    
    if not last_human or not last_human.content:
        # Safety check - return early if no valid message
        return {
            "messages": [AIMessage(content="Research agent received empty input and could not respond.")]
        }
        
    user_message = last_human.content
    
    try:
        # Run the research agent
        result = research_agent.run(user_message)
        
        if not result or not result.strip():
            result = "I couldn't find relevant information at the moment."
            
    except Exception as e:
        # Handle any errors
        result = f"Research failed: {str(e)}"
    
    # Return as AIMessage (not HumanMessage) to avoid recursion issues
    return {
        "messages": [AIMessage(content=result)]
    }