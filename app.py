import asyncio
import subprocess
from fastapi import FastAPI, Form, UploadFile, File, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from uploads import create_build

import shutil
import os
import aiomysql
import csv
import datetime
import aiofiles

import time

SECRET_KEY = "bob13_dev"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# 파일 저장할 경로
temp_upload_dir = "./uploads"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인에서의 접근을 허용하려면 "*"
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드를 허용
    allow_headers=["*"],  # 모든 HTTP 헤더를 허용
)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

# MariaDB 연결 설정
async def get_db():
    pool = await aiomysql.create_pool(
        host="localhost",
        port=3306,
        user="root",
        password="asdf",
        db="Fuzzer",
        autocommit=True
    )
    return pool

# 유저 관련 함수들
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(""" 
                SELECT username, disabled  -- 필요한 다른 필드 추가
                FROM Users
                WHERE username = %s;
            """, (token_data.username,))  # 튜플로 전달해야 함
            user_row = await cur.fetchone()  # 사용자 정보 가져오기

    if user_row is None:
        raise credentials_exception

    # User 객체 생성 (필드에 맞춰 수정)
    current_user = User(
        username=user_row[0],
        disabled=user_row[1]
        # 필요에 따라 다른 필드도 추가
    )
    
    return current_user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# CSV 파일을 읽고 DB에 전송하는 로직 (DB는 가상으로 처리)
