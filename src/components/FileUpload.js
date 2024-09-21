import React, { useState } from 'react';
import { FaFileUpload } from 'react-icons/fa';
import './FileUpload.css';

function FileUpload({ onUploadComplete, setPage }) { // setPage 추가
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("파일을 선택하세요!");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      onUploadComplete(data); // 업로드 완료 후 정보 전달

      setPage('result'); // ResultPage로 이동
    } catch (error) {
      console.error("파일 업로드 중 오류가 발생했습니다:", error);
    }
  };

  return (
    <div className="file-upload d-flex flex-column align-items-center justify-content-center">
      <FaFileUpload size={100} className="mb-3" />
      <input type="file" onChange={handleFileChange} />
      <button className="btn btn-primary mt-3" onClick={handleFileUpload}>파일 업로드</button>
    </div>
  );
}

export default FileUpload;
