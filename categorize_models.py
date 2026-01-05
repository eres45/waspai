import requests
import json

api_key = 'sk-QDL7lAoCzFaGa1pb9e14263b318b4aB7BaB1E3AfB8912bE8'
base_url = 'https://api.laozhang.ai/v1'

def get_models():
    url = f"{base_url}/models"
    headers = {"Authorization": f"Bearer {api_key}"}
    r = requests.get(url, headers=headers, timeout=15)
    if r.status_code == 200:
        return [m['id'] for m in r.json().get('data', [])]
    return []

def categorize():
    all_ids = get_models()
    
    claude = sorted([m for m in all_ids if m.startswith(('claude-', 'cld-'))])
    gemini = sorted([m for m in all_ids if m.startswith('gemini-')])
    
    # Best OpenAI (GPT 4.1+)
    gpt_best = sorted([m for m in all_ids if 'gpt-4.1' in m or 'gpt-5' in m or m == 'chatgpt-4o-latest' or m == 'gpt-4o'])
    
    # Reasoning Models (O-series)
    o_series = sorted([m for m in all_ids if m.startswith(('o1-', 'o3-', 'o4-')) or m in ['o1', 'o3']])
    
    # Grok (3 and 4)
    grok_best = sorted([m for m in all_ids if m.startswith(('grok-3', 'grok-4'))])
    
    # DeepSeek best
    deepseek_best = sorted([m for m in all_ids if 'v3' in m or 'r1' in m])

    print(f"=== CLAUDE MODELS ({len(claude)}) ===")
    for m in claude: print(f"  {m}")
    
    print(f"\n=== GEMINI MODELS ({len(gemini)}) ===")
    for m in gemini: print(f"  {m}")
    
    print(f"\n=== GPT LATEST/BEST ({len(gpt_best)}) ===")
    for m in gpt_best: print(f"  {m}")
    
    print(f"\n=== O-SERIES REASONING ({len(o_series)}) ===")
    for m in o_series: print(f"  {m}")
    
    print(f"\n=== GROK 3 & 4 ({len(grok_best)}) ===")
    for m in grok_best: print(f"  {m}")
    
    print(f"\n=== DEEPSEEK LATEST ({len(deepseek_best)}) ===")
    for m in deepseek_best: print(f"  {m}")
    
    total_selected = len(claude) + len(gemini) + len(gpt_best) + len(o_series) + len(grok_best)
    print(f"\nTOTAL HIGH-VALUE MODELS SELECTED: {total_selected}")

if __name__ == "__main__":
    categorize()
