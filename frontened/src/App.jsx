import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router'
import Root from './utils/Root'
import Login from './pages/login'
import ProtectedRoutes from './utils/ProtectedRoutes'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Root/>} />
        <Route path="/admin-dashboard" element={<ProtectedRoutes requiredRole={["admin"]}><Dashboard/></ProtectedRoutes>}>
      <Route index
             element = {<h1>Summary of dashboard</h1>}
      >

      </Route>

        </Route>
        <Route path="/customer/dashboard" element={<h1>customer dashboard</h1>} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<p className='font-bold text-3xl mt20 ml-20'>Unauthorized</p>} />
      </Routes>
    </Router>
  )
}

export default App
