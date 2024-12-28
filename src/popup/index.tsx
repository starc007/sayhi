import React from "react";
import { createRoot } from "react-dom/client";
import Popup from "../components/Popup/Popup";
import "../styles/global.css";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
