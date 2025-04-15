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
    streaming=False
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
    task_flags = state.get("task_flags", {})
    
    # Find the last human message - extract the query
    last_human = next((m for m in reversed(messages) if isinstance(m, HumanMessage)), None)
    
    if not last_human or not last_human.content.strip():
        # Safety check - return early if no valid message
        return {
            "messages": [AIMessage(content="Research agent received empty input and could not respond.")],
            "task_flags": task_flags
        }
        
    try:
        result = research_agent.run(last_human.content)
    except Exception as e:
        result = f"Research failed: {str(e)}"

    # Mark research complete
    task_flags["research_complete"] = True

    return {
        "messages": [AIMessage(content=result)],
        "task_flags": task_flags
    }