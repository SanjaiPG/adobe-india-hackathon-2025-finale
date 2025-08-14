import LeftPanel from "./components/LeftPanel";
import CenterPanel from "./components/CenterPanel";
import RightPanel from "./components/RightPanel";
import './page.css';

const App = () => {
  return (
    <div className="app-container">
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
    </div>
  );
};

export default App;