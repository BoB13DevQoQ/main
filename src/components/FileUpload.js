import React, { useState } from 'react';
import { FaFileUpload } from 'react-icons/fa';
import './FileUpload.css';

function FileUpload({ onUploadComplete, setPage }) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files); // 여러 파일 선택
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("파일을 선택하세요!");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]); // 여러 파일 추가
    }

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('업로드 완료 응답:', data); // 응답 데이터 로그
      onUploadComplete(data); // 업로드 완료 후 정보 전달
      setPage('result'); // ResultPage로 이동
    } catch (error) {
      console.error("파일 업로드 중 오류가 발생했습니다:", error);
    }
  };

  return (
    <div className="file-upload d-flex flex-column align-items-center justify-content-center">
      <FaFileUpload size={100} className="mb-3" />
      <input type="file" multiple onChange={handleFileChange} /> {/* multiple 추가 */}
      <button className="btn btn-primary mt-3" onClick={handleFileUpload}>파일 업로드</button>
    </div>
  );
}

export default FileUpload;
