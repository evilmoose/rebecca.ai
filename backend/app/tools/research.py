from langchain_core.tools import tool

@tool
def research(query: str) -> str:
    """
    This tool is used to search the web for information.
    """
    return f"Simulated research results for {query}"