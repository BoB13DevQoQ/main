import React from 'react';
import './ResultPage.css';
import { FaDownload } from "react-icons/fa";

function ResultPage({ uploadInfo }) {
  const [codeString, setCodeString] = useState(''); // test_target_code.c 파일 내용
  const [log, setLog] = useState(''); // Docker 로그 저장

  useEffect(() => {
    // uploadInfo가 있고 파일들이 존재하는지 확인
    if (uploadInfo && uploadInfo.uploadInfo.directory && uploadInfo.uploadInfo.files) {
      // test_target_code.c 파일이 있는지 확인
      const testTargetFile = uploadInfo.uploadInfo.files.find(file => file === 'test_target_code.c');
      
      console.log("응답 수신 완료 : ", uploadInfo);

      if (testTargetFile) {
        // 파일 경로 설정
        const filePath = `${uploadInfo.uploadInfo.directory}/${testTargetFile}`;
        
        // 서버에서 파일 내용을 가져오는 fetch 호출
        fetch(`http://localhost:5000/file-content?path=${filePath}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error('네트워크 응답이 올바르지 않습니다.');
            }
            return response.text();
          })
          .then((data) => {
            console.log('파일 내용 가져오기 성공: ', data); // 가져온 파일 내용 로그로 출력
            setCodeString(data); // 파일 내용을 상태로 저장
          })
          .catch((error) => console.error("파일 내용을 불러오는 중 오류 발생:", error));
      } else {
        console.error('test_target_code.c 파일을 찾을 수 없습니다.');
      }

      // Docker 실행 로그 가져오기
      setLog(uploadInfo.uploadInfo.log || '로그가 없습니다.');
    }
  }, [uploadInfo]);

  return (
    <div className="result-page p-3">
      <h4>test_target_code.c 파일 내용</h4>
      <div className="code-container">
        {codeString ? (
          <pre>{codeString}</pre>
        ) : (
          <p>파일을 불러올 수 없습니다. 파일을 업로드하세요.</p>
        )}
      </div>

      <h4>Docker 컨테이너 로그</h4>
      <div className="log-container">
        <pre>{log}</pre> {/* Docker 실행 로그 표시 */}
      </div>
    </div>
  );
};

export default ResultPage;
