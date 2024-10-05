import React from 'react';
import './ResultPage.css';
import { FaDownload } from "react-icons/fa";

const ResultPage = () => {
  return (
    <div className="container text-center mt-5">
      <h2 className="mb-4">Report</h2>

      {/* 상단 Project Name */}
      <div className="row justify-content-center mb-3">
        <div className="col-6">
          <div className="p-3 rounded-4 bg-info text-white">
            <h5>Project Name</h5>
            <p className="fs-4 mb-0">My_Project 1</p>
          </div>
        </div>
      </div>

      {/* 중간 2줄 데이터 */}
      <div className="row m-5">
        <div className="col-4">
          <div className="p-3 rounded-4 bg-info text-white">
            <h6>Code Coverage</h6>
            <p className="fs-5 mb-0">25/30 (83.33%)</p>
          </div>
        </div>
        <div className="col-4">
          <div className="p-3 rounded-4 bg-info text-white">
            <h6>Function gadget</h6>
            <p className="fs-5 mb-0">4</p>
          </div>
        </div>
        <div className="col-4">
          <div className="p-3 rounded-4 bg-info text-white">
            <h6>API</h6>
            <p className="fs-5 mb-0">2</p>
          </div>
        </div>
      </div>

      {/* 하단 2줄 데이터 */}
      <div className="row m-5">
        <div className="col-4">
          <div className="p-3 rounded-4 bg-info text-white px-5">
            <h6>Issue</h6>
            <p className="fs-5 mb-0">1</p>
          </div>
        </div>
        <div className="col-4">
          <div className="p-3 rounded-4 bg-info text-white">
            <h6>Risk level</h6>
            <p className="fs-5 mb-0">Low</p>
          </div>
        </div>
        <div className="col-4">
          <div className="p-3 rounded-4 bg-info text-white">
            <h6>Test Code</h6>
            <p className="fs-5 mb-0">21</p>
          </div>
        </div>
      </div>

      {/* Detail Report Download */}
      <div className="d-flex justify-content-center align-items-center mt-5">
        <h5 className="me-2">Detail Report:</h5>
        <FaDownload className="fs-2 text-secondary" />
      </div>
    </div>
  );
};

export default ResultPage;
