import { Outlet } from 'react-router-dom'
import { DashLayout } from '@ui8kit/core'
import {
  useTheme,
  Card,
  Button,
  Badge,
  Stack,
  Grid,
  Text,
  Title,
  Group
} from '@ui8kit/core'

// Sidebar Navigation Component
export const Sidebar = () => {
  const menuItems = [
    { label: 'Chat', icon: '💬', href: '/' },
    { label: 'Users', icon: '👥', active: false },
    { label: 'Products', icon: '📦', active: false },
    { label: 'Orders', icon: '🛒', active: false },
    { label: 'Analytics', icon: '📈', active: false },
    { label: 'Settings', icon: '⚙️', active: false },
  ]

  return (
    <Stack gap="md" p="md">
      <Title order={4} className="mb-4">Admin Panel</Title>
      <Stack gap="sm">
        {menuItems.map((item) => (
          <a key={item.label} href={item.href || '#'}>
            <Button
              variant={item.href ? 'ghost' : 'ghost'}
              leftSection={<span>{item.icon}</span>}
              contentAlign="start"
              style={{ width: '100%' }}
            >
              {item.label}
            </Button>
          </a>
        ))}
      </Stack>
    </Stack>
  )
}

export default function App() {
  const { isDarkMode, toggleDarkMode } = useTheme()

  return (
    <DashLayout
      navbarProps={{
        isDarkMode,
        toggleDarkMode,
        brand: 'Admin Dashboard'
      }}
      sidebar={<Sidebar />}
    >
      <Outlet /> {/* DashboardContent */}
    </DashLayout>
  )
}
