import { Check } from 'lucide-react'
import { useState } from 'react'
import { actions, PROFILE_COLORS, type Profile } from '../lib/store'
import { toast } from '../lib/toast'
import { Sheet } from './Sheet'

export const initials = (p: Profile) =>
  ((p.firstName[0] ?? '') + (p.lastName[0] ?? '')).toUpperCase() || '?'

export function Avatar({ profile, size = 56 }: { profile: Profile; size?: number }) {
  return (
    <span className="rounded-full flex items-center justify-center text-white font-semibold shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.38, background: profile.color }} aria-hidden>
      {initials(profile)}
    </span>
  )
}

const FIELDS: { key: keyof Omit<Profile, 'color'>; label: string; placeholder: string; auto?: string }[] = [
  { key: 'firstName', label: 'Prénom', placeholder: 'Louna', auto: 'given-name' },
  { key: 'lastName', label: 'Nom', placeholder: 'Dupont', auto: 'family-name' },
  { key: 'store', label: 'Magasin', placeholder: 'Ex. : Lyon Part-Dieu', auto: 'organization' },
  { key: 'employeeId', label: 'Matricule', placeholder: 'Facultatif' },
]

export function ProfileSheet({ open, profile, onClose }: { open: boolean; profile: Profile; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Mon profil">
      {open && <Form profile={profile} onClose={onClose} />}
    </Sheet>
  )
}

function Form({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [draft, setDraft] = useState(profile)
  const save = () => {
    actions.setProfile({ ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), store: draft.store.trim(), employeeId: draft.employeeId.trim() })
    toast('Profil enregistré'); onClose()
  }
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save() }}>
      <div className="flex flex-col items-center gap-3">
        <Avatar profile={draft} size={72} />
        <div className="flex gap-2" role="radiogroup" aria-label="Couleur de l'avatar">
          {PROFILE_COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={draft.color === c} aria-label={`Couleur ${c}`}
              onClick={() => setDraft({ ...draft, color: c })}
              className="press h-8 w-8 rounded-full flex items-center justify-center" style={{ background: c }}>
              {draft.color === c && <Check size={16} className="text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-fill divide-y divide-separator overflow-hidden">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex items-center gap-3 px-4 min-h-[50px]">
            <span className="w-24 shrink-0 text-[15px] text-label-2">{f.label}</span>
            <input value={draft[f.key]} placeholder={f.placeholder} autoComplete={f.auto ?? 'off'} maxLength={40}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              className="flex-1 min-w-0 bg-transparent text-[16px] text-label placeholder:text-label-3 outline-none py-3" />
          </label>
        ))}
      </div>
      <button type="submit" className="press w-full h-14 rounded-2xl bg-accent text-white text-[17px] font-semibold">Enregistrer</button>
    </form>
  )
}
