import requests
try:
    res = requests.post(
        "http://127.0.0.1:8000/api/text-query", 
        json={"text": "hello"}, 
        headers={
            "X-Client-Timezone": "Asia/Kolkata", 
            "X-Client-Time": "2026-05-19T23:20:24.000Z"
        }
    )
    print("STATUS CODE:", res.status_code)
    print("RESPONSE:", res.json())
except Exception as e:
    print("ERROR:", e)
