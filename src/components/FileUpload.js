import React, { useState } from 'react';
import './FileUpload.css';

function FileUpload({ onUploadComplete, setPage }) {
  const [dockerfile, setDockerfile] = useState(null);
  const [mainCFile, setMainCFile] = useState(null);
  const [dockerfileContent, setDockerfileContent] = useState('');
  const [mainCFileContent, setMainCFileContent] = useState('');

  // 파일 선택 처리
  const handleDockerfileChange = (event) => {
    const file = event.target.files[0];
    setDockerfile(file);
    readFileContent(file, setDockerfileContent); // Dockerfile 내용을 읽어서 출력
  };

  const handleMainCChange = (event) => {
    const file = event.target.files[0];
    setMainCFile(file);
    readFileContent(file, setMainCFileContent); // main.c 내용을 읽어서 출력
  };

  // 파일 내용을 읽어서 state에 저장
  const readFileContent = (file, setContent) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setContent(e.target.result); // 파일 내용 저장
    };
    reader.readAsText(file);
  };

  // 파일 업로드 처리
  const handleFileUpload = async () => {
    // 두 개의 파일이 모두 선택되었는지 확인
    if (!dockerfile || !mainCFile) {
      alert("Dockerfile과 main.c 두 개의 파일을 업로드해야 합니다.");
      return;
    }

    const formData = new FormData();
    formData.append('files', dockerfile, 'Dockerfile'); // Dockerfile 명시적으로 추가
    formData.append('files', mainCFile, 'main.c');      // main.c 명시적으로 추가

    // FormData 내용 확인
    for (let pair of formData.entries()) {
      console.log(pair[0] + ', ' + pair[1]);
    }

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        onUploadComplete(data); // 업로드 완료 후 정보 전달
        setPage('result'); // ResultPage로 이동
      } else {
        alert(`업로드 중 오류가 발생했습니다: ${data.error}`);
      }
    } catch (error) {
      console.error("파일 업로드 중 오류가 발생했습니다:", error);
    }
  };

  return (
    <div className="file-upload-container">
      <h3>파일 업로드</h3>
      <div className="file-upload-section">
        <label htmlFor="dockerfile">Dockerfile 업로드</label>
        <input
          type="file"
          id="dockerfile"
          onChange={handleDockerfileChange}
        />
        {dockerfileContent && (
          <div className="code-block">
            <h4>Dockerfile 내용:</h4>
            <pre>{dockerfileContent}</pre>
          </div>
        )}
      </div>

      <div className="file-upload-section">
        <label htmlFor="mainC">소스 코드 (main.c) 업로드</label>
        <input
          type="file"
          id="mainC"
          onChange={handleMainCChange}
        />
        {mainCFileContent && (
          <div className="code-block">
            <h4>main.c 파일 내용:</h4>
            <pre>{mainCFileContent}</pre>
          </div>
        )}
      </div>

      <button className="btn btn-primary mt-3" onClick={handleFileUpload}>파일 업로드</button>
    </div>
  );
}

export default FileUpload;
