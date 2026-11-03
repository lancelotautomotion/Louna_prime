import { ChevronRight, Database, Download, FileSpreadsheet, Minus, Monitor, Moon, Plus, Share, Smartphone, Sun, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Avatar, ProfileSheet } from '../components/ProfileSheet'
import { SyncSection } from '../components/SyncSection'
import { Card, SectionTitle } from '../components/ui'
import { exportBackup, exportCsv } from '../lib/export'
import { dayKey, fmtEuros } from '../lib/format'
import { tap } from '../lib/haptics'
import { isIOS, isStandalone, useInstall } from '../lib/install'
import { actions, useStore, type Theme } from '../lib/store'
import { toast } from '../lib/toast'
import { TIERS } from '../lib/bonus'

function Row({ icon, label, children, onClick, danger }: { icon?: ReactNode; label: ReactNode; children?: ReactNode; onClick?: () => void; danger?: boolean }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={`w-full flex items-center gap-3 px-4 min-h-[52px] text-left ${onClick ? 'active:bg-fill transition-colors' : ''} ${danger ? 'text-red' : ''}`}>
      {icon && <span className={`shrink-0 ${danger ? '' : 'text-accent-text'}`}>{icon}</span>}
      <span className="flex-1 text-[16px]">{label}</span>
      {children}
    </Tag>
  )
}

function Stepper({ value, step, onChange }: { value: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 bg-fill rounded-full p-1">
      <button aria-label="Diminuer" onClick={() => { tap(); onChange(Math.max(0, value - step)) }} className="press h-8 w-8 rounded-full flex items-center justify-center active:bg-fill-strong"><Minus size={16} /></button>
      <span className="num w-16 text-center text-[15px] font-semibold">{value ? fmtEuros(value) : 'Aucun'}</span>
      <button aria-label="Augmenter" onClick={() => { tap(); onChange(value + step) }} className="press h-8 w-8 rounded-full flex items-center justify-center active:bg-fill-strong"><Plus size={16} /></button>
    </div>
  )
}

const THEMES: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: 'auto', label: 'Auto', Icon: Monitor },
  { id: 'light', label: 'Clair', Icon: Sun },
  { id: 'dark', label: 'Sombre', Icon: Moon },
]

