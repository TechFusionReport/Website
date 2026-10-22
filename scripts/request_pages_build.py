import argparse
import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def github_request(method, path, token):
    request = Request(
        "https://api.github.com/" + path,
        data=b"" if method == "POST" else None,
        method=method,
        headers={"Authorization": "Bearer " + token, "Accept": "application/vnd.github+json",
                 "X-GitHub-Api-Version": "2026-03-10", "User-Agent": "TFR-Publishing-Verification"},
    )
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def request_build(environment, submit=False):
    repository = environment.get("GITHUB_REPOSITORY", "")
    if repository != "TechFusionReport/Website":
        raise ValueError("This handoff is restricted to TechFusionReport/Website")
    if environment.get("GITHUB_REF") != "refs/heads/main" or environment.get("GITHUB_EVENT_NAME") not in ("push", "workflow_dispatch"):
        raise ValueError("Pages build handoff requires a main-branch push or manual workflow run")
    token = environment.get("GITHUB_TOKEN", "")
    if not token:
        raise ValueError("Missing workflow token with Pages permission")
    path = f"repos/{repository}/pages"
    config = github_request("GET", path, token)
    if config.get("build_type") != "legacy" or config.get("source") != {"branch": "main", "path": "/"}:
        raise ValueError("Pages is not configured for main/root branch publishing; review delivery settings before requesting a build")
    if not submit:
        return {"status": "configuration_verified", "requested": False}
    result = github_request("POST", path + "/builds", token)
    return {"status": result.get("status", "requested"), "requested": True, "url": result.get("url", "")}


def main():
    parser = argparse.ArgumentParser(description="Validate GitHub Pages source and optionally request a build after a generated commit.")
    parser.add_argument("--request", action="store_true", help="Request a Pages build after checking source and branch guards")
    args = parser.parse_args()
    try:
        result = request_build(os.environ, submit=args.request)
        print(json.dumps(result))
        if result["requested"] and os.environ.get("GITHUB_STEP_SUMMARY"):
            with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
                summary.write("GitHub Pages build requested after publishing generated listings. Deployment success still requires verification.\n")
    except (ValueError, HTTPError, URLError, OSError) as error:
        print(f"ERROR: Pages build handoff failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
