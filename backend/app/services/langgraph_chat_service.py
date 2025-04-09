"""
/app/services/langgraph_chat_service.py

This file contains the LangGraphChatService class, which implements chat functionality using LangGraph.
"""

import os
import json
from typing import Annotated, Dict, List, Any, AsyncGenerator
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from app.tools.google_search import google_search
from dotenv import load_dotenv

load_dotenv()

class State(TypedDict):
    messages: Annotated[list, add_messages]

def should_tool(state: Dict[str, Any]) -> str:
    """
    Decide whether to use a tool or proceed directly to the chatbot.
    """
    try:
        last_msg = state["messages"][-1].content.lower()

        tool_keywords = [
            "latest", "news", "trending", "current", "real-time",
            "update", "recent", "today", "announcement", "headline"
        ]

        destination = "tools" if any(keyword in last_msg for keyword in tool_keywords) else "chatbot"
        print(f"[should_tool] Routing decision for input: '{last_msg[:50]}...' → {destination}")
        return destination
    except Exception as e:
        print(f"[should_tool error]: {e}")
        return "chatbot"

class LangGraphChatService:
    def __init__(self):
        """Initialize the chat service with LangGraph components."""
        self._validate_api_key()
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            convert_system_message_to_human=True,
            streaming=True
        )
        self.graph = self._build_graph()
        self.threads = {}

    def _validate_api_key(self) -> None:
        """Validate that the Google API key is present."""
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")

    def _build_graph(self):
        """Build LangGraph with LLM + ToolNode."""
        tools = [google_search]
        
        # Create a system message that instructs the model to use tools
        system_message = SystemMessage(content="""You are a helpful assistant with access to tools. 
When users ask for information that might not be in your training data or requires recent information,
USE THE GOOGLE SEARCH TOOL to find relevant information.

Follow these rules:
1. If the user asks for recent information or news, use the search tool
2. If the user asks about specific products, companies, or entities, use the search tool
3. If you're unsure about factual information, use the search tool to verify
4. DO NOT repeat yourself about using tools - mention once that you'll search for information, then present the results clearly
5. When responding after a search, include the information you found and cite the sources
6. Keep your responses concise and well-organized

USE THE TOOLS AVAILABLE TO YOU when appropriate.""")
        
        # Bind tools to the LLM with instructions
        llm_with_tools = self.llm.bind_tools(
            tools,
            tool_choice="auto"  # Let the model decide when to use tools
        )

        def chatbot_node(state: State):
            """Process messages with the LLM and potentially use tools."""
            # Add system message if it's not already there
            messages = state["messages"]
            if not any(isinstance(msg, SystemMessage) for msg in messages):
                messages = [system_message] + messages
            
            response = llm_with_tools.invoke(messages)
            return {"messages": [response]}

        # Build the graph
        builder = StateGraph(State)
        builder.add_node("chatbot", chatbot_node)
        builder.add_node("tools", ToolNode(tools=tools))
        builder.add_node("should_tool", should_tool)
        
        # Add conditional edges from should_tool router
        builder.add_conditional_edges(
            "should_tool",
            should_tool,
            {
                "chatbot": "chatbot",
                "tools": "tools"
            }
        )
        
        # Connect chatbot directly to END instead of using tools_condition
        builder.add_edge("chatbot", END)
        
        # Tools node still goes to chatbot for processing the results
        builder.add_edge("tools", "chatbot")
        builder.add_edge(START, "should_tool")

        return builder.compile()

    async def stream_response(self, message: str, thread_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream a response for a given message and thread ID.
        
        Args:
            message (str): The user's message
            thread_id (str): Unique identifier for the conversation thread
            
        Yields:
            Dict: Contains message type, content, and whether it's complete
        """
        # Create a LangChain HumanMessage object
        user_message = HumanMessage(content=message)
        
        # Get current state or create a new one
        try:
            # Try to get the existing conversation state
            current_state = self.graph.get_state({"configurable": {"thread_id": thread_id}})
            # Add the new message to existing messages
            state = {"messages": current_state.get("messages", []) + [user_message]}
        except:
            # If no state exists, create a new one with just this message
            state = {"messages": [user_message]}
        
        # Configure with thread ID
        config = {"configurable": {"thread_id": thread_id}}

        # Stream the response
        tool_usage_detected = False
        intermediate_content = ""
        
        async for event in self.graph.astream(state, config=config, stream_mode="values"):
            for msg in event.get("messages", []):
                # Check if it's a tool message (contains raw search results)
                if isinstance(msg, ToolMessage):
                    print(f"Tool message detected: {msg.tool_call_id}")
                    # Send tool output as a separate message with raw content
                    yield {
                        "content": msg.content, 
                        "type": "tool_output", 
                        "tool_name": msg.tool_call_id,
                        "complete": True
                    }
                
                # Check if it's an AIMessage with potential tool usage
                elif isinstance(msg, AIMessage):
                    content = msg.content
                    
                    # Check if the message is announcing tool usage
                    if not tool_usage_detected and "I will " in content and ("search" in content or "tool" in content):
                        # Extract just the tool usage announcement
                        lines = content.split("\n")
                        announcement = next((line for line in lines if "I will " in line and ("search" in line or "tool" in line)), "")
                        
                        if announcement:
                            tool_usage_detected = True
                            # Send only the announcement as a separate message
                            yield {"content": announcement, "type": "announcement", "complete": True}
                            
                            # Store the rest of the content for later
                            intermediate_content = content.replace(announcement, "").strip()
                            
                            # Don't yield more content yet - wait for tool results
                            continue
                    
                    # If we've detected tool usage before, or no tool usage detected
                    if tool_usage_detected:
                        # Combine intermediate content with new content
                        if intermediate_content and content != intermediate_content:
                            content = intermediate_content + "\n\n" + content
                            intermediate_content = ""
                    
                    # Yield the content
                    yield {"content": content, "type": "response", "complete": False}

        # Final yield to mark completion
        yield {"content": "", "type": "response", "complete": True}

    def reset_thread(self, thread_id: str):
        """
        Reset the conversation memory for a specific thread.
        
        Args:
            thread_id (str): Unique identifier for the conversation thread
        """
        self.graph.update_state({"configurable": {"thread_id": thread_id}}, {"messages": []}) 