// src/App.js
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import Header from './components/Header';
import LoadingPage from './components/LoadingPage';
import ResultPage from './components/ResultPage';
import './App.css'; 

function App() {
  const [page, setPage] = useState('upload');

  const handleUploadComplete = () => {
    setPage('loading');
    setTimeout(() => {
      setPage('result');
    }, 3000);
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
        
        {page === 'upload' && <FileUpload onUploadComplete={handleUploadComplete} />}
        {page === 'loading' && <LoadingPage />}
        {page === 'result' && <ResultPage />}
      </div>
    </div>
  );
}

export default App;
