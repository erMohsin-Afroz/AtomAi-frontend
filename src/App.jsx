
import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import AuthModal from "./AuthModal.jsx";
import { MyContextProvider, MyContext } from "./MyContext.jsx";
import { useContext, useState } from "react";

function MainApp() {
  const { token, theme } = useContext(MyContext);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!token) {
    return <AuthModal />;
  }

  return (
    <div className={`app ${theme}`}>
      <Sidebar
        mobileSidebarOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {mobileSidebarOpen && (
        <div
          className="mobileSidebarBackdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <ChatWindow
        onMenuClick={() => setMobileSidebarOpen(prev => !prev)}
      />
    </div>
  );
}

function App() {
  return (
    <MyContextProvider>
      <MainApp />
    </MyContextProvider>
  );
}

export default App;
