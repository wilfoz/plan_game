import { AppProvider, useApp } from "./context/AppContext";
import { S } from "./styles";
import { C } from "./constants/colors";
import Header from "./components/layout/Header";
import SessionManager from "./pages/SessionManager";
import Login from "./pages/Login";
import Engenharia from "./pages/Engenharia";
import Equipes from "./pages/Equipes";
import Atividades from "./pages/Atividades";
import EquipeBase from "./pages/EquipeBase";
import Requisitos from "./pages/Requisitos";
import Composicao from "./pages/Composicao";
import Cronograma from "./pages/Cronograma";
import Ranking from "./pages/Ranking";

function LoadingBar({ visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 3,
      background: `linear-gradient(90deg, ${C.gold}, ${C.goldDim})`,
      zIndex: 9999, animation: "ldbar 1.2s ease-in-out infinite",
    }} />
  );
}

function AppInner() {
  const { screen, isLoading } = useApp();
  if (screen === "session-manager") return <><LoadingBar visible={isLoading} /><SessionManager /></>;
  if (screen === "login") return <Login />;
  return (
    <div style={S.app}>
      <LoadingBar visible={isLoading} />
      <Header />
      {screen === "config" && <Engenharia />}
      {screen === "grupos" && <Equipes />}
      {screen === "atividades" && <Atividades />}
      {screen === "equipe-base" && <EquipeBase />}
      {screen === "requisitos" && <Requisitos />}
      {screen === "composicao" && <Composicao />}
      {screen === "cronograma" && <Cronograma />}
      {screen === "ranking" && <Ranking />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
