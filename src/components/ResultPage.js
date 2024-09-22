import React, { useState, useEffect } from 'react';
import './ResultPage.css';

function ResultPage({ uploadInfo }) {
  const [codeString, setCodeString] = useState('');
  const [log, setLog] = useState(''); // Docker 로그 저장

  useEffect(() => {
    if (uploadInfo && uploadInfo.files) {
      // 서버에서 업로드된 파일의 내용을 fetch로 가져옴
      const filePath = `${uploadInfo.directory}/${uploadInfo.files[0]}`; // 첫 번째 파일 경로 가져오기
      fetch(`http://localhost:5000/file-content?path=${filePath}`)
        .then((response) => response.text())
        .then((data) => setCodeString(data))
        .catch((error) => console.error("파일 내용을 불러오는 중 오류 발생:", error));

      // Docker 실행 로그 가져오기
      setLog(uploadInfo.log);
    }
  }, [uploadInfo]);

  return (
    <div className="result-page p-3">
      <h4>Uploaded File Code</h4>
      <div className="code-container">
        {codeString ? (
          <pre>{codeString}</pre>
        ) : (
          <p>파일을 불러올 수 없습니다. 파일을 업로드하세요.</p>
        )}
      </div>

      <h4>Docker Container Log</h4>
      <div className="log-container">
        <pre>{log}</pre> {/* Docker 실행 로그 표시 */}
      </div>
    </div>
  );
}

export default ResultPage;
