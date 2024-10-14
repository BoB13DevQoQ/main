import React, { useEffect } from 'react';
import { IoSettingsOutline } from "react-icons/io5";
import { FaRegBell, FaRegUserCircle } from "react-icons/fa";
import './Header.css';
import { useNavigate } from 'react-router-dom';

function Header({ userName, setUserName, setAccessToken}) {
  const navigate = useNavigate();

  // 로그인한 사용자 정보 로컬스토리지에서 가져오기
  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    const storedAccessToken = localStorage.getItem('accessToken');
    
    if (storedUserName && storedAccessToken) {
      setUserName(storedUserName);
      setAccessToken(storedAccessToken);
    }
  }, [setUserName, setAccessToken]);

  // 로그인 페이지 이동처리
  const loginHandler = () => {
    navigate('/signin');
  };

  // 로그아웃 처리
  const logoutHandler = () => {
    localStorage.removeItem('userName'); // 로컬스토리지에서 유저 정보 삭제
    setUserName(null); // 상태에서 유저 이름 제거

    localStorage.removeItem('accessToken'); // 로컬스토리지에서 토큰 삭제
    setAccessToken(null); // 상태에서 토큰 제거

    window.location.reload(); // 새로고침
  };

  return (
    <div className="header-container d-flex justify-content-between align-items-center mb-4 p-2">
      {/* User Section */}
      <div className="user-section d-flex align-items-center px-4 py-3 rounded-5">
        <FaRegUserCircle className="user-icon me-2 fs-3" />
        {userName ? (
          <>
            <span>{userName}</span>  {/* 유저 이름이 있을 때 표시 */}
            <button type="button" className="btn btn-logout ms-3" onClick={logoutHandler}>로그아웃</button>
          </>
        ) : (
          <button type="button" className="btn btn-login" onClick={loginHandler}>로그인 하기</button>
        )}
      </div>

      {/* Icon Section */}
      <div className="icon-section d-flex align-items-center gap-4 mx-5">
        <FaRegBell className="icon fs-1 text-dark mx-5" />
        <IoSettingsOutline className="icon fs-1 text-dark" />
      </div>
    </div>
  );
}

export default Header;
