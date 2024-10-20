import asyncio
import logging
from fastapi import FastAPI, HTTPException, Request, Query, Depends, Form, BackgroundTasks
from typing import Optional, List
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
import httpx

# GitHub OAuth 설정
CLIENT_ID = "Ov23liqQfnQy9sQtt7mA"
GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_API_URL = "https://api.github.com/user"
REDIRECT_URI = "http://localhost:8000/auth/callback"

# FastAPI 앱 생성
app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="your_secret_key_here")  # 세션 미들웨어 추가

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# GitHub 로그인 페이지
@app.get("/login")
async def login():
    logger.info("Redirecting to GitHub login page.")
    return RedirectResponse(
        f"{GITHUB_OAUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=repo,user"
    )

# OAuth 콜백 처리
@app.get("/auth/callback")
async def auth_callback(request: Request, code: str, client_secret: Optional[str] = None):
    logger.info("Handling OAuth callback.")
    logger.info("Requesting access token from GitHub.")
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": CLIENT_ID,
                "client_secret": client_secret if client_secret else 'your_default_client_secret',
                "code": code,
                "redirect_uri": REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
        )
        token_json = token_response.json()
        access_token = token_json.get("access_token")

        if not access_token:
            logger.error(f"Failed to retrieve access token. Response: {token_json}")
            raise HTTPException(status_code=400, detail="Failed to retrieve access token")

        user_response = await client.get(
            GITHUB_USER_API_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_data = user_response.json()

        # 세션에 사용자 정보와 토큰 저장
        request.session["access_token"] = access_token
        request.session["user_data"] = user_data

    logger.info("GitHub user authenticated successfully.")
    return RedirectResponse(url="/github_user_info")

# GitHub 사용자 정보 페이지 (로그인 후 사용자 정보 표시)
@app.get("/github_user_info")
async def github_user_info(request: Request):
    logger.info("Accessing GitHub user info page.")
    user_data, _ = await get_current_user(request)
    logger.info("Returning GitHub user info.")
    return {"user": user_data}

# GitHub 사용자 정보 가져오기 함수
async def get_current_user(request: Request):
    access_token = request.session.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return request.session.get("user_data"), access_token

# 사용자의 레포 목록 가져오기 (분리된 엔드포인트)
@app.get("/repos")
async def get_repos(request: Request):
    logger.info("Fetching user's repositories.")
    user_data, access_token = await get_current_user(request)
    repos_data = await get_user_repos(user_data['login'], access_token)
    logger.info("Returning user's repositories data.")
    return {"repos": repos_data}

# 사용자의 레포 목록 가져오기 (raw URL 리모팅과 콜리판 로그 제공)
async def get_user_repos(username: str, access_token: str):
    logger.info(f"Fetching repositories for user: {username}")
    retries = 3
    delay = 1  # initial delay in seconds
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://api.github.com/users/{username}/repos",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="Failed to fetch repositories")
                repos = response.json()
                break
        except (httpx.RequestError, HTTPException) as e:
            logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying after {delay} seconds...")
            await asyncio.sleep(delay)
            delay *= 2
    else:
        logger.error(f"Failed to fetch repositories for user: {username} after {retries} attempts.")
        raise HTTPException(status_code=500, detail="Failed to fetch repositories after multiple attempts.")

    if not isinstance(repos, list):
        logger.error("Unexpected response structure for repositories.")
        raise HTTPException(status_code=500, detail="Unexpected response structure from GitHub API.")
    if not repos:
        logger.warning(f"No repositories found for user: {username}")
        return {}

    user_repos_data = {}

    # 각 레포지톱의 파일 목록 및 콜리판 로그 가져오기 (비동기 병렬 실행)
    async def fetch_repo_data(repo):
        repo_name = repo.get("name")
        if not repo_name:
            logger.warning(f"Repository data is missing 'name' field: {repo}")
            return None
        logger.info(f"Fetching contents and commits for repo: {repo_name}")
        try:
            contents, commits = await asyncio.gather(
                get_repo_contents(username, repo_name, access_token),
                get_repo_commits(username, repo_name, access_token)
            )
        except HTTPException as e:
            logger.error(f"Failed to fetch data for repo: {repo_name}. Error: {str(e)}")
            return None

        repo_files_data = {}
        for file in contents:
            if file.get("type") == "file":  # 파일인 경우만 처리
                raw_url = file.get("download_url")  # 파일의 raw URL을 가져옴
                if raw_url:
                    repo_files_data[file.get("name")] = raw_url

        # 레포지톱 데이터에 파일 목록과 콜리판 로그 추가
        return repo_name, {
            "files": repo_files_data,
            "commits": commits
        }

    repo_data_tasks = [fetch_repo_data(repo) for repo in repos if repo]
    repo_results = await asyncio.gather(*repo_data_tasks)
    user_repos_data = {name: data for name, data in repo_results if name and data}

    logger.info(f"Fetched repositories data for user: {username}")
    return user_repos_data

# 레포 내 파일 목록 가져오기
async def get_repo_contents(owner: str, repo: str, access_token: str):
    logger.info(f"Fetching contents for repo: {repo}")
    retries = 3
    delay = 1  # initial delay in seconds
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}/contents",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="Failed to fetch repo contents")
                return response.json()
        except (httpx.RequestError, HTTPException) as e:
            logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying after {delay} seconds...")
            await asyncio.sleep(delay)
            delay *= 2
    else:
        logger.error(f"Failed to fetch contents for repo: {repo} after {retries} attempts.")
        raise HTTPException(status_code=500, detail="Failed to fetch repo contents after multiple attempts.")

