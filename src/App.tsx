import SignIn from "./components/signIn/signIn";
import NavBar from "./components/navBar/navBar";
import SignUp from "./components/signeUp/signeUp";
import SignUpConfirmation from "./components/signUpConfirmation/signUpConfirmation";
import Articles from "./components/articles/articles";
import { Routes, Route } from "react-router-dom";
import Home from "./components/homepage/homepage"

function App() {
  return (
    <>
      <NavBar />
       <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/signIn" element={<SignIn />} />
            <Route path="/articles/:article" element={<Articles />} />
            <Route path="/signUp" element={<SignUp />} />
            <Route path="/signUpConfirmation" element={<SignUpConfirmation />} />
            <Route path="/articles" element={<Articles />} />
       </Routes>
    </>
  );
}

export default App