"""
Example: Query the Fresco Interview Data API using Python.

Prerequisites:
    pip install requests

Usage:
    1. Enable the Interview Data API in Fresco (Dashboard → Settings).
    2. Create an API token and copy it.
    3. Set FRESCO_API_URL and FRESCO_API_TOKEN below (or as environment variables).
    4. Run: python example-api-query.py
"""

import os
import requests

FRESCO_API_URL = os.environ.get("FRESCO_API_URL", "https://your-fresco-instance.com")
FRESCO_API_TOKEN = os.environ.get("FRESCO_API_TOKEN", "your-api-token-here")

BASE = f"{FRESCO_API_URL}/api/v1"
HEADERS = {"Authorization": f"Bearer {FRESCO_API_TOKEN}"}


def list_interviews(page=1, per_page=10, protocol_id=None, status=None):
    """Fetch a paginated list of interviews."""
    params = {"page": page, "perPage": per_page}
    if protocol_id:
        params["protocolId"] = protocol_id
    if status:
        params["status"] = status  # "completed" or "in-progress"

    resp = requests.get(f"{BASE}/interview", headers=HEADERS, params=params)
    resp.raise_for_status()
    return resp.json()


def get_interview(interview_id):
    """Fetch a single interview with full network data."""
    resp = requests.get(f"{BASE}/interview/{interview_id}", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


def get_all_interviews(**kwargs):
    """Iterate through all pages and return every interview."""
    all_interviews = []
    page = 1
    while True:
        result = list_interviews(page=page, per_page=100, **kwargs)
        all_interviews.extend(result["data"])
        meta = result["meta"]
        if page >= meta["pageCount"]:
            break
        page += 1
    return all_interviews


if __name__ == "__main__":
    # List completed interviews (first page)
    result = list_interviews(status="completed")
    print(f"Total interviews: {result['meta']['total']}")
    for interview in result["data"]:
        print(
            f"  {interview['id']}  "
            f"participant={interview['participant']['identifier']}  "
            f"protocol={interview['protocol']['name']}  "
            f"finished={interview['finishTime']}"
        )

    # Fetch full network data for the first interview
    if result["data"]:
        first_id = result["data"][0]["id"]
        detail = get_interview(first_id)
        network = detail["data"]["network"]
        print(f"\nInterview {first_id} network:")
        print(f"  Nodes: {len(network.get('nodes', []))}")
        print(f"  Edges: {len(network.get('edges', []))}")
