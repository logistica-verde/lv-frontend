import Tabs from '@/components/Tabs/Tabs'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from '@/pages/AdminPage/AdminPage.module.css'
import GaSettingsTab from '@/pages/AdminPage/GaSettingsTab'
import UsersTab from '@/pages/AdminPage/UsersTab'
import VehiclesTab from '@/pages/AdminPage/VehiclesTab'

export default function AdminPage() {
  useDocumentTitle('Administração')

  return (
    <div className={styles.page}>
      <h1>Administração</h1>
      <Tabs
        label="Seções da administração"
        className={styles.tabs}
        items={[
          {
            id: 'vehicles',
            label: 'Veículos',
            content: (
              <div className={styles.fill}>
                <VehiclesTab />
              </div>
            ),
          },
          {
            id: 'users',
            label: 'Usuários e perfis',
            content: (
              <div className={styles.fill}>
                <UsersTab />
              </div>
            ),
          },
          {
            id: 'ga',
            label: 'Parâmetros do AG',
            content: (
              <div className={styles.fill}>
                <GaSettingsTab />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
