import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Search from './pages/Search';
import Login from './pages/Login';
import Register from './pages/Register';
import SubredditPage from './pages/SubredditPage';
import SubredditEditor from './pages/SubredditEditor';
import Communities from './pages/Communities';
import PostPage from './pages/PostPage';
import PostEditor from './pages/PostEditor';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Pages d'authentification : plein écran, sans barre latérale */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        {/* Lecture : accessible à tous, même sans compte */}
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="communities" element={<Communities />} />
        <Route path="r/:name" element={<SubredditPage />} />
        <Route path="r/:name/post/:postId" element={<PostPage />} />
        <Route path="u/:username" element={<Profile />} />

        {/* Écriture : il faut être connecté */}
        <Route element={<ProtectedRoute />}>
          <Route path="submit" element={<PostEditor />} />
          <Route path="post/:postId/edit" element={<PostEditor />} />
          <Route path="communities/new" element={<SubredditEditor />} />
          <Route path="r/:name/edit" element={<SubredditEditor />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
