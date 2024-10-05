// components/Sidebar.js
import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar text-white vh-100">
      <div className="p-3">
        <h3 className="text-center">QoQ</h3>
        <ul className="nav flex-column">
          <li className="nav-item py-5 font-weight-bold fs-3">Dash Board</li>
          <li className="nav-item py-5 font-weight-bold fs-3">File Upload
            <ul className="nav flex-column ml-3">
              <li className="nav-item pl-3 fs-5">Project files</li>
              <li className="nav-item pl-3 fs-5">Codes</li>
            </ul>
          </li>
          <li className="nav-item py-5 font-weight-bold fs-3">Issues</li>
          <li className="nav-item py-5 font-weight-bold fs-3">Report</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
