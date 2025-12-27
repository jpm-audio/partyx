import { createBrowserRouter } from 'react-router-dom'
import MainPage from '../pages/Main/MainPage'
import ProjectPage from '../pages/Project/ProjectPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainPage />,
  },
  {
    path: '/project/:id',
    element: <ProjectPage />,
  },
])

export default router
