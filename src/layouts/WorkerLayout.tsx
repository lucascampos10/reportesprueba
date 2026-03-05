import React from 'react';
import { Outlet } from 'react-router-dom';
import WorkerSidebar from '../components/WorkerSidebar';
import Header from '../components/Header';
import './MainLayout.css';

const WorkerLayout: React.FC = () => {
    return (
        <div className="layout-container">
            <WorkerSidebar />
            <div className="layout-main">
                <Header />
                <main className="layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default WorkerLayout;
