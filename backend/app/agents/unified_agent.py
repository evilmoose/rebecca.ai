"""
/agents/unified_agent.py

This is a unified agent that can be used to perform a variety of tasks.

The agent will be able to:
- Search the web
- Search a knowledge base
- Search a database
- Search a file system
"""
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic._migration")

from langchain_core.messages import SystemMessage, AIMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import Tool
from app.tools import blog_writer
from app.core.config import settings

# Set up Gemini for blog agent
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    google_api_key=settings.GOOGLE_API_KEY,
    convert_system_message_to_human=True,
    streaming=False
)

# Set up tools
tools = [
    Tool(name="write_blog", func=blog_writer.blog_writer , description="Draft a blog")
]

# bind tools to llm
llm_with_tools = llm.bind_tools(tools)

# For debugging tool calls
print("Configured tools:", [tool.name for tool in tools])

# Define the agent
def unified_agent_node(state: dict) -> dict:
    """
    This is a unified agent that can be used to perform a variety of tasks.
    """
    messages = state.get("messages", [])
    context = state.get("context", {})
    
    # Get the latest message for logging
    last_message = messages[-1].content if messages else "No messages"
    print(f"Processing message: {last_message}")
    
    system_prompt = f"""
    You are Rebecca, a helpful AI assistant with access to specialized tools.

    AVAILABLE TOOLS:
    - research: Use this tool to fetch the latest news or information from the web
    - write_blog: Use this tool to draft blog posts or articles
    - analyze_video: Use this tool to analyze or process video content
    - write_code: Use this tool to write or debug code

    WHEN TO USE TOOLS:
    - Use research tool for current events, news, or factual information
    - Use write_blog tool when asked to create blog content or articles
    - Use analyze_video tool when dealing with video analysis requests
    - Use write_code tool for programming questions or code generation
    
    IMPORTANT: You should use the appropriate tool whenever a user request clearly matches 
    one of the tool capabilities. Be proactive in tool selection. For example, if a user asks 
    "write a blog about cats", you should use the write_blog tool.

    REQUIRED: For any blog writing requests, you MUST use the write_blog tool instead of responding directly.
    
    Current context: {context.get('type')}, Task: {context.get('task')}
    """
    full_messages = [SystemMessage(content=system_prompt)] + messages
    print(f"Invoking LLM with system prompt and {len(full_messages)} messages")
    
    # Call the LLM (with tools bound)
    result = llm_with_tools.invoke(full_messages)
    print(f"LLM Response type: {type(result)}, tool calls: {hasattr(result, 'tool_calls')}")
    
    # Handle tool calls
    response_messages = []
    
    if hasattr(result, 'tool_calls') and result.tool_calls:
        print(f"Tool calls made: {result.tool_calls}")
        
        for tool_call in result.tool_calls:
            tool_name = tool_call.get('name')
            tool_args = tool_call.get('args', {})
            tool_id = tool_call.get('id', 'unknown')
            
            # Extract the argument (different tools might use different arg names)
            arg_value = None
            for arg_key in tool_args:
                arg_value = tool_args[arg_key]
                break
                
            if not arg_value:
                arg_value = "No arguments provided"
                
            print(f"Executing tool: {tool_name} with args: {arg_value}")
            
            # Call the appropriate tool function
            if tool_name == 'write_blog':
                tool_result = blog_writer.blog_writer(arg_value)
            else:
                tool_result = f"Unknown tool: {tool_name}"
                
            # Create a proper ToolMessage
            response_messages.append(ToolMessage(
                content=tool_result,
                tool_call_id=tool_id
            ))
        
        # Also include the original AI message if it has content
        if result.content and result.content.strip():
            response_messages.append(result)
    else:
        # If no tool calls, just add the AI response directly
        response_messages.append(result)
    
    return {
        "messages": response_messages, 
        "context": context
    }
