프론트 서버 실행
```
npm install multer react-scripts react-chartjs-2 react-router-dom mysql2 @babel/preset-env @babel/core babel-loader --save-dev
npm start dev
```

백엔드 서버 실행
```
pip install python-jose passlib aiomysql bcrypt==3.2.0 aiofiles python-multipart asyncpg fastapi uvicorn websockets
uvicorn app:app
```

DB 서버 구축
```
Docker-compose.yaml에서 계정 정보 설정

docker-compose up

CREATE TABLE IF NOT EXISTS Users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 username VARCHAR(50) UNIQUE NOT NULL,
 email VARCHAR(100) UNIQUE NOT NULL,
 hashed_password VARCHAR(255) NOT NULL,
 disabled BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Report (
 id INT AUTO_INCREMENT PRIMARY KEY,
 UserName VARCHAR(50),
 Project VARCHAR(255) NOT NULL,
 Region INT,
 Function INT,
 Line INT,
 Branch INT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (UserName) REFERENCES Users(username)
);

CREATE TABLE IF NOT EXISTS Dashboard(
 id INT AUTO_INCREMENT PRIMARY KEY,
 UserName VARCHAR(50),
 Project VARCHAR(255) NOT NULL,
 Files INT,
 Language VARCHAR(100),
 Issue INT DEFAULT '0',
 Risk_level VARCHAR(6) DEFAULT 'N/A',
 FOREIGN KEY (UserName) REFERENCES Users(username)
);
```
