import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import OnboardingSuccess from './pages/OnboardingSuccess'
import Dashboard from './pages/Dashboard'
import PatientChat from './pages/PatientChat'
import FindClinic from './pages/FindClinic'

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/find-clinic" element={<FindClinic />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/onboarding/success" element={<OnboardingSuccess />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<PatientChat />} />
            </Routes>
            <ChatWidget />
        </>
    )
}

export default App
