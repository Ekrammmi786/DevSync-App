import { Routes, Route } from "react-router-dom";
import homePage from "./pages/homePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import notificationPage from "./pages/notificationPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import callPage from "./pages/callPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <div className="h-screen text-5xl">
      <Toaster />

      <Routes>
        <Route path="/" element={<homePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/notification" element={<notificationPage />} />
        <Route path="/call" element={<callPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>
    </div>
  );
};

export default App;