async def parse_csv_and_send_to_db(final_folder: str, user_name: str, project_name: str):
    file_path = os.path.join(final_folder, 'misc', 'code_coverage.csv')
    fuzzer_data = {}

    def parse_percent(value):
        """퍼센트 값을 소수점 이하 반올림하여 정수로 변환하는 함수"""
        try:
            # 공백 제거 및 괄호 안에 있는 퍼센트 값 추출 후 변환
            percentage = value.split('(')[-1].strip('%)').strip()
            return round(float(percentage))
        except (ValueError, IndexError):
            print(f"잘못된 퍼센트 값: {value}")
            return 0  # 기본값으로 0 반환

    try:
        # CSV 파일 읽기
        async with aiofiles.open(file_path, mode='r') as f:
            content = await f.readlines()
            reader = csv.DictReader(content)

            for row in reader:
                if row['Fuzzer'] == 'Fuzzer_000':
                    fuzzer_data = {
                        "region": parse_percent(row[' Regions']),
                        "function": parse_percent(row[' Functions']),
                        "line": parse_percent(row[' Lines']),
                        "branch": parse_percent(row[' Branches']),
                    }
                    print(fuzzer_data)

                    pool = await get_db()
                    async with pool.acquire() as conn:
                        async with conn.cursor() as cur:
                            await cur.execute(""" 
                                INSERT INTO Report (UserName, Project, Region, Function, Line, Branch)
                                VALUES (%s, %s, %s, %s, %s, %s);
                            """, (user_name, project_name, fuzzer_data["region"], fuzzer_data["function"], fuzzer_data["line"], fuzzer_data["branch"]))
                            
                            await cur.execute(""" 
                                UPDATE Dashboard
                                SET Issue = %s, Risk_level = %s
                                WHERE UserName = %s AND Project = %s;
                            """, (0, "Low", user_name, project_name))
                    
                    # CSV 파일에서 퍼센트 값 처리

        response = {
            "userName": user_name,
            "projectName": project_name,
            **fuzzer_data
        }
        print("DB 업데이트 성공:", response)
        return response

    except Exception as e:
        print(f"CSV 파일 읽기 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"CSV 파일 읽기 실패: {str(e)}")

# 회원가입 API
@app.post("/signup/")
async def signup(username: str, password: str, email: str):
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(""" 
                INSERT INTO Users(username, email, hashed_password)
                VALUES (%s, %s, %s);
            """, (username, email, pwd_context.hash(password)))
        return {"message": "User created successfully"}
    
    except Exception as e:
        print(f"회원가입 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"중복되는 username 입니다.")
    

# 로그인 API
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    pool = await get_db()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(""" 
                SELECT hashed_password
                FROM Users
                WHERE username = %s;
            """, (form_data.username))
            
            result = await cur.fetchone()  # 하나의 결과를 가져옴
            if result:
                hashed_password = result[0]  # 튜플의 첫 번째 값이 해시된 비밀번호
            else:
                hashed_password = None

    # 결과가 없거나 비밀번호가 맞지 않을 때
    if not hashed_password or not pwd_context.verify(form_data.password, hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": form_data.username}, expires_delta=access_token_expires)
    
    return {"access_token": access_token, "token_type": "bearer"}

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_message(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 데이터베이스 변경 시 호출할 함수
async def notify_dashboard_update():
    await manager.send_message("Dashboard updated")

async def run_fuzzer(final_folder, container_name, user_name, project_name):
    try:
        await notify_dashboard_update()

        # Dockerfile 템플릿으로 이미지 빌드 후 
        container_generate = [
            f"docker create -it --name {container_name} prompt_fuzzer",
            f"docker start {container_name}",
            f"docker cp {final_folder}/build.sh {container_name}:/PromptFuzz/data/target_project",
            f"docker cp {final_folder}/config.yaml {container_name}:/PromptFuzz/data/target_project",
            f"docker cp {final_folder}/test/example_fuzzer.cpp {container_name}:/PromptFuzz/data/target_project",
            f"docker cp {final_folder}/test/makefile {container_name}:/PromptFuzz/data/target_project",
            f"docker cp {final_folder}/test/mbr.h {container_name}:/PromptFuzz/data/target_project",
            f"docker cp {final_folder}/mbr.c {container_name}:/PromptFuzz/data/target_project",
        ]
        # 각 명령어를 문자열로 처리하여 실행
        for cmd in container_generate:
            process = await asyncio.create_subprocess_shell(cmd)  # cmd는 문자열로 전달해야 함
            await process.wait()

        # Docker에서 명령어 실행
        commands = [
            "dos2unix /PromptFuzz/data/target_project/build.sh",
            "./build.sh",
            "timeout 30m cargo run --bin fuzzer -- target_project -c $(nproc) -r || true",
            "cargo run --bin harness -- target_project fuse-fuzzer",
            "cargo run --bin harness -- target_project fuzzer",
            "cargo run --bin harness -- target_project sanitize-crash",
            "cargo run --bin harness -- target_project coverage collect",
            "cargo run --bin harness -- target_project coverage report"
        ]

        # 각 명령어를 Docker 컨테이너 안에서 실행
        for cmd in commands:
            docker_exec_command = f"docker exec {container_name} /bin/bash -c \"cd /PromptFuzz/data/target_project && {cmd}\""
            process = await asyncio.create_subprocess_shell(docker_exec_command)
            await process.wait()

        # 결과 복사
        docker_cp_command = f"docker cp {container_name}:/prompt_fuzz/output/zlib/misc {final_folder}"
        process = await asyncio.create_subprocess_shell(docker_cp_command)  # 여기서도 수정
        await process.wait()

        # CSV 파일을 DB로 보내는 작업
        await parse_csv_and_send_to_db(final_folder, user_name, project_name)

        # 대시보드 업데이트
        await notify_dashboard_update()

    except subprocess.CalledProcessError as e:
        print(f"Error occurred: {e}")

# 파일 업로드 API
@app.post("/uploadfile/")
async def upload_file(
        project_name: str = Form(...),  # 프로젝트 이름 추가
        files: int = Form(...),  # 파일 개수 추가
        language: str = Form(...),  # 개발 언어 추가
        file: List[UploadFile] = File(...),  # 파일 업로드
        current_user: User = Depends(get_current_active_user),  # 현재 사용자 정보
        background_tasks: BackgroundTasks = BackgroundTasks()  # BackgroundTasks 의존성 추가
):
    print(file)
    # 파일 저장할 폴더 이름 생성 (유저 이름 + 프로젝트 이름)
    folder_name = f"{current_user.username}_{project_name}"
    final_folder = os.path.join(temp_upload_dir, folder_name)
    os.makedirs(final_folder, exist_ok=True)

    try:
        # 여러 파일을 저장하기 위한 반복문
        for uploaded_file in file:
            # upload_path를 각 파일에 대해 생성
            upload_path = os.path.join(final_folder, uploaded_file.filename)

            # 파일의 부모 디렉토리 경로 가져오기
            parent_directory = os.path.dirname(upload_path)

            # 부모 디렉토리가 존재하지 않으면 생성
            if not os.path.exists(parent_directory):
                os.makedirs(parent_directory)

            async with aiofiles.open(upload_path, 'wb') as buffer:
                while content := await uploaded_file.read(1024):  # 1024 byte씩 읽기
                    await buffer.write(content)

        # DB에 파일 개수와 언어 정보 저장
        pool = await get_db()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(""" 
                    INSERT INTO Dashboard (UserName, Project, Files, Language) 
                    VALUES (%s, %s, %s, %s);
                """, (current_user.username, project_name, files, language))
        
        dockerfile_path = f'{final_folder}/dockerfile'
        dockerfile_path = f'{final_folder}/dockerfile'
        output_compile_cmd_path = f'{final_folder}/compilecmd.txt'
        makefile_path = f'{final_folder}/test/makefile'
        output_dependencies_file = f'{final_folder}/dependencies.txt'
        output_env_path = f'{final_folder}/environment.txt'
        output_build_sh_path = f'{final_folder}/build.sh'
        output_build_conf_path = f'{final_folder}/config.yaml'

        create_build.create_buildsh_conf(output_dependencies_file, output_compile_cmd_path, output_env_path, dockerfile_path, makefile_path, output_build_sh_path, output_build_conf_path)
        
        # 퍼징을 백그라운드에서 실행하도록 등록
        background_tasks.add_task(run_fuzzer, final_folder, folder_name, current_user.username, project_name)
        
        return JSONResponse(content={"message": "파일 업로드가 완료되었습니다. 퍼징이 백그라운드에서 진행되고 있습니다."})

    except Exception as e:
        print(f"파일 저장 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail="파일 처리 중 오류 발생")

# 대시보드 응답 모델 정의
class Project(BaseModel):
    UserName: str
    Project: str
    Files: int
    Language: str
    Issue: int
    Risk_level: Optional[str]

class DashboardSummary(BaseModel):
    totalFiles: int
    totalIssues: int
    totalProjects: int

class DashboardResponse(BaseModel):
    summary: DashboardSummary
    projects: List[Project]

# 대시보드 API
@app.get("/dashboard/", response_model=DashboardResponse)
async def get_dashboard(
    page: int = Query(0, ge=0),  # 페이지 번호, 기본값 0
    current_user: User = Depends(get_current_active_user),  # 현재 사용자 정보
):
    try:
        username = current_user.username

        pool = await get_db()  # aiomysql 풀 사용
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:  # DictCursor로 결과를 딕셔너리로 받음
                # 요약 정보 조회
                summary_query = """
                    SELECT SUM(Files) AS totalFiles, SUM(COALESCE(Issue, 0)) AS totalIssues, COUNT(DISTINCT Project) AS totalProjects
                    FROM Dashboard
                    WHERE UserName = %s;
                """
                await cur.execute(summary_query, (username))  # 쿼리 실행
                summary = await cur.fetchone()  # 하나의 행을 가져옴

                if not summary:
                    raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

                                # None 값 처리: None인 경우 0으로 설정
                summary["totalFiles"] = summary["totalFiles"] if summary["totalFiles"] is not None else 0
                summary["totalIssues"] = summary["totalIssues"] if summary["totalIssues"] is not None else 0

                # 페이지네이션에 따른 프로젝트 조회
                offset = page * 6
                projects_query = """
                    SELECT UserName, Project, Files, Language, Issue, Risk_level
                    FROM Dashboard
                    WHERE UserName = %s
                    ORDER BY id
                    LIMIT 6 OFFSET %s;
                """
                await cur.execute(projects_query, (username, offset))  # 쿼리 실행
                projects = await cur.fetchall()  # 여러 행을 가져옴

        # 응답 데이터 포맷팅
        return {
            "summary": {
                "totalFiles": summary["totalFiles"],
                "totalIssues": summary["totalIssues"],
                "totalProjects": summary["totalProjects"]
            },
            "projects": projects  # 이미 DictCursor로 가져왔으므로 딕셔너리 형태로 반환됨
        }

    except Exception as e:
        print(f"데이터 조회 중 오류 발생: {e}")
        raise HTTPException(status_code=500, detail="데이터 조회 중 문제가 발생했습니다.")

# 응답 모델 정의
class ReportResponse(BaseModel):
    report: dict
    dashboard: dict

@app.get("/report", response_model=ReportResponse)
async def get_report(
    userName: str = Query(...),  # 필수 쿼리 파라미터
    projectName: str = Query(...)  # 필수 쿼리 파라미터
):
    try:
        pool = await get_db()  # aiomysql 풀 사용
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:  # DictCursor로 딕셔너리로 결과 받기

                # Report 테이블에서 Region, Function, Line, Branch 값 조회
                report_query = """
                    SELECT Region, Function, Line, Branch
                    FROM Report
                    WHERE Project = %s AND UserName = %s;
                """
                await cur.execute(report_query, (projectName, userName))
                report_data = await cur.fetchone()

                # Dashboard 테이블에서 Issue, Risk_level 값 조회
                dashboard_query = """
                    SELECT Issue, Risk_level
                    FROM Dashboard
                    WHERE Project = %s AND UserName = %s;
                """
                await cur.execute(dashboard_query, (projectName, userName))
                dashboard_data = await cur.fetchone()

                # 데이터가 없는 경우 404 에러 처리
                if not report_data or not dashboard_data:
                    raise HTTPException(status_code=404, detail="데이터를 찾을 수 없습니다.")

        # 필요한 데이터를 반환
        return {
            "report": report_data,
            "dashboard": dashboard_data
        }

    except Exception as e:
        print(f"데이터 조회 중 오류 발생: {e}")
        raise HTTPException(status_code=500, detail="데이터 조회 중 오류가 발생했습니다.")


# 서버 실행
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)