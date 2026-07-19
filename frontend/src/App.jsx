import { Routes, Route } from "react-router-dom";
import homePage from "./pages/homePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import notificationPage from "./pages/notificationPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import callPage from "./pages/callPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "./lib/axios.js";
const App = () => {
  const {
  data: chats,
  isLoading: chatsLoading,
  error: chatsError,
} = useQuery({
  queryKey: ["chats"],
  queryFn:  async () => {
      const res = await fetch("http://localhost:5001/api/.....");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

   const { data, isLoading, error } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await axiosInstance.get("http://localhost:5001/api/.....");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });
  console.log(data);
 
  return (
    <div className="bg-red-500 h-screen text-5xl" data-theme="night">
      <Toaster />

      <button onClick={() => toast.success("hello world")}>create toast</button>

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


