import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import Header from './components/Header';
import LoadingPage from './components/LoadingPage';
import ResultPage from './components/ResultPage';
import './App.css';

function App() {
  const [page, setPage] = useState('upload');
  const [uploadInfo, setUploadInfo] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(''); // 로딩 상태 관리
  const [errorMessage, setErrorMessage] = useState(null); // 에러 메시지 관리

  const handleUploadComplete = (info) => {
    setUploadInfo(info); // 업로드 정보 저장
    setLoadingStatus('파일 업로드 완료. 결과를 처리 중입니다...');
    setTimeout(() => setPage('result'), 3000); // 로딩 후 결과 페이지로 이동
  };

  const handleLoadingStart = () => {
    setLoadingStatus('파일 업로드 중...');
    setErrorMessage(null); // 에러 초기화
    setPage('loading'); // 로딩 페이지로 전환
  };

  const handleError = (error) => {
    setErrorMessage(error); // 에러 메시지 저장
    setPage('loading'); // 로딩 페이지에서 에러 메시지 표시
  };

  return (
    <div className="app d-flex">
      <Sidebar setPage={setPage} />
      <div className="main-content flex-grow-1">
        <Header />
        <div className="debug-buttons d-flex justify-content-center my-3">
          <button className="btn btn-secondary mx-2" onClick={() => setPage('upload')}>Upload Page</button>
          <button className="btn btn-secondary mx-2" onClick={() => setPage('loading')}>Loading Page</button>
          <button className="btn btn-secondary mx-2" onClick={() => setPage('result')}>Result Page</button>
        </div>

        {page === 'upload' && <FileUpload onUploadComplete={handleUploadComplete} setPage={setPage} onLoadingStart={handleLoadingStart} onError={handleError} />}
        {page === 'loading' && <LoadingPage status={loadingStatus} error={errorMessage} />}
        {page === 'result' && <ResultPage uploadInfo={uploadInfo} />}
      </div>
    </div>
  );
}

export default App;
