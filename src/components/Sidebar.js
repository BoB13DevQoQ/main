// src/components/Sidebar.js
import React from 'react';
import { FaFileUpload, FaUser, FaChartBar } from 'react-icons/fa';
import { AiOutlinePlus } from 'react-icons/ai';
import { CgMenu } from "react-icons/cg";
import './Sidebar.css'; 

function Sidebar() {
  return (
    <div className="sidebar d-flex flex-column align-items-center">
      <button className="icon-button mb-4">
        <CgMenu size={30} />
      </button>

      <button className="icon-button mb-4">
        <AiOutlinePlus size={30} />
      </button>

      <button className="icon-button sidebar-item">
        <FaFileUpload size={30} />
        <span className="ms">File Upload</span>
      </button>
      
      <button className="icon-button sidebar-item">
        <FaUser size={30} />
        <span className="ms">My page</span>
      </button>
      
      <button className="icon-button sidebar-item">
        <FaChartBar size={30} />
        <span className="ms">Reports</span>
      </button>
    </div>
  );
}

export default Sidebar;
