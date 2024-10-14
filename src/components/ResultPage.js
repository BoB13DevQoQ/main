import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import './ResultPage.css';
import { FaDownload } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// 필요한 스케일과 요소들을 Chart.js에 등록
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ResultPage = ({ userName, projectName }) => {
  const [chartData, setChartData] = useState({
    labels: ['Region', 'Function', 'Line', 'Branch'],
    datasets: [{
      label: 'Code Coverage',
      data: [0, 0, 0, 0], // 초기값은 0
      backgroundColor: ['#4E79A6', '#F28E2C', '#E15659', '#76B7B1'], // 막대 각각의 색상
      borderColor: ['#4E79A6', '#F28E2C', '#E15659', '#76B7B1'],
      borderWidth: 1,
    }]
  });
  
  const [issue, setIssue] = useState(0);
  const [riskLevel, setRiskLevel] = useState('Low');

  useEffect(() => {
    // 서버에서 데이터 불러오기
    fetch(`http://localhost:8000/report?userName=${userName}&projectName=${projectName}`)
      .then(response => response.json())
      .then(data => {
        const newChartData = {
          labels: ['Region', 'Function', 'Line', 'Branch'],
          datasets: [{
            label: '', // 라벨을 빈 값으로 설정 (범례 숨김을 위해)
            data: [data.report.Region, data.report.Function, data.report.Line, data.report.Branch],
            backgroundColor: ['#4E79A6', '#F28E2C', '#E15659', '#76B7B1'], // 막대 각각의 색상
            borderColor: ['#4E79A6', '#F28E2C', '#E15659', '#76B7B1'],
            borderWidth: 1,
          }]
        };
        setChartData(newChartData);
        setIssue(data.dashboard.Issue); // Issue 데이터 설정
        setRiskLevel(data.dashboard.Risk_level); // Risk Level 데이터 설정
      })
      .catch(error => console.error('Error fetching chart data:', error));
  }, [userName, projectName]);

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          callback: (value) => `${value}%`,
        },
        grid: {
          color: '#e0e0e0',
        }
      }
    },
    plugins: {
      title: {
        display: true, // 차트 제목 표시
        text: 'Code Coverage', // 차트 제목 설정
        font: {
          size: 24
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      legend: {
        display: false, // 범례 숨기기
      }
    }
  };

  return (
    <div className="container text-center mt-5">
      <h2 className="mb-4">Report</h2>

      {/* 상단 Project Name */}
      <div className="row justify-content-center mb-3">
        <div className="col-6">
          <div className="p-3 rounded-4 bg-info text-white">
            <h5>Project Name</h5>
            <p className="fs-4 mb-0">{projectName}</p>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div className="row justify-content-center">
        <div className="col-8">
          <Bar data={chartData} options={options} />
        </div>
      </div>

      {/* 하단 2줄 데이터 */}
      <div className="row m-5">
        <div className="col">
          <div className="p-3 rounded-4 bg-info text-white px-5">
            <h3>Issue</h3>
            <p className="fs-3 mb-0">{issue}</p> {/* DB에서 불러온 값 표시 */}
          </div>
        </div>
        <div className="col">
          <div className="p-3 rounded-4 bg-info text-white">
            <h3>Risk level</h3>
            <p className="fs-3 mb-0">{riskLevel}</p> {/* DB에서 불러온 값 표시 */}
          </div>
        </div>
      </div>

      {/* Detail Report Download 
      <div className="d-flex justify-content-center align-items-center mt-5">
        <h5 className="me-2">Detail Report:</h5>
        <FaDownload className="fs-2 text-secondary" />
      </div>*/}
    </div>
  );
};

export default ResultPage;
