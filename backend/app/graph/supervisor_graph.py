# supervisor_graph.py

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from typing_extensions import TypedDict
from typing import Annotated, Dict
from app.core.config import settings
from app.agents.research_agent import research_agent_node

# Shared state definition
class State(TypedDict):
    messages: Annotated[list, add_messages]
    task_flags: Dict[str, bool] # Checklists for each agent

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
You manage a team of agents to complete tasks for the user.
Delegate work to agents only if it hasn't already been completed.
After an agent returns results, you summarize the outcome for the user.
""")

# Safe, stateful supervisor logic
def supervisor_node(state: State):
    messages = state["messages"]
    task_flags = state.get("task_flags", {})
    
    # Filter out empty messages to prevent 400 error from Gemini
    messages = [m for m in messages if hasattr(m, "content") and m.content and m.content.strip()]

    # Add system message if not present
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages.insert(0, system_message)
        
    # Safety check
    if not messages or all(m.content.strip() == "" for m in messages):
        return {
            "messages": [AIMessage(content="Supervisor received empty input.")],
            "task_flags": task_flags
        }
    
    # Run the LLM with current messages
    try:
        response = llm.invoke(messages)
        if not isinstance(response, AIMessage):
            response = AIMessage(content=str(response.content) if hasattr(response, "content") else str(response))
    except Exception as e:
        response = AIMessage(content=f"Error: {str(e)}")

    return {
        "messages": [response],
        "task_flags": task_flags
    }

# Agent Router: Determines which agent handles the task
def should_delegate(state: State) -> str:
    messages = state.get("messages", [])
    task_flags = state.get("task_flags", {})

    # Prevent re-delegating if already done
    if task_flags.get("research_complete"):
        print("Skipping delegation: research already complete")
        return "supervisor"

    # Only route based on actual user input (not agent messages)
    last_human = next(
        (m for m in reversed(messages) if isinstance(m, HumanMessage) and not getattr(m, "name", None)),
        None
    )

    if not last_human or not last_human.content:
        return "supervisor"

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

    # Define start point
    builder.set_entry_point("supervisor")

    # Add routing logic
    builder.add_conditional_edges("supervisor", should_delegate, {
        "supervisor": END,
        "research_agent": "research_agent"
    })

    # Reconnect agent back to supervisor
    builder.add_edge("research_agent", "supervisor")

    # Compile and THEN set recursion_limit
    graph = builder.compile()
    if graph is None:
        raise ValueError("Graph failed to compile — please check for syntax or node misreferences.")

    graph.config = {"recursion_limit": 5}
    return graph