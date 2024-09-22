import React from 'react';
import { Spinner } from 'react-bootstrap';
import './LoadingPage.css';

function LoadingPage({ status, error }) {
  return (
    <div className="loading-page d-flex flex-column align-items-center justify-content-center">
      <Spinner animation="border" role="status" className="mb-3" />
      <p>{status}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default LoadingPage;
