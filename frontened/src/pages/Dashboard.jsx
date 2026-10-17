import { Outlet } from 'react-router';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    return (
        <div>
            <div className="flex">
                <Sidebar />

                <div className="flex-1 ml-16 md:ml-64 bg-gray-100 min-h-screen">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;