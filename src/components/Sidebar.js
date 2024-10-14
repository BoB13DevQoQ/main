// components/Sidebar.js
import React from 'react';
import './Sidebar.css';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="sidebar text-white vh-100">
      <div className="p-3">
        <h3 className="text-center">QoQ</h3>
        <ul className="nav flex-column">
          <li className="nav-item py-5 font-weight-bold fs-3">
            <button
              className="btn btn-link text-white fs-3 no-underline"
              onClick={() => navigate('/')}
            >
              Dash Board
            </button>
          </li>
          <li className="nav-item py-5 font-weight-bold fs-3">
            <button
              className="btn btn-link text-white fs-3 no-underline"
              onClick={() => navigate('/upload')}
            >
              File Upload
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
