import React from 'react';
import { IoSettingsOutline } from "react-icons/io5";
import { FaRegBell, FaRegUserCircle } from "react-icons/fa";
import './Header.css';

function Header() {
  return (
    <div className="header-container d-flex justify-content-between align-items-center mb-4 p-2">
      {/* User Section */}
      <div className="user-section d-flex align-items-center px-4 py-3 rounded-5">
        <FaRegUserCircle className="user-icon me-2 fs-3" />
        <span className="user-name fs-4">User</span>
      </div>

      {/* Icon Section */}
      <div className="icon-section d-flex align-items-center gap-4 mx-5">
        <FaRegBell className="icon fs-1 text-dark mx-5" />
        <IoSettingsOutline className="icon fs-1 text-dark" />
      </div>
    </div>
  );
}

export default Header;
