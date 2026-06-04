import React from 'react'
import { useAppStore } from './store'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'

function App() {
  const token = useAppStore((state) => state.token)

  return (
    <>
      {token ? <Dashboard /> : <Login />}
    </>
  )
}

export default App
