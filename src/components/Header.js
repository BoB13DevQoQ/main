import React from 'react';
import { FaUserCircle, FaCog } from 'react-icons/fa';
import './Header.css';

function Header() {
  return (
    <div className="header d-flex justify-content-between align-items-center">
      <h4>User</h4>
      <div className="header-icons">
        <button className="icon-button mx-2">
          <FaUserCircle size={30} />
        </button>
        <button className="icon-button mx-2">
          <FaCog size={30} />
        </button>
      </div>
    </div>
  );
}

export default Header;
