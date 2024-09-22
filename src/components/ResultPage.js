import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ResultPage.css';

function ResultPage({ uploadInfo }) {
  const [fileContents, setFileContents] = React.useState([]);

  React.useEffect(() => {
    if (uploadInfo && uploadInfo.paths) {
      // 여러 파일을 순회하며 fetch 요청
      Promise.all(uploadInfo.paths.map(path => 
        fetch(`http://localhost:5000/file-content?path=${path}`)
          .then(response => response.text())
      )).then(contents => {
        setFileContents(contents);
      }).catch(error => console.error("파일 내용을 불러오는 중 오류 발생:", error));
    }
  }, [uploadInfo]);

  return (
    <div className="result-page p-3">
      <h4>Uploaded Files</h4>
      <div className="code-container">
        {fileContents.length > 0 ? (
          fileContents.map((content, index) => (
            <div key={index}>
              <h5>파일 {index + 1}</h5>
              <SyntaxHighlighter language="c" style={solarizedlight}>
                {content}
              </SyntaxHighlighter>
            </div>
          ))
        ) : (
          <p>파일이 없습니다. 파일을 업로드하세요.</p>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
