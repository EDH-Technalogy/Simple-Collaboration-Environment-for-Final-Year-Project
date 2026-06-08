import { GooeyToaster } from "goey-toast";
import "goey-toast/styles.css";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { AppTooltipProvider } from "./components/Tooltip";
import GuestRoute from "./routes/GuestRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ThemeProvider } from "./context/themContext";
import Applayout from "./layout/AppLayout";
import { StudentActivityProvider } from "./context/StudentActivityContext";
import AppSidebar from "./layout/AppSideBar";
import PublicWebsiteLayout from "./layout/PublicWebsiteLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";
import WriteStory from "./pages/blog/WriteStory";
import ReaderLibrary from "./pages/blog/ReaderLibrary";
import TopicFeed from "./pages/blog/TopicFeed";
import StoryDetailPage from "./pages/blog/StoryDetailPage";
import Profile from "./pages/blog/Profile";
import Dashboard from "./pages/admin/Dashboard";
import Reports from "./pages/admin/Reports";
import Projects from "./pages/admin/Projects";
import Users from "./pages/admin/Users";
import Student from "./pages/admin/Students";
import Teacher from "./pages/admin/Teachers";
import Employee from "./pages/admin/Employee";
import Notification from "./pages/admin/Notification";
import Department from "./pages/admin/Departments";
import Blog from "./pages/admin/Blogs";
import BlogDetailPage from "./pages/admin/BlogDetailPage";
import Setting from "./pages/admin/Setting";
import StudentDashboard from "./pages/student/Dashboard";
import StudentWorkspace from "./pages/student/StudentWorkspace";
import StudentNewRepository from "./pages/student/StudentNewRepository";
import StudentSettings from "./pages/student/Settings";
import StudentNotifications from "./pages/student/Notifications";
import StudentNotificationDetail from "./pages/student/NotificationDetail";
import StudentRepositoryLayout from "./pages/student/StudentRepositoryLayout";
import StudentRepoCode from "./pages/student/StudentRepoCode";
import StudentRepoFileHistory from "./pages/student/StudentRepoFileHistory";
import StudentRepoPullRequests from "./pages/student/StudentRepoPullRequests";
import StudentRepoTasksOutlet from "./pages/student/StudentRepoTasksOutlet";
import StudentRepoTasks from "./pages/student/StudentRepoTasks";
import StudentRepoMilestoneDetail from "./pages/student/StudentRepoMilestoneDetail";
import StudentRepoTaskDetail from "./pages/student/StudentRepoTaskDetail";
import StudentRepoContributors from "./pages/student/StudentRepoContributors";
import StudentRepoStatistics from "./pages/student/StudentRepoStatistics";
import Home from "./pages/blog/Home";
import UserProfile from "./pages/admin/Profile";
import NotificationDetail from "./pages/admin/NotificationDetail";
import StudentProfile from "./pages/admin/StudentProfile";
import StudentProfileStudent from "./pages/student/Profile";
import StudentRegisterPage from "./pages/admin/StudentRegisterPage";
import StudentEditPage from "./pages/admin/StudentEditPage";
import TeacherRegisterPage from "./pages/admin/TeacherRegisterPage";
import TeacherEditPage from "./pages/admin/TeacherEditPage";
import EmployeeRegisterPage from "./pages/admin/EmployeeRegisterPage";
import EmployeeEditPage from "./pages/admin/EmployeeEditPage";
import TeacherProfile from "./pages/admin/TeacherProfile";
import EmployeeProfile from "./pages/admin/EmployeeProfile";
import DepartmentProfile from "./pages/admin/DepartmentProfile";
import ProjectWorkspace from "./pages/admin/ProjectWorkspace";
import ProjectRegistrationPage from "./pages/admin/ProjectRegistrationPage";
import GroupRegistrationPage from "./pages/admin/GroupRegistrationPage";
import About from "./pages/public/About";
import Download from "./pages/public/Download";
import Documentation from "./pages/public/Documentation";
import PublicProjects from "./pages/public/Projects";
import AuthorDashboard from "./pages/author/AuthorDashboard";
import AuthorPublished from "./pages/author/AuthorPublished";
import AuthorUnpublished from "./pages/author/AuthorUnpublished";
import AuthorStoryDetail from "./pages/author/AuthorStoryDetail";
import AuthorNotifications from "./pages/author/AuthorNotifications";
import AuthorNotificationDetail from "./pages/author/AuthorNotificationDetail";
import TeacherNotifications from "./pages/teacher/TeacherNotifications";
import TeacherNotificationDetail from "./pages/teacher/TeacherNotificationDetail";
import StaffNotifications from "./pages/staff/StaffNotifications";
import StaffNotificationDetail from "./pages/staff/StaffNotificationDetail";
import DeanNotifications from "./pages/dean/DeanNotifications";
import DeanNotificationDetail from "./pages/dean/DeanNotificationDetail";
import { PUBLIC_SITE_MEMBER_ROLES } from "./auth/appRoles";

