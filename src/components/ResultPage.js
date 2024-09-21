import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ResultPage.css';

function ResultPage({ uploadInfo }) {
  // 업로드된 파일 경로가 있을 경우 서버에서 내용을 가져오는 로직
  const [codeString, setCodeString] = React.useState('');

  React.useEffect(() => {
    if (uploadInfo && uploadInfo.path) {
      // 서버에서 업로드된 파일의 내용을 fetch로 가져옴
      fetch(`http://localhost:5000/file-content?path=${uploadInfo.path}`)
        .then((response) => response.text())
        .then((data) => setCodeString(data))
        .catch((error) => console.error("파일 내용을 불러오는 중 오류 발생:", error));
    }
  }, [uploadInfo]);

  return (
    <div className="result-page p-3">
      <h4>Uploaded File Code</h4>
      <div className="code-container">
        {codeString ? (
          <SyntaxHighlighter language="c" style={solarizedlight}>
            {codeString}
          </SyntaxHighlighter>
        ) : (
          <p>파일이 없습니다. 파일을 업로드하세요.</p>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
