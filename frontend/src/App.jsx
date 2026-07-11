import { Route,Routes } from "react-router-dom";
import homePage from "./pages/homePage.jx"
const App = () => {
  return (
    <div className="bg-red-500 h-screen text-5xl " data-theme="night">
      <Routes>
       <Route path="/" element={<homePage/>}/>
       
      </Routes>
    </div>
  );
};

export default App;

