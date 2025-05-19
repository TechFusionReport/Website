import requests
import json
import os

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
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
data = response.json()["results"]

# Format and save as JSON
with open("data.json", "w") as f:
    json.dump(data, f, indent=4)

print("Notion data saved!")
