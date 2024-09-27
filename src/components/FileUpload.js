import React, { useState } from 'react';
import './FileUpload.css';

function FileUpload({ onUploadComplete, setPage }) {
  const [dockerfile, setDockerfile] = useState(null);
  const [mainCFile, setMainCFile] = useState(null);
  const [otherFiles, setOtherFiles] = useState([]);
  const [dockerfileContent, setDockerfileContent] = useState('');
  const [mainCFileContent, setMainCFileContent] = useState('');
  const [uploadedItems, setUploadedItems] = useState([]); // 업로드된 폴더와 파일 목록

  // Dockerfile 선택 처리
  const handleDockerfileChange = (event) => {
    const file = event.target.files[0];
    setDockerfile(file);
    readFileContent(file, setDockerfileContent); // Dockerfile 내용을 읽어서 출력
  };

  // main.c 파일 선택 처리
  const handleMainCChange = (event) => {
    const file = event.target.files[0];
    setMainCFile(file);
    readFileContent(file, setMainCFileContent); // test_target_code.c 내용을 읽어서 출력
  };

  // 빌드에 필요한 파일들 선택 처리
  const handleOtherFilesChange = (event) => {
    const files = Array.from(event.target.files); // 여러 파일을 배열로 저장
    setOtherFiles(files);

    // 업로드된 파일과 폴더 경로를 평면 구조로 저장
    const fileList = files.map(file => file.webkitRelativePath || file.name);
    setUploadedItems(fileList); // 업로드된 파일 경로 저장
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
    // Dockerfile과 test_target_code.c 파일이 선택되었는지 확인
    if (!dockerfile || !mainCFile) {
      alert("Dockerfile과 test_target_code.c 두 개의 파일을 업로드해야 합니다.");
      return;
    }

    const formData = new FormData();
    formData.append('files', dockerfile, 'Dockerfile'); // Dockerfile 명시적으로 추가
    formData.append('files', mainCFile, 'test_target_code.c'); // test_target_code.c 명시적으로 추가

    // 빌드에 필요한 추가 파일들을 FormData에 추가
    otherFiles.forEach((file) => {
      formData.append('files', file, file.webkitRelativePath || file.name); // 각 파일의 경로와 함께 FormData에 추가
    });

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

      {/* Dockerfile 업로드 */}
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

      {/* main.c 업로드 */}
      <div className="file-upload-section">
        <label htmlFor="mainC">소스 코드 (test_target_code.c) 업로드</label>
        <input
          type="file"
          id="mainC"
          onChange={handleMainCChange}
        />
        {mainCFileContent && (
          <div className="code-block">
            <h4>test_target_code.c 파일 내용:</h4>
            <pre>{mainCFileContent}</pre>
          </div>
        )}
      </div>

      {/* 빌드에 필요한 다른 파일들 업로드 */}
      <div className="file-upload-section">
        <label htmlFor="otherFiles">빌드에 필요한 소스 코드 및 폴더 업로드</label>
        <input
          type="file"
          id="otherFiles"
          multiple
          webkitdirectory="" // 폴더 업로드를 허용
          onChange={handleOtherFilesChange}
        />
        {uploadedItems.length > 0 && (
          <div className="code-block">
            <h4>업로드된 파일 및 폴더 목록:</h4>
            <ul>
              {uploadedItems.map((item, index) => (
                <li key={index}>{item}</li> // 파일/폴더 경로 출력
              ))}
            </ul>
          </div>
        )}
      </div>

      <button className="btn btn-primary mt-3" onClick={handleFileUpload}>파일 업로드</button>
    </div>
  );
}

export default FileUpload;
