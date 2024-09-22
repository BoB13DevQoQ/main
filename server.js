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

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const token = Date.now().toString(); // 현재 시간을 토큰으로 사용
    const userDir = path.join(uploadDir, token);

    // 토큰 이름으로 폴더 생성
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir); // 파일 저장 경로
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
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
  }
  res.json({ message: 'File uploaded successfully', path: req.file.path });
});

// 파일 내용 가져오기 라우트
app.get('/file-content', (req, res) => {
  const filePath = req.query.path; // 클라이언트에서 파일 경로를 쿼리로 전달받음

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send("파일을 읽는 중 오류가 발생했습니다.");
    }
    res.send(data); // 파일 내용을 텍스트로 반환
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
