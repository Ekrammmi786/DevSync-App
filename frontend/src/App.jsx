
import SignUpPage from './pages/SignUpPage'
import OnboardingPage from './pages/OnboardingPage'
import ChatPage from './pages/ChatPage'
import callPage from './pages/callPage'
import notificationPage from './pages/notificationPage'
import { useQuery } from '@tanstack/react-query';

const App = () => {

  const {data} = useQuery({queryKey:"todos",

    queryFn:async()=>{
      const res = await fetch("https://jsonplaceholder.typicode.com/todos");
      const data = await res.json();
      return data;
    },
  });

  
  return (
    <div className='h-screen' data-theme="night">
      <Routes>
        <Route path="/" element={<homePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/calls" element={<callPage />} />
        <Route path="/notifications" element={<notificationPage />} />
      </Routes>

      <Toaster/>
    </div>
  )
}

export default App