export function SettingsView() {
  const { sales, settings, profile } = useStore()
  const [editProfile, setEditProfile] = useState(false)
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  const file = useRef<HTMLInputElement>(null)
  const install = useInstall()
  const standalone = isStandalone()

  const onImport = async (f: File | undefined) => {
    if (!f) return
    try {
      const added = actions.importAll(JSON.parse(await f.text()))
      toast(`${added} vente${added > 1 ? 's' : ''} importée${added > 1 ? 's' : ''}`)
    } catch { toast('Fichier de sauvegarde invalide') }
    if (file.current) file.current.value = ''
  }

  return (
    <div className="view-enter max-w-[620px] mx-auto">
      <h1 className="text-[34px] font-bold tracking-tight px-1 pt-2">Réglages</h1>

      <Card className="mt-5 overflow-hidden">
        <button onClick={() => setEditProfile(true)} className="w-full flex items-center gap-4 p-4 text-left active:bg-fill transition-colors">
          <Avatar profile={profile} />
          <span className="flex-1 min-w-0">
            <span className="block text-[20px] font-semibold truncate">{fullName || 'Configurer mon profil'}</span>
            <span className="block text-[14px] text-label-2 truncate">
              {fullName ? [profile.store, profile.employeeId && `Matricule ${profile.employeeId}`].filter(Boolean).join(' · ') || 'Ajouter un magasin' : 'Nom, magasin, matricule'}
            </span>
          </span>
          <ChevronRight size={18} className="text-label-3" />
        </button>
      </Card>

      <SyncSection />

      <SectionTitle>Apparence</SectionTitle>
      <Card className="p-1.5">
        <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Thème">
          {THEMES.map(({ id, label, Icon }) => {
            const on = settings.theme === id
            return (
              <button key={id} role="radio" aria-checked={on} onClick={() => { tap(); actions.setSettings({ theme: id }) }}
                className={`press flex flex-col items-center gap-1 rounded-[20px] py-3 text-[14px] font-medium transition-colors
                  ${on ? 'bg-accent text-white' : 'text-label-2 hover:text-label'}`}>
                <Icon size={20} strokeWidth={on ? 2.4 : 2} />{label}
              </button>
            )
          })}
        </div>
      </Card>
      <p className="text-[12px] text-label-3 px-1 mt-2">« Auto » suit le réglage clair/sombre de l'appareil.</p>

      <SectionTitle>Objectifs</SectionTitle>
      <Card className="divide-y divide-separator overflow-hidden">
        <Row label="Objectif journalier"><Stepper value={settings.dailyGoal} step={5} onChange={(v) => actions.setSettings({ dailyGoal: v })} /></Row>
        <Row label="Objectif mensuel"><Stepper value={settings.monthlyGoal} step={50} onChange={(v) => actions.setSettings({ monthlyGoal: v })} /></Row>
      </Card>

      <SectionTitle>Paliers de prime</SectionTitle>
      <Card className="divide-y divide-separator overflow-hidden">
        {[...TIERS].reverse().map((t, i) => (
          <div key={t.min} className="flex justify-between px-4 py-3 text-[15px] num">
            <span className="text-label-2">Panier TTC ≥ {t.min} €</span>
            <span className={`tier-${i + 1} chip rounded-full px-2.5 py-0.5 font-semibold`}>+{t.prime} €</span>
          </div>
        ))}
      </Card>

      {!standalone && (
        <>
          <SectionTitle>Installer l'app</SectionTitle>
          <Card className="overflow-hidden">
            {install.canPrompt ? (
              <Row icon={<Smartphone size={20} />} label="Ajouter à l'écran d'accueil" onClick={install.prompt} />
            ) : (
              <div className="flex gap-3 px-4 py-3.5 text-[14px] text-label-2">
                <Share size={20} className="text-accent-text shrink-0 mt-0.5" />
                <p>{isIOS() ? <>Dans Safari, touchez <b className="text-label">Partager</b> puis <b className="text-label">Sur l'écran d'accueil</b>.</> : <>Ouvrez le menu du navigateur puis <b className="text-label">Installer l'application</b>.</>} L'app fonctionne ensuite hors ligne.</p>
              </div>
            )}
          </Card>
        </>
      )}

      <SectionTitle>Données</SectionTitle>
      <Card className="divide-y divide-separator overflow-hidden">
        <Row icon={<FileSpreadsheet size={20} />} label="Exporter tout en CSV (RH / Excel)" onClick={() => sales.length ? exportCsv(sales, `complet-${dayKey()}`) : toast('Aucune vente à exporter')} />
        <Row icon={<Download size={20} />} label="Sauvegarder (fichier JSON)" onClick={() => exportBackup(actions.exportAll())} />
        <Row icon={<Upload size={20} />} label="Restaurer une sauvegarde" onClick={() => file.current?.click()} />
        <Row icon={<Smartphone size={20} />} label="Vibrations">
          <button role="switch" aria-checked={settings.haptics} aria-label="Vibrations" onClick={() => actions.setSettings({ haptics: !settings.haptics })}
            className={`relative h-[31px] w-[51px] rounded-full transition-colors duration-300 ${settings.haptics ? 'bg-green' : 'bg-fill-strong'}`}>
            <span className={`absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform duration-300 ease-spring ${settings.haptics ? 'translate-x-5' : ''}`} />
          </button>
        </Row>
        <Row icon={<Trash2 size={20} />} danger label="Effacer toutes les ventes" onClick={() => {
          if (confirm(`Supprimer définitivement ${sales.length} ventes ? Pensez à sauvegarder avant.`)) { actions.wipe(); toast('Données effacées') }
        }} />
      </Card>
      <ProfileSheet open={editProfile} profile={profile} onClose={() => setEditProfile(false)} />
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />

      <p className="flex items-center justify-center gap-1.5 text-[12px] text-label-3 mt-6 mb-4">
        <Database size={12} /> {sales.length} ventes sur cet appareil · fonctionne hors ligne
      </p>
    </div>
  )
}
