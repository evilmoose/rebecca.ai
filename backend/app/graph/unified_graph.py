"""
/app/graph/unified_graph.py

This is a unified graph that can be used to perform a variety of tasks.

The graph will be able to:
- Perform a general chat
- Perform a video processing task
- Perform a blog writing task
"""
from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages
from app.agents.unified_agent import unified_agent_node
from typing import TypedDict, Annotated, Dict, Any

# Shared state definition
class State(TypedDict):
    messages: Annotated[list, add_messages]
    context: Dict[str, Any]  # Thread context info
    task_flags: Dict[str, bool]  # Checklists for each agent

# Define the graph
def get_graph():
    builder = StateGraph(State)

    # Add nodes
    builder.add_node("main_agent", unified_agent_node)

    # Add edges
    builder.add_edge(START, "main_agent")
    builder.add_edge("main_agent", END)

    graph = builder.compile()
    graph.config = {"recursion_limit": 5}

    return graph
