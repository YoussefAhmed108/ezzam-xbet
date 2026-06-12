import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import type { useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import Login from "./routes/Login";
import Signup from "./routes/Signup";
import Matches from "./routes/Matches";
import Groups from "./routes/Groups";
import GroupDetail from "./routes/GroupDetail";
import Leaderboard from "./routes/Leaderboard";
import Profile from "./routes/Profile";
import PlayerProfile from "./routes/PlayerProfile";

export interface RouterContext {
  auth: ReturnType<typeof useAuth>;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/matches" });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) throw redirect({ to: "/matches" });
  },
  component: Login,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) throw redirect({ to: "/matches" });
  },
  component: Signup,
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_authenticated",
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: "/login" });
  },
  component: Layout,
});

const matchesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/matches",
  component: Matches,
});

const groupsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/groups",
  component: Groups,
});

const groupDetailRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/groups/$groupId",
  component: GroupDetail,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/leaderboard",
  component: Leaderboard,
});

const profileRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/profile",
  component: Profile,
});

const playerProfileRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/players/$userId",
  component: PlayerProfile,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  authLayoutRoute.addChildren([
    matchesRoute,
    groupsRoute,
    groupDetailRoute,
    leaderboardRoute,
    profileRoute,
    playerProfileRoute,
  ]),
]);

export function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
    defaultPreload: "intent",
  });
}

export const router = createAppRouter({ auth: undefined as never });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
