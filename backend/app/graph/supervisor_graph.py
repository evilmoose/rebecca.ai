# supervisor_graph.py

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from typing_extensions import TypedDict
from typing import Annotated
from app.core.config import settings

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
system_message = SystemMessage(content="You are Rebecca, a helpful assistant.")

# Supervisor node logic
def supervisor_node(state: State):
    messages = state["messages"]

    # Add system message if not present
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages.insert(0, system_message)

    # Run the LLM with current messages
    response = llm.invoke(messages)
    return {"messages": [response]}

# Graph builder
def get_graph():
    builder = StateGraph(State)
    builder.add_node("supervisor", supervisor_node)
    builder.set_entry_point("supervisor")
    builder.add_edge("supervisor", END)
    return builder.compile()