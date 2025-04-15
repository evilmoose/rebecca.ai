# supervisor_graph.py

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from typing_extensions import TypedDict
from typing import Annotated
from app.core.config import settings
from app.agents.research_agent import research_agent_node

# Shared state definition
class State(TypedDict):
    messages: Annotated[list, add_messages]

# Gemini LLM (streaming enabled)
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=settings.GOOGLE_API_KEY,
    convert_system_message_to_human=True,
    streaming=True
)

# Supervisor instructions
system_message = SystemMessage(content="""
You are a supervisor agent named Rebecca. 
Your job is to delegate tasks to expert agents and assemble the final response for the user.
If the user is asking for something that requires recent or real-time information, route it to the ResearchAgent.
Otherwise, respond directly.
""")

# Supervisor node logic
def supervisor_node(state: State):
    messages = state["messages"]
    
    # Filter out empty messages to prevent 400 error from Gemini
    messages = [m for m in messages if hasattr(m, "content") and m.content and m.content.strip()]

    # Add system message if not present
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages.insert(0, system_message)
        
    # Safety check
    if not messages or all(m.content.strip() == "" for m in messages):
        return {"messages": [AIMessage(content="Supervisor received empty input and could not respond.")]}

    # Run the LLM with current messages
    try:
        response = llm.invoke(messages)
        if not isinstance(response, AIMessage):
            response = AIMessage(content=response.content if hasattr(response, "content") else str(response))
    except Exception as e:
        response = AIMessage(content=f"Error: {str(e)}")
    
    return {"messages": [response]}

# Agent Router: Determines which agent handles the task
def should_delegate(state: State) -> str:
    messages = state.get("messages", [])
    last_human = next((m for m in reversed(messages) if m.type == "human"), None)

    if last_human and last_human.content:
        content = last_human.content.lower()
        keywords = ["latest", "recent", "news", "today", "current", "trending"]
        if any(kw in content for kw in keywords):
            print("→ Routing to: research_agent")
            return "research_agent"

    print("→ Routing to: supervisor")
    return "supervisor"

# Compile LangGraph graph
def get_graph():
    builder = StateGraph(State)
    
    # Add nodes
    builder.add_node("supervisor", supervisor_node)
    builder.add_node("research_agent", research_agent_node)
    
    # Define entry point
    builder.set_entry_point("supervisor")
    
    # Important: Only the FIRST supervisor node after user input should
    # have a conditional edge - this prevents AI responses from triggering delegation
    builder.add_conditional_edges(
        "supervisor", should_delegate, {
            "supervisor": END,        # Supervisor handles directly and we're done
            "research_agent": "research_agent"  # Delegate to research agent
        }
    )
    
    # Research agent always returns to supervisor for final response formatting
    builder.add_edge("research_agent", "supervisor")
    
    # Compile with very low recursion limit to prevent loops
    return builder.compile()