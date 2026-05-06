import { AppProvider, useApp } from "./context/AppContext";
import { S } from "./styles";
import Header from "./components/layout/Header";
import Intro from "./pages/Intro";
import Engenharia from "./pages/Engenharia";
import Equipes from "./pages/Equipes";
import Atividades from "./pages/Atividades";
import Requisitos from "./pages/Requisitos";
import Composicao from "./pages/Composicao";
import Cronograma from "./pages/Cronograma";
import Ranking from "./pages/Ranking";

function AppInner() {
  const { screen } = useApp();
  if (screen === "intro") return <Intro />;
  return (
    <div style={S.app}>
      <Header />
      {screen === "config" && <Engenharia />}
      {screen === "grupos" && <Equipes />}
      {screen === "atividades" && <Atividades />}
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
