# DuckDuckGo Safe Web Search integration for WaspAI / Better-Chatbot
# Adapted from DeepSeek Harness & Nous Hermes architecture
import sys
import json
import time
from functools import lru_cache

try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None

@lru_cache(maxsize=2000)  # free in-memory caching for repeated queries
def safe_web_search(query: str, max_results: int = 5):
    if not DDGS:
        return []
    for attempt in range(3):  # resilient exponential backoff retry
        try:
            with DDGS() as ddgs:
                # Support both positional query and keyword arguments across ddgs versions
                try:
                    results = list(ddgs.text(
                        query,
                        region="wt-wt",
                        safesearch="off",
                        timelimit=None,
                        max_results=max_results
                    ))
                except TypeError:
                    results = list(ddgs.text(
                        keywords=query,
                        region="wt-wt",
                        safesearch="off",
                        timelimit=None,
                        max_results=max_results
                    ))
                return results
        except Exception as e:
            # catches RatelimitException or any temporary block with backoff
            print(f"DDG hiccup on attempt {attempt+1} — waiting... ({e})", file=sys.stderr)
            time.sleep(2 ** attempt)  # 1s → 2s → 4s backoff
    return []  # graceful fallback

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('[]')
        sys.exit(0)
    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    res = safe_web_search(query, max_results)
    print(json.dumps(res))