# 레포 내 콜리판 로그 가져오기 (파일 변경 상태 포함)
async def get_repo_commits(owner: str, repo: str, access_token: str):
    logger.info(f"Fetching commits for repo: {repo}")
    retries = 3
    delay = 1  # initial delay in seconds
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}/commits",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="Failed to fetch commit logs")
                commits = response.json()
                break
        except (httpx.RequestError, HTTPException) as e:
            logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying after {delay} seconds...")
            await asyncio.sleep(delay)
            delay *= 2
    else:
        logger.error(f"Failed to fetch commit logs for repo: {repo} after {retries} attempts.")
        raise HTTPException(status_code=500, detail="Failed to fetch commit logs after multiple attempts.")

    if not isinstance(commits, list):
        logger.error("Unexpected response structure for commits.")
        raise HTTPException(status_code=500, detail="Unexpected response structure from GitHub API.")

    # 각 콜리판의 날짜, 메시지 및 파일 변경 상태를 포함하여 반환
    commit_logs = []
    for commit in commits:
        commit_sha = commit.get("sha")
        if not commit_sha:
            logger.warning("Commit data is missing 'sha' field.")
            continue

        logger.info(f"Fetching details for commit: {commit_sha}")
        retries = 3
        delay = 1  # initial delay in seconds
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient() as client:
                    commit_detail_response = await client.get(
                        f"https://api.github.com/repos/{owner}/{repo}/commits/{commit_sha}",
                        headers={"Authorization": f"Bearer {access_token}"}
                    )
                    if commit_detail_response.status_code != 200:
                        raise HTTPException(status_code=commit_detail_response.status_code, detail="Failed to fetch commit details")
                    commit_detail = commit_detail_response.json()
                    break
            except (httpx.RequestError, HTTPException) as e:
                logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying after {delay} seconds...")
                await asyncio.sleep(delay)
                delay *= 2
        else:
            logger.warning(f"Failed to fetch details for commit: {commit_sha} after {retries} attempts.")
            continue

        files_changed = []
        for file in commit_detail.get("files", []):
            # 파일 변경 상태 (추가, 삭제, 수정) 및 변경 내용 배열 추가
            patch = file.get("patch", "")
            files_changed.append({
                "filename": file.get("filename"),
                "status": file.get("status"),  # modified, added, removed 중 하나
                "changes": file.get("changes", 0),
                "additions": file.get("additions", 0),
                "deletions": file.get("deletions", 0),
                "patch": patch  # 변경 내용 (diff)
            })

        commit_logs.append({
            "message": commit.get("commit", {}).get("message", "No message"),
            "date": commit.get("commit", {}).get("committer", {}).get("date", "Unknown date"),
            "files_changed": files_changed
        })

    logger.info(f"Fetched commit logs for repo: {repo}")
    return commit_logs

# 로그아웃 기능 추가
@app.get("/logout")
async def logout(request: Request):
    logger.info("Logging out user.")
    # Ensure that only specific session keys related to user authentication are cleared to avoid unintended side effects.
    keys_to_remove = [key for key in request.session.keys() if key.startswith("auth_")]
    for key in keys_to_remove:
        del request.session[key]
    logger.info("User logged out successfully.")
    return RedirectResponse(url="/login")
