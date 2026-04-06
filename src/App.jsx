import { Navigate, Route, Routes } from "react-router-dom";
import CrmTasksV1, { TaskDetailsPage, TaskProfilePage } from "./features/CrmTasksV1";
import CrmShell from "./features/CrmTasksV1/layout/CrmShell";
import HomePage from "./features/CrmTasksV1/pages/HomePage";

const App = () => (
  <Routes>
    <Route path="/crm/tasks-v1" element={<CrmShell />}>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<HomePage />} />
      <Route path="risk-management" element={<CrmTasksV1 />} />
      <Route path="profile/:taskId" element={<TaskProfilePage />} />
      <Route path="task/:taskId" element={<TaskDetailsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/crm/tasks-v1/home" replace />} />
  </Routes>
);

export default App;
