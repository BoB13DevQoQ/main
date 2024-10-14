import React, { useState } from 'react';
import './Signin.css';
import { useNavigate } from 'react-router-dom';

const Signin = ({ setUserName, accessToken }) => {

  const [password, setPassword] = useState('');
  const [inputUserName, setInputUserName] = useState(''); // 입력된 Username 값을 임시로 저장

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // userName을 입력된 값으로 업데이트
    setUserName(inputUserName);

    const form_data = new URLSearchParams();
    form_data.append('username', inputUserName);
    form_data.append('password', password);

    console.log('UserName:', inputUserName);
    console.log('Password:', password);

    try {
      const response = await fetch(`http://localhost:8000/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form_data.toString(),
      });

      if (!response.ok) {
        throw new Error('로그인 실패');
      }
      
      const data = await response.json();

      console.log('Access Token:', data.access_token);

      localStorage.setItem('userName', inputUserName);
      localStorage.setItem('accessToken', data.access_token);

      navigate('/');
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      alert('존재하지 않는 Username 또는 Password 입니다!');
    }
  };

  return (
    <div className="container dashboard p-4 flex-grow-1 gap-3" style={{ maxWidth: '800px', marginTop: '200px' }}>
      <div className="form border rounded-3">
        <div className="custom-thead rounded-3 py-3 rounded-bottom-0">
          <h2 className="text-center">Sign in</h2>
        </div>
        <div className="container my-5" style={{ maxWidth: '500px' }}>
          <form onSubmit={handleSubmit}>

            <div className="form-group mb-5 row">
              <label className="fs-5 col text-center" htmlFor="userName">Username</label>
              <input
                type="text"
                className="form-control col"
                id="userName"
                placeholder="Enter username"
                value={inputUserName}
                onChange={(e) => setInputUserName(e.target.value)} // 실시간 업데이트는 inputUserName에만
                required
              />
            </div>

            <div className="form-group mb-5 row">
              <label className="fs-5 col text-center" htmlFor="password">Password</label>
              <input
                type="password"
                className="form-control col"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-center mt-4 mb-3">
              <button type="submit" className="btn signup-btn fs-4 rounded-5">
                Sign in
              </button>
            </div>

            <div className="form-group mb-5 row">
              <a className="fs-5 col text-center" href='/signup'>Sign up!</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signin;
