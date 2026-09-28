import sys
import json
from functools import lru_cache

try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None

@lru_cache(maxsize=1000)
def search_images(query: str, max_results: int = 10):
    if not DDGS:
        return []
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(
                query=query,
                max_results=max_results,
                safesearch="off"
            ))
            return [
                {
                    "title": r.get("title", ""),
                    "image": r.get("image", ""),
                    "thumbnail": r.get("thumbnail", ""),
                    "url": r.get("url", ""),
                    "width": r.get("width"),
                    "height": r.get("height"),
                    "source": r.get("source", "")
                }
                for r in results if r.get("thumbnail") or r.get("image")
            ]
    except Exception as e:
        print(f"Image search error: {e}", file=sys.stderr)
        return []

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('[]')
        sys.exit(0)
    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    res = search_images(query, max_results)
    print(json.dumps(res))
