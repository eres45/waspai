import requests
import json

api_key = 'sk-QDL7lAoCzFaGa1pb9e14263b318b4aB7BaB1E3AfB8912bE8'
base_url = 'https://api.laozhang.ai/v1'

def test_model(model_name):
    print(f"Testing model: {model_name}...")
    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": "Say 'OK' if you are working."}],
        "max_tokens": 10
    }
    
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=30)
        if r.status_code == 200:
            data = r.json()
            content = data['choices'][0]['message']['content']
            print(f"✅ SUCCESS: {content.strip()}")
            return True
        else:
            print(f"❌ FAILED: Status {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def list_models():
    print("Fetching available models...")
    url = f"{base_url}/models"
    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            models = r.json().get('data', [])
            print(f"Found {len(models)} models:")
            for m in models: 
                print(f"  - {m['id']}")
            return models
        else:
            print(f"Could not list models: {r.status_code}")
            return []
    except Exception as e:
        print(f"Error listing models: {e}")
        return []

if __name__ == "__main__":
    list_models()
    print("-" * 30)
    test_model("gpt-4.1-mini")
    print("-" * 30)
    test_model("claude-sonnet-4-20250514")
