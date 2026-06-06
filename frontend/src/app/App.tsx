import React from 'react'
import { useAppStore } from '../store'
import { LoginPage } from '../domains/auth/pages/LoginPage'
import { Layout } from './Layout'

function App() {
  const token = useAppStore((state) => state.token)
  return token ? <Layout /> : <LoginPage />
}

export default App
