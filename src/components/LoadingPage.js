// src/components/LoadingPage.js
import React from 'react';
import { Spinner } from 'react-bootstrap';
import './LoadingPage.css'; // 스타일을 위해 별도 CSS 파일 생성

function LoadingPage() {
  return (
    <div className="loading-page d-flex flex-column align-items-center justify-content-center">
      <Spinner animation="border" role="status" className="mb-3" />
      <p>Test Code Generating ...</p>
    </div>
  );
}

export default LoadingPage;
