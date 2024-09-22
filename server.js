const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 5000;
const cors = require('cors');

// CORS 설정
app.use(cors());

// 파일을 저장할 기본 디렉터리
const uploadDir = path.join(__dirname, 'uploads');

// 파일 저장 설정 (날짜 기반 폴더 사용)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadDir, new Date().toISOString().replace(/:/g, '-'));
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir); // 파일 저장 경로 반환
  },
  filename: (req, file, cb) => {
    console.log(`파일 업로드 중: ${file.originalname}`);
    cb(null, file.originalname); // 원본 파일명으로 저장
  }
});

// 두 개의 파일을 동시에 처리하도록 설정
const upload = multer({
  storage: storage,
  limits: { files: 2 }, // 파일 개수를 2개로 제한 (Dockerfile과 main.c)
}).array('files', 2); // 최대 두 개의 파일을 허용

// 파일 업로드 라우트
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: '파일 업로드 오류: 두 개의 파일만 업로드 가능합니다.' });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    const userDir = path.dirname(req.files[0].path); // 파일이 저장된 폴더 경로 추출
    const uploadedFiles = fs.readdirSync(userDir);   // 업로드된 파일 목록 확인

    console.log(`업로드된 파일 경로: ${userDir}`);
    console.log(`업로드된 파일 목록:`, uploadedFiles); // 업로드된 파일 확인을 위한 로그 출력

    // 파일 이름 검사 (대소문자 구분 없이 검사)
    const dockerfileExists = uploadedFiles.some(file => file.toLowerCase() === 'dockerfile');
    const mainCExists = uploadedFiles.some(file => file.toLowerCase() === 'main.c');

    if (!dockerfileExists || !mainCExists) {
      return res.status(400).json({ error: 'Dockerfile과 main.c 파일이 필요합니다.' });
    }

    // Dockerfile을 통한 Docker 빌드 및 실행
    const containerName = `container_${new Date().toISOString().replace(/[:.]/g, '-').toLowerCase()}`;
    const dockerBuildCommand = `docker build -t ${containerName}_image ${userDir}`;
    const dockerRunCommand = `docker run -d --name ${containerName} ${containerName}_image`;

    exec(dockerBuildCommand, (buildErr, buildStdout, buildStderr) => {
      if (buildErr) {
        console.error(`Docker 이미지 빌드 중 오류 발생: ${buildErr}`);
        return res.status(500).json({ error: 'Docker 이미지 빌드 중 오류가 발생했습니다.', log: buildStderr });
      }
      exec(dockerRunCommand, (runErr, runStdout, runStderr) => {
        if (runErr) {
          return res.status(500).json({ error: 'Docker 컨테이너 실행 중 오류가 발생했습니다.', log: runStderr });
        }
        res.json({ message: '컨테이너가 성공적으로 실행되었습니다.', log: runStdout });
      });
    });
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
