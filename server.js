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

// 파일을 저장할 기본 디렉터리 (임시 저장 경로)
const tempUploadDir = path.join(__dirname, 'uploads');

// 파일 저장 설정 (임시 폴더에 저장)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // uploads 폴더가 없으면 생성
    if (!fs.existsSync(tempUploadDir)) {
      fs.mkdirSync(tempUploadDir, { recursive: true });
    }
    cb(null, tempUploadDir); // 임시 저장 경로
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // 원본 파일명으로 저장
  }
});

const upload = multer({
  storage: storage
}).any(); // 모든 파일을 받기 위한 설정

// 파일을 이동시키는 함수
const moveFile = (oldPath, newPath) => {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// 파일 업로드 라우트 (임시로 저장 후 새 폴더로 이동)
app.post('/upload', (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: '파일 업로드 오류가 발생했습니다.' });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    // 필수 파일 검사 (Dockerfile과 test_target_code.c)
    const dockerfile = files.find(file => file.originalname.toLowerCase() === 'dockerfile');
    const mainCFile = files.find(file => file.originalname.toLowerCase() === 'test_target_code.c');

    if (!dockerfile || !mainCFile) {
      return res.status(400).json({ error: 'Dockerfile과 test_target_code.c 파일이 필요합니다.' });
    }

    // 새 폴더 생성
    const token = new Date().toISOString().replace(/:/g, '-'); // 폴더 이름으로 사용
    const finalFolder = path.join(tempUploadDir, token);

    if (!fs.existsSync(finalFolder)) {
      fs.mkdirSync(finalFolder, { recursive: true }); // 새 폴더 생성
    }

    try {
      // 파일을 새 폴더로 이동
      await Promise.all(
        files.map(async (file) => {
          const oldPath = file.path; // 임시 저장된 경로
          const newPath = path.join(finalFolder, file.originalname); // 새 폴더 경로
          await moveFile(oldPath, newPath); // 파일 이동
        })
      );

      console.log(`업로드된 파일이 ${finalFolder}에 저장되었습니다.`);

      // Dockerfile을 통한 Docker 빌드 및 실행
      const containerName = `container_${new Date().toISOString().replace(/[:.]/g, '-').toLowerCase()}`;
      const dockerBuildCommand = `docker build -t ${containerName}_image ${finalFolder}`;
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
        
          const containerId = runStdout.trim(); // 컨테이너 ID 저장
          console.log(`컨테이너 실행 성공: ${containerId}`);
        
          // 실행된 컨테이너의 로그 가져오기
          const dockerLogsCommand = `docker logs ${containerId}`;
          exec(dockerLogsCommand, (logsErr, logsStdout, logsStderr) => {
            if (logsErr) {
              return res.status(500).json({ error: '컨테이너 로그를 가져오는 중 오류가 발생했습니다.', log: logsStderr });
            }
        
            // 파일 경로와 컨테이너 로그를 클라이언트로 전달
            const uploadInfo = {
              directory: finalFolder,
              files: files.map(file => file.originalname), // 업로드된 파일들의 이름 리스트
              log: logsStdout // 실제 Docker 컨테이너 로그
            };
        
            res.json({ message: '컨테이너가 성공적으로 실행되었습니다.', uploadInfo: uploadInfo });
          });
        });
      });
    } catch (error) {
      console.error('파일 이동 중 오류 발생:', error);
      res.status(500).json({ error: '파일 이동 중 오류가 발생했습니다.' });
    }
  });
});

// 파일 내용을 가져오는 라우트 추가
app.get('/file-content', (req, res) => {
  const filePath = req.query.path;

  console.log("파일 경로 수신: ", filePath); // 파일 경로 로그

  if (!filePath) {
    return res.status(400).json({ error: '파일 경로가 필요합니다.' });
  }

  // 파일 내용 읽기
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('파일 읽기 오류:', err);
      return res.status(500).json({ error: '파일을 읽는 중 오류가 발생했습니다.' });
    }

    console.log("파일 내용 전송: ", data); // 파일 내용 로그로 출력
    res.send(data);
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
