// src/components/FileUpload.js
import React from 'react';
import { FaFileUpload } from 'react-icons/fa';
import './FileUpload.css'; // 스타일을 위해 별도 CSS 파일 생성

function FileUpload() {
  return (
    <div className="file-upload d-flex flex-column align-items-center justify-content-center">
      <FaFileUpload size={100} className="mb-3" />
      <p>Upload your file!</p>
    </div>
  );
}

export default FileUpload;
