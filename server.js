const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
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

const upload = multer({ storage: storage });

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
app.post('/upload', upload.array('files', 2), async (req, res) => {
  console.log('업로드된 파일 정보:', req.files); // 파일 업로드 정보 로그

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
  }

  // 새 폴더 생성
  const token = Date.now().toString(); // 폴더 이름으로 사용
  const finalFolder = path.join(tempUploadDir, token);

  if (!fs.existsSync(finalFolder)) {
    fs.mkdirSync(finalFolder, { recursive: true }); // 새 폴더 생성
  }

  try {
    // 파일을 새 폴더로 이동
    const filePaths = await Promise.all(
      req.files.map(async (file) => {
        const oldPath = file.path; // 임시 저장된 경로
        const newPath = path.join(finalFolder, file.originalname); // 새 폴더 경로
        await moveFile(oldPath, newPath); // 파일 이동
        return newPath; // 이동한 후의 새 경로 반환
      })
    );

    // 파일 경로를 클라이언트로 반환
    res.json({ message: 'Files uploaded and moved successfully', paths: filePaths });
  } catch (error) {
    console.error('파일 이동 중 오류 발생:', error);
    res.status(500).json({ error: '파일 이동 중 오류가 발생했습니다.' });
  }
});

// 파일 내용 가져오기 라우트
app.get('/file-content', (req, res) => {
  const filePath = req.query.path; // 클라이언트에서 파일 경로를 쿼리로 전달받음
  console.log('파일 경로 요청:', filePath);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('파일 읽기 오류:', err);
      return res.status(500).send("파일을 읽는 중 오류가 발생했습니다.");
    }
    res.send(data); // 파일 내용을 텍스트로 반환
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
