import React, { useState } from 'react';
import './FileUpload.css';
import { FaCheck } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const FileUpload = ({ userName }) => {
  const [dockerfile, setDockerFileUploaded] = useState(null);
  const [targetcode, setTargetCodeUploaded] = useState(null);
  const [buildFiles, setBuildFilesUploaded] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [fileInfo, setFileInfo] = useState({
    dockerfile: { codes: "-", language: "-", size: "-" },
    targetCode: { codes: "-", language: "-", size: "-" },
    buildFiles: { codes: "-", language: "-", size: "-" }
  });

  const navigate = useNavigate();

  const getLanguageByExtension = (extension) => {
    const languageMap = {
      '.c': 'C',
      '.cpp': 'C++',
      '.py': 'Python',
      '.java': 'Java',
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.go': 'Go',
      '.rs': 'Rust',
    };
    return languageMap[extension] || 'Unknown';
  };

  const formatFileSize = (size) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  const handleFileUpload = (fileType) => async (event) => {
    const files = event.target.files;
    let totalSize = 0;
    let codesCount = 0;
    let languages = new Set();

    Array.from(files).forEach((file) => {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const language = getLanguageByExtension(extension);
      languages.add(language);
      codesCount++;
      totalSize += file.size;
    });

    const fileSizeFormatted = formatFileSize(totalSize);
    const languageString = Array.from(languages).join(', ');

    if (fileType === 'dockerfile') {
      setFileInfo(prev => ({
        ...prev,
        dockerfile: {
          codes: codesCount,
          language: languageString,
          size: fileSizeFormatted
        }
      }));
      setDockerFileUploaded(event.target.files[0]);
    } 
    else if (fileType === 'targetCode') {
      setFileInfo(prev => ({
        ...prev,
        targetCode: {
          codes: codesCount,
          language: languageString,
          size: fileSizeFormatted
        }
      }));
      setTargetCodeUploaded(event.target.files[0]);
    } 
    else if (fileType === 'buildFiles') {
      setFileInfo(prev => ({
        ...prev,
        buildFiles: {
          codes: codesCount,
          language: languageString,
          size: fileSizeFormatted
        }
      }));
      setBuildFilesUploaded(Array.from(files));   // 폴더에서 가져온 파일들 설정
    }
  };

  const handleStartFuzzer = async () => {
    if (!dockerfile || !targetcode || !projectName) {
      alert('Dockerfile, Target Code, 그리고 Project Name은 필수입니다.');
      return;
    }
    
    navigate("/");

    // 파일 개수 및 언어 처리
    let totalFiles = fileInfo.dockerfile.codes + fileInfo.targetCode.codes;
    let allLanguages = new Set();
    allLanguages.add(fileInfo.dockerfile.language);
    allLanguages.add(fileInfo.targetCode.language);
  
    if (buildFiles.length > 0) {
      totalFiles += fileInfo.buildFiles.codes;
      allLanguages.add(fileInfo.buildFiles.language);
    }
  
    // 중복 제거된 언어 리스트
    const languageString = Array.from(allLanguages).join(', ');
  
    // FormData를 통해 실제 파일 업로드
    const formData = new FormData();
    if (dockerfile) formData.append('file', dockerfile); // 'file' 필드에 dockerfile 추가
    if (targetcode) formData.append('file', targetcode); // 'file' 필드에 targetCode 추가

    buildFiles.forEach(file => formData.append('file', file)); // 'file' 필드에 buildFiles 추가
    console.log('Build files:', buildFiles); // buildFiles 상태 확인


    // 사용자 이름과 프로젝트 이름 추가
    formData.append('project_name', projectName);
    formData.append('files', totalFiles);
    formData.append('language', languageString);
    
    console.log(formData);

    // 파일 업로드 요청
    try {
      const response = await fetch('http://localhost:8000/uploadfile/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // 토큰 헤더 추가
        },
        body: formData, // FormData를 body로 설정
      });
  
      if (!response.ok) throw new Error('Fuzzer 시작 실패');
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error('Fuzzer 시작 오류:', error);
    }
  };
  
  

  return (
    <div className="dashboard p-4 flex-grow-1 gap-3">
      <div className="row align-items-center mb-3">
        <h2 className="col-6">File Upload</h2>
        <div className="input-section d-flex align-items-center px-4 py-3 rounded-5 col mx-5">
          <p className="mb-0 me-2 fs-5 text-white">Project Name:</p>
          <input 
            type="text" 
            className="form-control rounded-2" 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)} // 프로젝트 이름 설정
          />
        </div>
      </div>

      <table className="table table-striped border rounded-3 rounded-bottom-0">
        <thead className="custom-thead bg-light rounded-3 py-3">
          <tr>
            <th className="text-center py-3 fs-5">Required files</th>
            <th className="text-center py-3 fs-5">Files</th>
            <th className="text-center py-3 fs-5">Language</th>
            <th className="text-center py-3 fs-5">Size</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-bottom">
            <td className="text-center py-3 fs-5">Dockerfile</td>
            <td className="text-center py-3 fs-5">{fileInfo.dockerfile.codes}</td>
            <td className="text-center py-3 fs-5">{fileInfo.dockerfile.language}</td>
            <td className="text-center py-3 fs-5">{fileInfo.dockerfile.size}</td>
            <td className="text-center py-3 fs-5">
              {dockerfile ? (
                <button className="btn btn-success btn-sm rounded-4">
                  <FaCheck />
                </button>
              ) : (
                <>
                  <input
                    type="file"
                    id="dockerfile-upload"
                    onChange={handleFileUpload('dockerfile')}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="dockerfile-upload" className="btn btn-secondary btn-sm rounded-4">Upload</label>
                </>
              )}
            </td>
          </tr>
          <tr className="border-bottom">
            <td className="text-center py-3 fs-5">Target Code</td>
            <td className="text-center py-3 fs-5">{fileInfo.targetCode.codes}</td>
            <td className="text-center py-3 fs-5">{fileInfo.targetCode.language}</td>
            <td className="text-center py-3 fs-5">{fileInfo.targetCode.size}</td>
            <td className="text-center py-3 fs-5">
              {targetcode ? (
                <button className="btn btn-success btn-sm rounded-4">
                  <FaCheck />
                </button>
              ) : (
                <>
                  <input
                    type="file"
                    id="targetcode-upload"
                    onChange={handleFileUpload('targetCode')}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="targetcode-upload" className="btn btn-secondary btn-sm rounded-4">Upload</label>
                </>
              )}
            </td>
          </tr>
          <tr className="border-bottom">
            <td className="text-center py-3 fs-5">Build Files (Optional)</td>
            <td className="text-center py-3 fs-5">{fileInfo.buildFiles.codes}</td>
            <td className="text-center py-3 fs-5">{fileInfo.buildFiles.language}</td>
            <td className="text-center py-3 fs-5">{fileInfo.buildFiles.size}</td>
            <td className="text-center py-3 fs-5">
              {buildFiles.length > 0 ? (
                <button className="btn btn-success btn-sm rounded-4">
                  <FaCheck />
                </button>
              ) : (
                <>
                  <input
                    type="file"
                    id="buildfiles-upload"
                    onChange={handleFileUpload('buildFiles')}
                    webkitdirectory="true"  // 폴더 선택 가능
                    directory="" // 폴더 선택
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="buildfiles-upload" className="btn btn-secondary btn-sm rounded-4">Upload</label>
                </>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="d-flex justify-content-center mt-4">
        <button className="btn start-fuzzer-btn fs-3 rounded-5" onClick={handleStartFuzzer}>
          Start Fuzzer
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
