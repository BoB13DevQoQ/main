import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import Header from './components/Header';
import ResultPage from './components/ResultPage';
import Dashboard from './components/Dashboard';
import Signup from './components/Signup';
import Signin from './components/Signin';

import './App.css';

function App() {
  const [userName, setUserName] = useState(''); // 유저 이름을 관리할 상태
  const [projectName, setprojectName] = useState(''); // 유저 이름을 관리할 상태
  const [accessToken, setAccessToken] = useState('');

  return (
    <div className="app d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        {/* Header 컴포넌트에 userName과 setUserName 전달 */}
        <Header userName={userName} setUserName={setUserName} setAccessToken={setAccessToken}/> 

        {/* Dashboard 컴포넌트로 userName 전달 */}
        <Routes>
          <Route path="/" element={<Dashboard userName={userName} setprojectName={setprojectName}/>} />
          <Route path="/signup" element={<Signup/> }/>
          <Route path="/signin" element={<Signin setUserName={setUserName} accessToken={accessToken}/> }/>
          <Route path="/upload" element={<FileUpload userName={userName}/>} />
          <Route path="/result" element={<ResultPage userName={userName} projectName={projectName}/>} />
        </Routes>
      </div>
    </div>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;
