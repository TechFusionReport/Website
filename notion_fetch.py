import requests
import json
import os

# Set API Credentials
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
if not NOTION_TOKEN:
    raise EnvironmentError("NOTION_TOKEN is not set. Please configure it in your environment.")
DB_ID = "your_notion_database_id"
HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

# Fetch data from Notion
response = requests.post(
    f"https://api.notion.com/v1/databases/{DB_ID}/query", headers=HEADERS
)

# Check if the response is successful
if response.status_code == 200:
    try:
        new_data = response.json().get("results", [])
    except (ValueError, KeyError) as e:
        print("Error parsing response:", e)
        new_data = []
else:
    print(f"Failed to fetch data from Notion. Status code: {response.status_code}")
    print(f"Response: {response.text}")
    new_data = []

# Load previous data if exists
if os.path.exists("data.json"):
    with open("data.json", "r") as f:
        old_data = json.load(f)
else:
    old_data = []

# Compare old vs new
if new_data != old_data:
    with open("data.json", "w") as f:
        json.dump(new_data, f, indent=4)
    print("Notion data changed! Updating...")
else:
    print("No changes detected.")
