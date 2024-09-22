import React from 'react';
import { FaFileUpload, FaChartBar } from 'react-icons/fa'; // FaUser 제거
import { AiOutlinePlus } from 'react-icons/ai'; // CgMenu 제거
import './Sidebar.css';

function Sidebar({ setPage }) {
  return (
    <div className="sidebar d-flex flex-column align-items-center">
      <button className="icon-button mb-4" onClick={() => setPage('upload')}>
        <FaFileUpload size={30} />
        <span className="ms">File Upload</span>
      </button>

      <button className="icon-button mb-4" onClick={() => setPage('loading')}>
        <AiOutlinePlus size={30} />
        <span className="ms">Add Task</span>
      </button>

      <button className="icon-button mb-4" onClick={() => setPage('result')}>
        <FaChartBar size={30} />
        <span className="ms">Reports</span>
      </button>
    </div>
  );
}

export default Sidebar;
