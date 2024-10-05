import React, { useState } from 'react';
import './Dashboard.css';
import { IoMdSearch } from "react-icons/io";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Dashboard = () => {
  // 프로젝트 리스트 데이터
  const projects = [
    { name: "My_Project 1", codes: 10, language: "C++", issue: 0, risk: "Low" },
    { name: "My_Project 2", codes: 8, language: "C", issue: 1, risk: "Low" },
    { name: "My_Project 3", codes: 15, language: "C, C++", issue: 0, risk: "Low" },
    { name: "My_Project 4", codes: 12, language: "C++", issue: 0, risk: "Low" },
    { name: "My_Project 5", codes: 20, language: "C", issue: 1, risk: "Low" },
    { name: "My_Project 6", codes: 12, language: "C, C++", issue: 0, risk: "Low" },
    { name: "My_Project 7", codes: 10, language: "C", issue: 2, risk: "Low" },
    { name: "My_Project 8", codes: 25, language: "C++", issue: 2, risk: "Low" },
    // 더 많은 프로젝트가 추가될 수 있음
  ];

  // 페이징 상태 관리
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6; // 한 페이지에 보여줄 프로젝트 수

  // 현재 페이지의 프로젝트 계산
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);

  // 페이지 변경 핸들러
  const nextPage = () => {
    if (currentPage < Math.ceil(projects.length / projectsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="dashboard p-4 flex-grow-1 gap-3">
      <h2 className="mb-5">Dash Board</h2>

      <div className="row mb-4 g-5 mx-5">
        <div className="col-md-4">
          <div className="card text-center stat-background text-white rounded-5">
            <div className="card-body">
              <h5 className="card-title fs-3">Projects</h5>
              <p className="card-text fs-3">12</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center stat-background text-white rounded-5">
            <div className="card-body">
              <h5 className="card-title fs-3">Codes</h5>
              <p className="card-text fs-3">105</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center stat-background text-white rounded-5">
            <div className="card-body">
              <h5 className="card-title fs-3">Total Issue</h5>
              <p className="card-text fs-3">6</p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색바 */}
      <div className="input-group mb-4 w-25">
        <IoMdSearch className="fs-1" />
        <input type="text" className="form-control rounded-2" placeholder="Search..." />
      </div>

      {/* 리스트 페이징 테이블 */}
      <table className="table table-striped border rounded-3 rounded-bottom-0">
        <thead className="custom-thead bg-light rounded-3">
          <tr>
            <th className="text-center fs-5">Project</th>
            <th className="text-center fs-5">Codes</th>
            <th className="text-center fs-5">Language</th>
            <th className="text-center fs-5">Issue</th>
            <th className="text-center fs-5">Risk level</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {currentProjects.map((project, index) => (
            <tr key={index} className="border-bottom">
              <td className="text-center py-3 fs-5">{project.name}</td>
              <td className="text-center py-3 fs-5">{project.codes}</td>
              <td className="text-center py-3 fs-5">{project.language}</td>
              <td className="text-center py-3 fs-5">{project.issue}</td>
              <td className="text-center py-3 text-primary fs-5">{project.risk}</td>
              <td className="text-center py-3 fs-5">
                <button className="btn btn-secondary btn-sm rounded-4">more</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 화살표 */}
      <div className="d-flex justify-content-center align-items-center mt-3">
        <FaChevronLeft className="fs-3 cursor-pointer" onClick={prevPage} />
        <span className="mx-3 fs-4">{currentPage}</span>
        <FaChevronRight className="fs-3 cursor-pointer" onClick={nextPage} />
      </div>
    </div>
  );
};

export default Dashboard;
