import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { IoMdSearch } from "react-icons/io";
import { FaChevronLeft, FaChevronRight, FaSpinner } from "react-icons/fa";  // FaSpinner 아이콘 추가

const Dashboard = ({ userName, setprojectName }) => {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({ totalProjects: 0, totalFiles: 0, totalIssues: 0 });
  const [currentPage, setCurrentPage] = useState(0);
  const [maxPage, setMaxPage] = useState(0);
  const navigate = useNavigate();

  // Dashboard 데이터 API 호출 함수
  const fetchDashboardData = () => {
    fetch(`http://localhost:8000/dashboard/?page=${currentPage}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
    })
    .then(response => response.json())
    .then(data => {
      setSummary({
        totalProjects: data.summary.totalProjects,
        totalFiles: data.summary.totalFiles,
        totalIssues: data.summary.totalIssues,
      });
      setProjects(data.projects);
      setMaxPage(Math.ceil(data.summary.totalProjects / 6));
    })
    .catch(error => console.error('Error fetching dashboard data:', error));
  };

  // 상태 변화에 따른 데이터 새로 가져오기
  useEffect(() => {
    if (userName) {
      fetchDashboardData();
    }
  }, [userName, currentPage]);

  // WebSocket으로 실시간 업데이트 감지
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/dashboard');

    ws.onmessage = (event) => {
      const message = event.data;
      if (message === "Dashboard updated") {
        fetchDashboardData();
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const nextPage = () => {
    if (currentPage < maxPage - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getRiskLevelStyle = (riskLevel) => {
    switch (riskLevel) {
      case 'Low':
        return { color: '#0000FF' }; 
      case 'Middle':
        return { color: '#FFA500' }; 
      case 'High':
        return { color: '#FF0000' };
      default:
        return { color: '#000000' };
    }
  };

  // Result 페이지로 이동하는 함수
  const goToResultPage = (projectName) => {
    setprojectName(projectName);
    navigate(`/result`);
  };

  return (
    <div className="dashboard p-4 flex-grow-1 gap-3">
      <h2 className="mb-5">Dash Board</h2>

      <div className="row mb-4 g-5 mx-5">
        <div className="col-md-4">
          <div className="card text-center stat-background text-white rounded-5">
            <div className="card-body">
              <h5 className="card-title fs-3">Projects</h5>
              <p className="card-text fs-3">{summary.totalProjects}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center stat-background text-white rounded-5">
            <div className="card-body">
              <h5 className="card-title fs-3">Files</h5>
              <p className="card-text fs-3">{summary.totalFiles}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center stat-background text-white rounded-5">
            <div className="card-body">
              <h5 className="card-title fs-3">Total Issue</h5>
              <p className="card-text fs-3">{summary.totalIssues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색바 */}
      <div className="input-group mb-4 w-25">
        <IoMdSearch className="fs-1" />
        <input type="text" className="form-control rounded-2" placeholder="Search..." />
      </div>

      <table className="table table-striped border rounded-3 rounded-bottom-0">
        <thead className="custom-thead bg-light rounded-3">
          <tr>
            <th className="text-center fs-5">Project</th>
            <th className="text-center fs-5">Files</th>
            <th className="text-center fs-5">Language</th>
            <th className="text-center fs-5">Issue</th>
            <th className="text-center fs-5">Risk level</th>
            <th className="text-center fs-5"></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <tr key={index} className="border-bottom">
              <td className="text-center py-3 fs-5">{project.Project}</td>
              <td className="text-center py-3 fs-5">{project.Files}</td>
              <td className="text-center py-3 fs-5">{project.Language}</td>
              <td className="text-center py-3 fs-5">{project.Issue}</td>
              <td className="text-center py-3 fs-5" style={getRiskLevelStyle(project.Risk_level)}>
                {project.Risk_level}
              </td>
              <td className="text-center py-3 fs-5">
                {project.Risk_level === "N/A" ? (
                  <button className="btn btn-warning btn-sm rounded-4" disabled>
                    Fuzzing... <FaSpinner className="ms-2 spinner" />
                  </button>
                ) : (
                  <button 
                    className="btn btn-secondary btn-sm rounded-4" 
                    onClick={() => goToResultPage(project.Project)}
                  >
                    more
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-center align-items-center mt-3">
        <FaChevronLeft className="fs-3 cursor-pointer" onClick={prevPage} />
        <span className="mx-3 fs-4">{currentPage + 1}</span>
        <FaChevronRight className="fs-3 cursor-pointer" onClick={nextPage} />
      </div>
    </div>
  );
};

export default Dashboard;
