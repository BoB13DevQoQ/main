import React, { useState } from 'react';
import './Signup.css';
import { useNavigate } from 'react-router-dom';

const Signup = () => {

  
  const [email, setEmail] = useState('');
  const [inputUserName, setInputUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    console.log('UserName:', inputUserName);
    console.log('Email:', email);
    console.log('Password:', password);

    try {
      const response = await fetch(`http://localhost:8000/signup/?username=${inputUserName}&password=${password}&email=${email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('회원가입 실패');
      }

      alert('로그인 하세요!');

      navigate('/signin');
    } catch (error) {
      console.error('회원가입 중 오류 발생:', error);
    }
  };

  return (
    <div className="container dashboard p-4 flex-grow-1 gap-3" style={{ maxWidth: '800px', marginTop: '200px' }}>
      <div className="form border rounded-3">
        <div className="custom-thead rounded-3 py-3 rounded-bottom-0">
          <h2 className="text-center">Sign up</h2>
        </div>
        <div className="container my-5" style={{ maxWidth: '500px' }}>
          <form onSubmit={handleSubmit}>

            <div className="form-group mb-5 row">
              <label className="fs-5 col text-center" htmlFor="email">Email address</label>
              <input
                type="email"
                className="form-control col"
                id="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-5 row">
              <label className="fs-5 col text-center" htmlFor="userName">Username</label>
              <input
                type="text"
                className="form-control col"
                id="userName"
                placeholder="Enter username"
                value={inputUserName}
                onChange={(e) => setInputUserName(e.target.value)}
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

            <div className="form-group mb-5 row">
              <label className="fs-5 col text-center" htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                className="form-control col"
                id="confirmPassword"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-center mt-4">
              <button type="submit" className="btn signup-btn fs-4 rounded-5">
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