function AuthorPublishedStoryRoute() {
  const { id } = useParams();
  return <Navigate to={`/author/stories/${encodeURIComponent(id ?? "")}`} replace />;
}

function AuthorDraftStoryRoute() {
  const { id } = useParams();
  return <Navigate to={`/author/stories/${encodeURIComponent(id ?? "")}`} replace />;
}

export default function App() {
  // Sidebar layout and responsiveness handled inside `Applayout` via SidebarContext
  return (
    <ThemeProvider>
      <AppTooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Public blog / stories — dedicated marketing header; read anonymously, write when signed in */}
            <Route element={<PublicWebsiteLayout />}>
              <Route index element={<Home />} />
              <Route path="home" element={<Navigate to="/" replace />} />
              <Route path="blogs" element={<Home />} />
              <Route path="projects" element={<PublicProjects />} />
              <Route path="projects/:id" element={<PublicProjects />} />
              <Route path="story/:id" element={<StoryDetailPage />} />
              <Route path="documentation" element={<Documentation />} />
              <Route path="writer/profile" element={<Profile />} />
            </Route>

            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <GuestRoute>
                  <Signup />
                </GuestRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <ForgotPassword />
                </GuestRoute>
              }
            />
            <Route path="/reset-password" element={<ForgotPassword />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Applayout>
                    <AppSidebar />
                  </Applayout>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="users/:id" element={<UserProfile />} />
              <Route path="student/new" element={<StudentRegisterPage />} />
              <Route path="student/:id/edit" element={<StudentEditPage />} />
              <Route path="student" element={<Student />} />
              <Route path="student/:id" element={<StudentProfile />} />
              <Route path="teacher/new" element={<TeacherRegisterPage />} />
              <Route path="teacher/:id/edit" element={<TeacherEditPage />} />
              <Route path="teacher/:id" element={<TeacherProfile />} />
              <Route path="teacher" element={<Teacher />} />
              <Route path="employee/new" element={<EmployeeRegisterPage />} />
              <Route path="employee/:id/edit" element={<EmployeeEditPage />} />
              <Route path="employee" element={<Employee />} />
              <Route path="employee/:id" element={<EmployeeProfile />} />
              <Route path="notification" element={<Notification />} />
              <Route path="notification/:id" element={<NotificationDetail />} />
              <Route path="department" element={<Department />} />
              <Route path="department/:id" element={<DepartmentProfile />} />
              <Route path="projects" element={<Projects />} />
              <Route
                path="projects/register"
                element={<ProjectRegistrationPage />}
              />
              <Route
                path="projects/register/:id"
                element={<ProjectRegistrationPage />}
              />
              <Route
                path="projects/groups/register"
                element={<GroupRegistrationPage />}
              />
              <Route
                path="projects/groups/register/:id"
                element={<GroupRegistrationPage />}
              />
              <Route
                path="projects/workspace/:id"
                element={<ProjectWorkspace />}
              />
              <Route
                path="projects/:owner/:repo"
                element={<ProjectWorkspace />}
              />
              <Route
                path="repository/:owner/:repo"
                element={<StudentRepositoryLayout />}
              >
                <Route index element={<StudentRepoCode />} />
                <Route path="history" element={<StudentRepoFileHistory />} />
                <Route
                  path="pull-requests"
                  element={<StudentRepoPullRequests />}
                />
                <Route path="tasks" element={<StudentRepoTasksOutlet />}>
                  <Route index element={<StudentRepoTasks />} />
                  <Route
                    path="milestone/:milestoneNumber"
                    element={<StudentRepoMilestoneDetail />}
                  />
                  <Route
                    path="issue/:taskNumber"
                    element={<StudentRepoTaskDetail />}
                  />
                </Route>
                <Route
                  path="contributors"
                  element={<StudentRepoContributors />}
                />
                <Route path="statistics" element={<StudentRepoStatistics />} />
              </Route>
              <Route path="blogs" element={<Blog />} />
              <Route path="blogs/:id" element={<BlogDetailPage />} />
              <Route path="setting" element={<Setting />} />
              <Route path="report" element={<Reports />} />
            </Route>

            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <Applayout>
                    <AppSidebar />
                  </Applayout>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="repositories" element={<StudentWorkspace />} />
              <Route
                path="repositories/new"
                element={<StudentNewRepository />}
              />
              <Route path="workspace" element={<StudentWorkspace />} />
              <Route
                path="workspace/repositories/new"
                element={<StudentNewRepository />}
              />
              <Route
                path="profile/:username"
                element={<StudentProfileStudent />}
              />
              <Route
                path="projects/register"
                element={<ProjectRegistrationPage />}
              />
              <Route
                path="projects/register/:id"
                element={<ProjectRegistrationPage />}
              />
              <Route
                path="projects/groups/register"
                element={<GroupRegistrationPage />}
              />
              <Route
                path="projects/groups/register/:id"
                element={<GroupRegistrationPage />}
              />
              <Route
                path="projects/workspace/:id"
                element={<ProjectWorkspace />}
              />
              <Route
                path="repository/:owner/:repo"
                element={<StudentRepositoryLayout />}
              >
                <Route index element={<StudentRepoCode />} />
                <Route path="history" element={<StudentRepoFileHistory />} />
                <Route
                  path="pull-requests"
                  element={<StudentRepoPullRequests />}
                />
                <Route path="tasks" element={<StudentRepoTasksOutlet />}>
                  <Route index element={<StudentRepoTasks />} />
                  <Route
                    path="milestone/:milestoneNumber"
                    element={<StudentRepoMilestoneDetail />}
                  />
                  <Route
                    path="issue/:taskNumber"
                    element={<StudentRepoTaskDetail />}
                  />
                </Route>
                <Route
                  path="contributors"
                  element={<StudentRepoContributors />}
                />
                <Route path="statistics" element={<StudentRepoStatistics />} />
              </Route>
              <Route path="profile" element={<StudentProfileStudent />} />
              <Route
                path="profile/:username"
                element={<StudentProfileStudent />}
              />
              <Route path="notifications" element={<TeacherNotifications />} />
              <Route
                path="notifications/:id"
                element={<TeacherNotificationDetail />}
              />
              <Route path="settings" element={<StudentSettings />} />
            </Route>

            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentActivityProvider>
                    <Applayout>
                      <AppSidebar />
                    </Applayout>
                  </StudentActivityProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route
                path="projects"
                element={<Navigate to="workspace" replace />}
              />
              <Route
                path="repositories"
                element={<Navigate to="workspace" replace />}
              />
              <Route
                path="tasks"
                element={<Navigate to="workspace" replace />}
              />
              <Route
                path="contributors"
                element={<Navigate to="workspace" replace />}
              />
              <Route path="workspace" element={<StudentWorkspace />} />
              <Route
                path="workspace/repositories/new"
                element={<StudentNewRepository />}
              />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route
                path="notifications/:id"
                element={<StudentNotificationDetail />}
              />
              <Route path="settings" element={<StudentSettings />} />
              <Route path="profile" element={<StudentProfileStudent />} />
              <Route
                path="profile/:username"
                element={<StudentProfileStudent />}
              />
              <Route
                path="repository/:owner/:repo"
                element={<StudentRepositoryLayout />}
              >
                <Route index element={<StudentRepoCode />} />
                <Route path="history" element={<StudentRepoFileHistory />} />
                <Route
                  path="pull-requests"
                  element={<StudentRepoPullRequests />}
                />
                <Route path="tasks" element={<StudentRepoTasksOutlet />}>
                  <Route index element={<StudentRepoTasks />} />
                  <Route
                    path="milestone/:milestoneNumber"
                    element={<StudentRepoMilestoneDetail />}
                  />
                  <Route
                    path="issue/:taskNumber"
                    element={<StudentRepoTaskDetail />}
                  />
                </Route>
                <Route
                  path="contributors"
                  element={<StudentRepoContributors />}
                />
                <Route path="statistics" element={<StudentRepoStatistics />} />
              </Route>
            </Route>

            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <Applayout>
                    <AppSidebar />
                  </Applayout>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="notifications" element={<StaffNotifications />} />
              <Route
                path="notifications/:id"
                element={<StaffNotificationDetail />}
              />
              <Route path="settings" element={<Setting />} />
            </Route>

            <Route
              path="/dean"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Applayout>
                    <AppSidebar />
                  </Applayout>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="notifications" element={<DeanNotifications />} />
              <Route
                path="notifications/:id"
                element={<DeanNotificationDetail />}
              />
              <Route path="setting" element={<Setting />} />
            </Route>

            <Route
              path="/author"
              element={
                <ProtectedRoute allowedRoles={["author"]}>
                  <Applayout>
                    <AppSidebar />
                  </Applayout>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AuthorDashboard />} />
              <Route path="writing" element={<WriteStory />} />
              <Route path="stories" element={<AuthorPublished />} />
              <Route path="stories/:id" element={<AuthorStoryDetail />} />
              <Route path="unpublished" element={<AuthorUnpublished />} />
              <Route path="published" element={<AuthorPublished />} />
              <Route path="publish/:id" element={<AuthorPublishedStoryRoute />} />
              <Route path="publish/draf/:id" element={<AuthorDraftStoryRoute />} />
              <Route path="notifications" element={<AuthorNotifications />} />
              <Route
                path="notifications/:id"
                element={<AuthorNotificationDetail />}
              />
              <Route path="settings" element={<Setting />} />
            </Route>

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <GooeyToaster
          position="top-right"
          toastOptions={{
            style: { zIndex: 2147483647 },
          }}
        />
      </AppTooltipProvider>
    </ThemeProvider>
  );
}
