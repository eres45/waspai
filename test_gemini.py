import requests

api_key = 'AIzaSyDE9_3ikb_l8yc4bVts6Sq7R4SbbIBcKVE'

def test_gemini_models():
    models_url = f'https://generativelanguage.googleapis.com/v1beta/models?key={api_key}'
    try:
        response = requests.get(models_url, timeout=15)
        print('Models endpoint status:', response.status_code)
        if response.status_code == 200:
            data = response.json()
            models = data.get('models', [])
            print(f'Total models found: {len(models)}')
            print('\nAvailable Gemini models:')
            for model in models:
                name = model.get('name', 'Unknown')
                if 'gemini' in name.lower():
                    print(f'  - {name}')
            return True
        else:
            print('Error response:', response.text)
            return False
    except Exception as e:
        print('Error:', e)
        return False

if __name__ == "__main__":
    result = test_gemini_models()
    print('Final result:', 'SUCCESS' if result else 'FAILED')
