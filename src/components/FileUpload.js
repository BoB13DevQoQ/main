import React, { useState, useRef } from 'react';
import './FileUpload.css';
import { FaCheck } from "react-icons/fa";

function FileUpload({ onUploadComplete, setPage }) {
  const [dockerfile, setDockerfile] = useState(null);
  const [mainCFile, setMainCFile] = useState(null);
  const [otherFiles, setOtherFiles] = useState([]);
  const [dockerfileContent, setDockerfileContent] = useState('');
  const [mainCFileContent, setMainCFileContent] = useState('');
  const [uploadedItems, setUploadedItems] = useState([]);
  const dockerfileInputRef = useRef(null);
  const targetCodeInputRef = useRef(null);
  const buildFilesInputRef = useRef(null);
  const [fileInfo, setFileInfo] = useState({
    dockerfile: { codes: 0, language: '', size: '' },
    targetCode: { codes: 0, language: '', size: '' },
    buildFiles: { codes: 0, language: '', size: '' }
  });
  const [dockerFileUploaded, setDockerFileUploaded] = useState(false);
  const [targetCodeUploaded, setTargetCodeUploaded] = useState(false);
  const [buildFilesUploaded, setBuildFilesUploaded] = useState(false);

  const handleDockerfileChange = (event) => {
    const file = event.target.files[0];
    setDockerfile(file);
    readFileContent(file, setDockerfileContent);
  };

  const handleMainCChange = (event) => {
    const file = event.target.files[0];
    setMainCFile(file);
    readFileContent(file, setMainCFileContent);
  };

  const handleOtherFilesChange = (event) => {
    const files = Array.from(event.target.files);
    setOtherFiles(files);

    const fileList = files.map(file => file.webkitRelativePath || file.name);
    setUploadedItems(fileList);
  };

  const readFileContent = (file, setContent) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setContent(e.target.result);
    };
    reader.readAsText(file);
  };

  const getLanguageByExtension = (extension) => {
    const languageMap = {
      '.c': 'C',
      '.cpp': 'C++',
      '.py': 'Python',
      '.js': 'JavaScript',
      '.dockerfile': 'Dockerfile'
    };
    return languageMap[extension] || 'Unknown';
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

    const fileSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const languageString = Array.from(languages).join(', ');

    if (fileType === 'dockerfile') {
      setFileInfo(prev => ({
        ...prev,
        dockerfile: {
          codes: codesCount,
          language: languageString,
          size: `${fileSizeMB} MB`
        }
      }));
      setDockerFileUploaded(true);
    } else if (fileType === 'targetCode') {
      setFileInfo(prev => ({
        ...prev,
        targetCode: {
          codes: codesCount,
          language: languageString,
          size: `${fileSizeMB} MB`
        }
      }));
      setTargetCodeUploaded(true);
    } else if (fileType === 'buildFiles') {
      setFileInfo(prev => ({
        ...prev,
        buildFiles: {
          codes: codesCount,
          language: languageString,
          size: `${fileSizeMB} MB`
        }
      }));
      setBuildFilesUploaded(true);
    }
  };

  const handleStartFuzzer = async () => {
    if (!dockerFileUploaded || !targetCodeUploaded) {
      alert('Dockerfile과 Target Code가 모두 업로드되어야 합니다.');
      return;
    }

    const formData = new FormData();
    if (dockerfile) formData.append('dockerfile', dockerfile);
    if (mainCFile) formData.append('targetCode', mainCFile);
    otherFiles.forEach(file => formData.append('files', file));

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Fuzzer 시작 실패');
      const result = await response.json();
      alert('Fuzzer 실행 시작!');
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
          <input type="text" className="form-control rounded-2" />
        </div>
      </div>

      <table className="table table-striped border rounded-3 rounded-bottom-0">
        <thead className="custom-thead bg-light rounded-3 py-3">
          <tr>
            <th className="text-center py-3 fs-5">Required files</th>
            <th className="text-center py-3 fs-5">Codes</th>
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
              {dockerFileUploaded ? (
                <button className="btn btn-success btn-sm rounded-4">
                  <FaCheck />
                </button>
              ) : (
                <>
                  <input
                    type="file"
                    id="dockerfile-upload"
                    ref={dockerfileInputRef}
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
              {targetCodeUploaded ? (
                <button className="btn btn-success btn-sm rounded-4">
                  <FaCheck />
                </button>
              ) : (
                <>
                  <input
                    type="file"
                    id="targetcode-upload"
                    ref={targetCodeInputRef}
                    onChange={handleFileUpload('targetCode')}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="targetcode-upload" className="btn btn-secondary btn-sm rounded-4">Upload</label>
                </>
              )}
            </td>
          </tr>
          <tr className="border-bottom">
            <td className="text-center py-3 fs-5">Build Files</td>
            <td className="text-center py-3 fs-5">{fileInfo.buildFiles.codes}</td>
            <td className="text-center py-3 fs-5">{fileInfo.buildFiles.language}</td>
            <td className="text-center py-3 fs-5">{fileInfo.buildFiles.size}</td>
            <td className="text-center py-3 fs-5">
              {buildFilesUploaded ? (
                <button className="btn btn-success btn-sm rounded-4">
                  <FaCheck />
                </button>
              ) : (
                <>
                  <input
                    type="file"
                    id="buildfiles-upload"
                    ref={buildFilesInputRef}
                    onChange={handleFileUpload('buildFiles')}
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
}

export default FileUpload;
