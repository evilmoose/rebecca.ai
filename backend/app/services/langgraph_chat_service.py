# langgraph_chat_service.py

from langchain_core.messages import HumanMessage, ToolMessage, AIMessage
from typing import Dict, Any, AsyncGenerator
from app.graph.supervisor_graph import get_graph

class LangGraphChatService:
    def __init__(self):
        self.graph = get_graph()
        self.threads = {}

    async def stream_response(self, message: str, thread_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        user_message = HumanMessage(content=message)

        try:
            current_state = self.graph.get_state({"configurable": {"thread_id": thread_id}})
            state = {"messages": current_state.get("messages", []) + [user_message]}
        except:
            state = {"messages": [user_message]}

        config = {"configurable": {"thread_id": thread_id}}

        async for event in self.graph.astream(state, config=config, stream_mode="values"):
            for msg in event.get("messages", []):
                if isinstance(msg, ToolMessage):
                    yield {
                        "content": msg.content,
                        "type": "tool_output",
                        "tool_name": msg.tool_call_id,
                        "complete": True
                    }
                elif isinstance(msg, AIMessage):
                    yield {
                        "content": msg.content,
                        "type": "response",
                        "complete": False
                    }

        # Final yield
        yield {"content": "", "type": "response", "complete": True}

    def reset_thread(self, thread_id: str):
        self.graph.update_state({"configurable": {"thread_id": thread_id}}, {"messages": []}) 