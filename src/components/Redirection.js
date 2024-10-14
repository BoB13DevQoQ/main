import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Redirection() {
  const REST_API_KEY = '7391e3ed9a02c22205b4b365de48fbbf'; // 카카오 REST API 키
  const REDIRECT_URI = 'http://localhost:3000/kakao/login'; // 리디렉션 URI
  const CLIENT_SECRET = 'your_client_secret'; // 만약 클라이언트 시크릿이 필요하다면 입력
  const navigate = useNavigate();

  useEffect(() => {
    // URL에서 Authorization Code 추출
    const code = new URL(window.location.href).searchParams.get('code');

    // 카카오로 Authorization Code를 이용해 Access Token 요청
    const getToken = async () => {
      try {
        const tokenResponse = await fetch(
          `https://kauth.kakao.com/oauth/token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=authorization_code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&code=${code}&client_secret=${CLIENT_SECRET}`
          }
        );
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Access Token으로 카카오 사용자 정보 요청
        const userResponse = await fetch(`https://kapi.kakao.com/v2/user/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        const userData = await userResponse.json();
        const userName = userData.kakao_account.profile.nickname;

        // 로컬스토리지에 유저 이름 저장
        localStorage.setItem('userName', userName);

        // 로그인 성공 후 대시보드로 이동
        navigate('/');
      } catch (error) {
        console.error('Error during authentication:', error);
      }
    };

    getToken();
  }, [navigate]);

  return <div>카카오 로그인 중...</div>;
}

export default Redirection;
