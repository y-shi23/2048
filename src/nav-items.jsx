import { HomeIcon } from "lucide-react";
import Index from "./pages/Index.jsx";
import Login from "./pages/Login.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <ProtectedRoute><Index /></ProtectedRoute>,
  },
  {
    title: "Login",
    to: "/login",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Login />,
  },
];
