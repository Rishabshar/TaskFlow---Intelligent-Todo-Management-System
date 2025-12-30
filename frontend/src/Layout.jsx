import { Routes, Route } from "react-router-dom";
import Signup from "./components/Signup/Signup";
import Signin from "./components/Signin/Signin";
import Todo from "./components/Todo/Todo";
import ResetPassword from './ResetPassword';

function Layout() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/todo" element={<Todo />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        
      </Routes>
    </>
  );
}

export default Layout;