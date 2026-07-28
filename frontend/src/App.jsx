import { Navigate, Route, Routes } from "react-router";

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

import { Toaster } from "react-hot-toast";

const App = () => {
  const {data} = useQuery({queryKey:"todos",
    queryFn:async()=>{
      const res = await fetch("https://jsonplaceholder.typicode.com/todos");
      const data = await res.json();
      return data;
    }
  })

  console.log(data);
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


