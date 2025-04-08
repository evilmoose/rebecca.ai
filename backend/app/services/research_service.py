"""
/app/services/research_service.py
Service for handling deep research using LangGraph agents.
"""
from typing import Dict, Any, TypedDict, List, Optional, Literal
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor
from app.utils.websearch import WebSearchTool
from app.utils.doc_reader import DocumentReader
from langchain_core.runnables import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationSummaryMemory
from langchain.tools import BaseTool
from langchain_core.tools import RunnableTool
import asyncio
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AsyncWebSearchTool(BaseTool):
    """Wrapper for async web search tool."""
    name = "web_search"
    description = "Search the web for information"
    
    def __init__(self):
        super().__init__()
        self.tool = WebSearchTool()
    
    def _run(self, query: str) -> str:
        """Run the tool synchronously."""
        return asyncio.run(self.tool.search(query))
    
    async def _arun(self, query: str) -> str:
        """Run the tool asynchronously."""
        return await self.tool.search(query)

class AsyncDocumentReader(BaseTool):
    """Wrapper for async document reader tool."""
    name = "document_reader"
    description = "Read and analyze documents"
    
    def __init__(self):
        super().__init__()
        self.tool = DocumentReader()
    
    def _run(self, text: str) -> str:
        """Run the tool synchronously."""
        return asyncio.run(self.tool.read_and_summarize(text))
    
    async def _arun(self, text: str) -> str:
        """Run the tool asynchronously."""
        return await self.tool.read_and_summarize(text)

class ResearchService:
    class GraphState(TypedDict):
        messages: List[BaseMessage]
        next_step: Literal["plan", "research", "summarize", "end"]
        research_plan: Optional[str]
        research_results: List[str]
        final_summary: Optional[str]
        progress: Dict[str, float]
        current_tool: Optional[str]
        error: Optional[str]

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-pro",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.7
        )
        self.tools = self._setup_tools()
        self.tool_executor = ToolExecutor(self.tools)
        self.memory = ConversationSummaryMemory(
            llm=self.llm,
            memory_key="chat_history",
            return_messages=True
        )

    def create_research_graph(self) -> StateGraph:
        workflow = StateGraph(self.GraphState)
        
        # Add nodes for planning, research, and summarization
        workflow.add_node("plan", self._planning_node)
        workflow.add_node("research", self._research_node)
        workflow.add_node("summarize", self._summarize_node)
        workflow.add_node("handle_error", self._error_handler)

        # Add edges
        workflow.add_edge("plan", "research")
        workflow.add_edge("research", "summarize")
        workflow.add_edge("summarize", END)
        
        # Add error handling edges
        workflow.add_edge("plan", "handle_error")
        workflow.add_edge("research", "handle_error")
        workflow.add_edge("summarize", "handle_error")
        workflow.add_edge("handle_error", "end")

        # Add conditional edges for retries
        workflow.add_conditional_edges(
            "handle_error",
            self._should_retry,
            {
                True: "plan",  # Retry from planning
                False: "end"   # Give up
            }
        )

        workflow.set_entry_point("plan")
        return workflow

    async def run_research_swarm(self, query: str) -> Dict[str, Any]:
        initial_state = {
            "messages": [HumanMessage(content=query)],
            "next_step": "plan",
            "research_plan": None,
            "research_results": [],
            "final_summary": None,
            "progress": {
                "planning": 0.0,
                "research": 0.0,
                "summarization": 0.0
            },
            "current_tool": None,
            "error": None
        }

        graph = self.create_research_graph()
        final_state = await graph.ainvoke(
            initial_state,
            config=RunnableConfig(recursion_limit=25)
        )

        return {
            "original_question": query,
            "scope_of_work": final_state["research_plan"],
            "summarized_result": final_state["final_summary"],
            "raw_result": {
                "research_results": final_state["research_results"],
                "chat_history": self.memory.chat_memory.messages
            },
            "progress": final_state["progress"]
        }

    def _setup_tools(self):
        """Initialize research tools."""
        web_search = AsyncWebSearchTool()
        doc_reader = AsyncDocumentReader()
        
        return {
            "web_search": RunnableTool.from_function(
                func=web_search._run,
                coroutine=web_search._arun,
                name=web_search.name,
                description=web_search.description
            ),
            "document_reader": RunnableTool.from_function(
                func=doc_reader._run,
                coroutine=doc_reader._arun,
                name=doc_reader.name,
                description=doc_reader.description
            )
        }

    async def _planning_node(self, state: GraphState) -> GraphState:
        """Plan research approach."""
        try:
            messages = state["messages"]
            planning_prompt = """
            Create a detailed research plan for this query. Break it down into:
            1. Key questions to answer
            2. Specific areas to investigate
            3. Types of information needed
            """
            response = await self.llm.ainvoke(
                messages + [HumanMessage(content=planning_prompt)]
            )
            state["research_plan"] = response.content
            state["next_step"] = "research"
            state["progress"]["planning"] = 1.0
            return state
        except Exception as e:
            state["error"] = str(e)
            state["next_step"] = "handle_error"
            return state

    async def _research_node(self, state: GraphState) -> GraphState:
        """Execute research based on plan."""
        try:
            plan = state["research_plan"]
            results = []
            
            # Update progress as each tool completes
            total_tools = len(self.tools)
            for i, (tool_name, tool) in enumerate(self.tools.items()):
                state["current_tool"] = tool_name
                if tool.should_use(plan):
                    try:
                        # Use the tool executor to run the tool
                        result = await self.tool_executor.ainvoke(
                            tool_name,
                            {"query": plan}
                        )
                        results.extend(result)
                    except Exception as e:
                        logger.error(f"Tool {tool_name} failed: {str(e)}")
                        state["error"] = f"Tool {tool_name} failed: {str(e)}"
                        state["next_step"] = "handle_error"
                        return state
                state["progress"]["research"] = (i + 1) / total_tools
            
            state["research_results"] = results
            state["next_step"] = "summarize"
            return state
        except Exception as e:
            state["error"] = str(e)
            state["next_step"] = "handle_error"
            return state

    async def _summarize_node(self, state: GraphState) -> GraphState:
        """Synthesize research findings."""
        try:
            results = state["research_results"]
            summary_prompt = f"""
            Synthesize these research findings into a coherent summary:
            {results}
            
            Include:
            1. Key findings
            2. Main conclusions
            3. Any important caveats or limitations
            """
            summary = await self.llm.ainvoke([HumanMessage(content=summary_prompt)])
            state["final_summary"] = summary.content
            state["next_step"] = "end"
            state["progress"]["summarization"] = 1.0
            return state
        except Exception as e:
            state["error"] = str(e)
            state["next_step"] = "handle_error"
            return state

    async def _error_handler(self, state: GraphState) -> GraphState:
        """Handle errors in the workflow."""
        logger.error(f"Error in {state['current_tool']}: {state['error']}")
        # Here you could implement more sophisticated error handling
        # For now, we'll just log and continue
        state["next_step"] = "end"
        return state

    def _should_retry(self, state: GraphState) -> bool:
        """Determine if we should retry the workflow."""
        # Implement retry logic based on error type, number of retries, etc.
        return False  # For now, we won't retry