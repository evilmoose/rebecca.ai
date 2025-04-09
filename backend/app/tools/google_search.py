"""
/app/tools/google_search.py

Google Custom Search tool for the chatbot.
"""

import requests
from langchain_core.tools import tool
from app.core.config import settings

@tool
def google_search(query: str) -> str:
    """Use Google Custom Search API to fetch results for a user query."""
    api_key = settings.GOOGLE_SEARCH_API_KEY
    cse_id = settings.GOOGLE_CSE_ID
    
    print(f"Searching for: {query}")
    print(f"Using CSE ID: {cse_id}")
    
    url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={api_key}&cx={cse_id}"
    
    try:
        response = requests.get(url)
        response_json = response.json()
        
        if "error" in response_json:
            error_msg = f"Search API error: {response_json['error']['message']}"
            print(error_msg)
            return error_msg
        
        items = response_json.get("items", [])
        if not items:
            print("No results found")
            return "No results found for your query."
            
        results = []
        print(f"Found {len(items)} results")
        
        # Include a search summary for context
        search_info = response_json.get("searchInformation", {})
        total_results = search_info.get("formattedTotalResults", "0")
        search_time = search_info.get("formattedSearchTime", "0")
        
        for item in items[:5]:  # Show up to 5 results for more comprehensive info
            title = item.get("title", "No title")
            link = item.get("link", "No link")
            snippet = item.get("snippet", "No description")
            # Add special SEARCH_RESULT markers for easier frontend detection
            results.append(f"[[SEARCH_RESULT]]\n- {title}\n  URL: {link}\n  Description: {snippet}\n[[/SEARCH_RESULT]]")
            
        # Create a formatted response with the search summary
        search_summary = f"Based on my search for '{query}' (found {total_results} results in {search_time} seconds), here's what I found:\n\n"
        
        # Add a special marker at the start for frontend detection
        return "[[SEARCH_RESULTS_START]]\n" + search_summary + "Here are the top search results:\n\n" + "\n\n".join(results) + "\n[[SEARCH_RESULTS_END]]"
    
    except Exception as e:
        error_msg = f"Search error: {str(e)}"
        print(error_msg)
        return error_msg 