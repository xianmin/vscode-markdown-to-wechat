import { Select } from 'antd'
import { useAppContext } from '../context/AppContext'

export function ThemeSelector() {
  const { themes, currentTheme, changeTheme } = useAppContext()

  return (
    <div className="theme-selector">
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          border: '1px solid #d9d9d9',
          borderRadius: '2px',
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '0 11px',
            backgroundColor: '#fafafa',
            borderRight: '1px solid #d9d9d9',
            fontSize: '16px',
            height: '30px',
            lineHeight: '30px',
          }}
        >
          主题
        </div>
        <Select
          value={currentTheme}
          onChange={changeTheme}
          style={{ width: 100, border: 'none' }}
          options={themes.map((theme) => ({
            value: theme.id,
            label: theme.name,
          }))}
          placeholder="选择主题"
          bordered={false}
          dropdownStyle={{ minWidth: 100 }}
        />
      </div>
    </div>
  )
}
