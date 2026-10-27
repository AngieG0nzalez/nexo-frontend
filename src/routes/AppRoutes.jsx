import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import LoginPage from "../pages/Login/LoginPage.jsx";
import TopicsPage from "../pages/Topics/TopicsPage.jsx";
import ExercisePage from "../pages/Exercise/ExercisePage.jsx";
import ProgressPage from "../pages/Progress/ProgressPage.jsx";
import AdminPage from "../pages/Admin/AdminPage.jsx";
import TutorPage from "../pages/Tutor/TutorPage.jsx";
import MessagesPage from "../pages/Messages/MessagesPage.jsx";
import ProfilePage from "../pages/Profile/ProfilePage.jsx";
import ConfirmEmailPage from "../pages/ConfirmEmail/ConfirmEmailPage.jsx";
import AdminUsersPage from "../pages/Admin/AdminUsersPage.jsx";
import AdminAssignmentsPage from "../pages/Admin/AdminAssignmentsPage.jsx";
import AdminSuggestionsPage from "../pages/Admin/AdminSuggestionsPage.jsx";
import QuestionBankPage from "../pages/Content/QuestionBankPage.jsx";
import SuggestionsPage from "../pages/Suggestions/SuggestionsPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { useAuth } from "../context/AuthContext.jsx";
function Home() {
  const { user } = useAuth();
  return (
    <Navigate
      to={
        !user
          ? "/login"
          : user.role === "admin"
            ? "/admin"
            : user.role === "tutor"
              ? "/tutor"
              : "/topics"
      }
      replace
    />
  );
}
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<LoginPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute roles={["student"]} />}>
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/exercise" element={<ExercisePage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/suggestions" element={<SuggestionsPage mode="mine" />} />
            <Route path="/suggestions/new" element={<SuggestionsPage mode="new" />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
            <Route path="/admin/questions" element={<QuestionBankPage />} />
            <Route path="/admin/suggestions" element={<AdminSuggestionsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={["tutor"]} />}>
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/tutor/messages" element={<MessagesPage />} />
            <Route path="/tutor/questions" element={<QuestionBankPage />} />
            <Route path="/tutor/suggestions" element={<SuggestionsPage mode="mine" />} />
            <Route path="/tutor/suggestions/new" element={<SuggestionsPage mode="new" />} />
          </Route>
          <Route element={<ProtectedRoute roles={["student", "tutor"]} />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
