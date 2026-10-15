import React from "react";
import { createRoot } from "react-dom/client";
import CampaignApp from "./CampaignApp.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CampaignApp />
  </React.StrictMode>
);
