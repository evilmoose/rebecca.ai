"""
/app/utils/websearch.py
Utility functions for web search.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from tenacity import retry, stop_after_attempt, wait_exponential
from ratelimit import limits, RateLimitException
import aiohttp
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class WebSearchTool:
    ONE_MINUTE = 60
    MAX_CALLS_PER_MINUTE = 10

    def __init__(self):
        self.cache = {}
        self.cache_ttl = timedelta(hours=24)
        self.quota_limit = 100
        self.requests_made = 0
        self.api_key = settings.GOOGLE_SEARCH_API_KEY
        self.cse_id = settings.GOOGLE_CSE_ID

    async def get_cached_result(self, query: str) -> Optional[List[Dict[str, Any]]]:
        if query in self.cache:
            result, timestamp = self.cache[query]
            if datetime.now() - timestamp < self.cache_ttl:
                return result
            del self.cache[query]
        return None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    @limits(calls=MAX_CALLS_PER_MINUTE, period=ONE_MINUTE)
    async def search(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        # Check cache first
        cached_result = await self.get_cached_result(query)
        if cached_result:
            return cached_result

        # Check quota
        if self.requests_made >= self.quota_limit:
            return await self.fallback_search(query, num_results)

        try:
            results = await self._perform_search(query, num_results)
            self.cache[query] = (results, datetime.now())
            self.requests_made += 1
            return results
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return await self.fallback_search(query, num_results)

    async def _perform_search(self, query: str, num_results: int) -> List[Dict[str, Any]]:
        """Perform search using Google Custom Search API."""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://www.googleapis.com/customsearch/v1",
                params={
                    "key": self.api_key,
                    "cx": self.cse_id,
                    "q": query,
                    "num": num_results
                }
            ) as response:
                if response.status != 200:
                    raise Exception(f"Search API returned status {response.status}")
                
                data = await response.json()
                return [{
                    'title': item['title'],
                    'snippet': item['snippet'],
                    'link': item['link']
                } for item in data.get('items', [])]
        
    async def fallback_search(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Fallback search method when API quota is exceeded."""
        try:
            async with aiohttp.ClientSession() as session:
                # Use a free alternative API or web scraping
                # This is a simplified example
                async with session.get(
                    "https://ddg-api.herokuapp.com/search",
                    params={"query": query, "limit": num_results}
                ) as response:
                    results = await response.json()
                    return [{
                        'title': item['title'],
                        'snippet': item['snippet'],
                        'link': item['link']
                    } for item in results]
        except Exception as e:
            logger.error(f"Fallback search failed: {str(e)}")
            return [{"error": "Both primary and fallback search failed"}]
