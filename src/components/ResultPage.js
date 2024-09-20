// src/components/ResultPage.js
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ResultPage.css'; // 스타일을 위해 별도 CSS 파일 생성

function ResultPage() {
  const codeString = `#include <module1.h>
#include <module2.h>
#include <assert.h>
#include <stdio.h>

void test_divide_numbers() {
    assert(divide_numbers(10, 2) == 5); // 예제 테스트
    assert(divide_numbers(6, 3) == 2);  // 예제 테스트

    printf("All test cases passed.\\n");
}

int main() {
    test_divide_numbers();
    return 0;
}`;

  return (
    <div className="result-page p-3">
      <h4>Test code example</h4>
      <div className="code-container">
        <SyntaxHighlighter language="c" style={solarizedlight}>
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default ResultPage;
