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

  const handleUploadComplete = (info) => {
    setUploadInfo(info); // 업로드 정보 저장
    setPage('result'); // 업로드 완료 시 바로 ResultPage로 전환
  };

  return (
    <div className="app d-flex">
      <Sidebar />
      <div className="main-content flex-grow-1">
        <Header />
        <div className="debug-buttons d-flex justify-content-center my-3">
          <button className="btn btn-secondary mx-2" onClick={() => setPage('upload')}>Upload Page</button>
          <button className="btn btn-secondary mx-2" onClick={() => setPage('loading')}>Loading Page</button>
          <button className="btn btn-secondary mx-2" onClick={() => setPage('result')}>Result Page</button>
        </div>
        
        {page === 'upload' && <FileUpload onUploadComplete={handleUploadComplete} setPage={setPage} />} {/* setPage 추가 */}
        {page === 'loading' && <LoadingPage />}
        {page === 'result' && <ResultPage uploadInfo={uploadInfo} />}
      </div>
    </div>
  );
}

export default App;
