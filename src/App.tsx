import {
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useState,
} from 'react'
import './App.css'

const navItems = [
  { label: 'About', icon: 'profile', target: 'about' },
  { label: 'Experience', icon: 'briefcase', target: 'experience' },
  { label: 'Skills', icon: 'bars', target: 'skills' },
  { label: 'Projects', icon: 'folder', target: 'projects' },
  { label: 'Contact', icon: 'mail', target: 'contact' },
] as const

type SectionId = (typeof navItems)[number]['target']

const adminSections = [
  { id: 'messages', label: 'Message Box' },
  { id: 'profile', label: 'Profile' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
] as const

type AdminSectionId = (typeof adminSections)[number]['id']

type ProfileData = {
  imageUrl: string
  name: string
  role: string
}

type AboutData = {
  heading: string
  imageUrl: string
  resumeUrl: string
  text: string
}

type SkillData = {
  id?: number
  label: string
  value: number
}

type ExperienceData = {
  company: string
  copy: string
  id?: number
  imageUrl: string
  period: string
  role: string
}

type ProjectData = {
  copy: string
  id?: number
  imageUrl: string
  imageUrls: string[]
  linkText: string
  title: string
}

type InboxMessage = {
  createdAt: string
  email: string
  id: number
  message: string
}

type PortfolioData = {
  about: AboutData
  experiences: ExperienceData[]
  profile: ProfileData
  projects: ProjectData[]
  skills: SkillData[]
}

type IconName =
  | 'arrow'
  | 'bars'
  | 'briefcase'
  | 'download'
  | 'facebook'
  | 'folder'
  | 'instagram'
  | 'mail'
  | 'paper'
  | 'profile'
  | 'spark'

type IconProps = {
  className?: string
  name: IconName
}

const fallbackPortfolio: PortfolioData = {
  profile: {
    name: 'Hani Noor',
    role: 'UX/UI Designer',
    imageUrl: '',
  },
  about: {
    heading: 'About Me',
    text: 'I design clear, human-centered digital products for teams that need clean flows, calm interfaces, and polished prototypes. Recent work includes dashboards, onboarding systems, and design audits for growing product teams.',
    resumeUrl: '',
    imageUrl: '',
  },
  skills: [
    { label: 'UI Design', value: 88 },
    { label: 'UX Research', value: 76 },
    { label: 'Figma', value: 82 },
    { label: 'Prototyping', value: 74 },
    { label: 'HTML / CSS', value: 59 },
    { label: 'User Testing', value: 58 },
  ],
  experiences: [
    {
      role: 'Senior UX/UI Designer',
      company: 'NovaLane Studio',
      period: '2023 - Present',
      copy: 'Leading product discovery, interface systems, and prototype reviews for SaaS teams.',
      imageUrl: '',
    },
    {
      role: 'UX Designer',
      company: 'BrightGrid Labs',
      period: '2020 - 2023',
      copy: 'Mapped customer journeys, tested new onboarding flows, and improved dashboard clarity.',
      imageUrl: '',
    },
    {
      role: 'UI Designer',
      company: 'Pixel Harbor',
      period: '2018 - 2020',
      copy: 'Created mobile-first screens, visual guidelines, and reusable campaign components.',
      imageUrl: '',
    },
  ],
  projects: [
    {
      title: 'CareFlow Portal',
      copy: 'A low-friction patient intake dashboard for clinic coordinators.',
      imageUrl: '',
      imageUrls: [],
      linkText: 'View Project',
    },
    {
      title: 'MintPay Wallet',
      copy: 'A calm finance app concept with quick transfers and savings goals.',
      imageUrl: '',
      imageUrls: [],
      linkText: 'View Project',
    },
    {
      title: 'Studio Ops Board',
      copy: 'A planning workspace for creative teams managing launches.',
      imageUrl: '',
      imageUrls: [],
      linkText: 'View Project',
    },
  ],
}

const defaultAdminLoginState = {
  fullName: '',
  birthday: '',
}

async function apiJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed.')
  }

  return data as T
}

function assetUrl(url: string) {
  return url
}

function projectImages(project: ProjectData) {
  return [...new Set([...(project.imageUrls ?? []), project.imageUrl].filter(Boolean))]
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolveDataUrl, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolveDataUrl(String(reader.result)))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(file)
  })
}

function formatBirthdayForLogin(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return value
  }

  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {name === 'profile' && (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.1-4.1 3.4-6.2 7-6.2s5.9 2.1 7 6.2" />
        </>
      )}
      {name === 'briefcase' && (
        <>
          <rect x="4" y="7" width="16" height="12" rx="2" />
          <path d="M9 7V5.5C9 4.7 9.7 4 10.5 4h3C14.3 4 15 4.7 15 5.5V7" />
          <path d="M4 12h16" />
          <path d="M10 12v1h4v-1" />
        </>
      )}
      {name === 'bars' && (
        <>
          <path d="M5 20V14" />
          <path d="M10 20V10" />
          <path d="M15 20V6" />
          <path d="M20 20V4" />
          <path d="M4 20h17" />
        </>
      )}
      {name === 'folder' && (
        <path d="M3.5 18.5V6.8c0-.9.7-1.6 1.6-1.6h4.1l2 2.2h7.7c.9 0 1.6.7 1.6 1.6v9.5c0 .9-.7 1.6-1.6 1.6H5.1c-.9 0-1.6-.7-1.6-1.6Z" />
      )}
      {name === 'mail' && (
        <>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <path d="m4.5 8 7.5 5.6L19.5 8" />
        </>
      )}
      {name === 'facebook' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M13.6 8.2h1.9V5.7h-2.3c-2.4 0-3.7 1.4-3.7 3.8v1.7H7.7v2.6h1.8v5.5h2.8v-5.5h2.2l.4-2.6h-2.6V9.6c0-1 .4-1.4 1.3-1.4Z" />
        </>
      )}
      {name === 'instagram' && (
        <>
          <rect x="5" y="5" width="14" height="14" rx="4" />
          <circle cx="12" cy="12" r="3.2" />
          <path d="M16.4 8.1v.1" />
        </>
      )}
      {name === 'download' && (
        <>
          <path d="M12 4v10" />
          <path d="m8 10 4 4 4-4" />
          <path d="M5 19h14" />
        </>
      )}
      {name === 'spark' && (
        <>
          <path d="M12 3.5 14 10l6.5 2-6.5 2-2 6.5-2-6.5-6.5-2 6.5-2Z" />
          <path d="M19 3v4" />
          <path d="M21 5h-4" />
        </>
      )}
      {name === 'paper' && (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="m7 12.4 10-4.6-3.5 9-2.1-3.1-3.5-1.3Z" />
        </>
      )}
      {name === 'arrow' && (
        <>
          <path d="M5 12h13" />
          <path d="m13 6 6 6-6 6" />
        </>
      )}
    </svg>
  )
}

function ImagePlaceholder({
  alt,
  compact = false,
  src,
  srcs,
}: {
  alt: string
  compact?: boolean
  src?: string
  srcs?: string[]
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const images = [...new Set([...(srcs ?? []), src].filter(Boolean))]

  return (
    <div
      className={[
        compact ? 'image-placeholder compact' : 'image-placeholder',
        images.length > 1 ? 'multi-image' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {images.length > 1 ? (
        <div className="placeholder-gallery">
          <img className="gallery-main" src={images[activeIndex] ?? images[0]} alt={alt} />
          <div className="gallery-strip">
            {images.slice(0, 4).map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                className={activeIndex === index ? 'active-thumb' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActiveIndex(index)
                }}
              >
                <img src={image} alt="" />
              </button>
            ))}
            {images.length > 4 && <span>+{images.length - 4}</span>}
          </div>
        </div>
      ) : images[0] ? (
        <img src={images[0]} alt={alt} />
      ) : (
        <svg viewBox="0 0 220 140" aria-hidden="true" focusable="false">
          <circle cx="154" cy="35" r="12" />
          <path d="M42 106 88 48c6-7 14-7 20 0l33 41 18-20c6-6 13-6 18 0l28 37Z" />
        </svg>
      )}
    </div>
  )
}

function SidebarAdminCard({
  isAuthenticated,
  onLogout,
  onOpenAdmin,
}: {
  isAuthenticated: boolean
  onLogout: () => void
  onOpenAdmin: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  if (isAuthenticated) {
    return (
      <>
        <Icon name="spark" className="note-icon" />
        <p>Admin access is active.</p>
        <a href="/admin" onClick={onOpenAdmin}>
          Admin Panel
        </a>
        <button className="ghost-button" type="button" onClick={onLogout}>
          Log Out
        </button>
      </>
    )
  }

  return (
    <>
      <Icon name="spark" className="note-icon" />
      <p>Only the admin can access this section.</p>
      <a href="/admin" onClick={onOpenAdmin}>
        Admin Panel
      </a>
    </>
  )
}

function AdminLoginScreen({
  loginError,
  loginState,
  onLogin,
  onUpdateLogin,
}: {
  loginError: string
  loginState: { birthday: string; fullName: string }
  onLogin: (event: FormEvent<HTMLFormElement>) => void
  onUpdateLogin: (field: 'birthday' | 'fullName', value: string) => void
}) {
  return (
    <section className="panel admin-login-screen" id="admin-login">
      <div className="admin-login-copy">
        <Icon name="spark" className="login-screen-icon" />
        <h2>Admin Login</h2>
        <p>Enter the admin details to manage portfolio content.</p>
      </div>
      <form className="admin-login-form" onSubmit={onLogin}>
        <label>
          <span>Full Name</span>
          <input
            value={loginState.fullName}
            onChange={(event) => onUpdateLogin('fullName', event.target.value)}
            autoComplete="name"
            placeholder="Full Name"
          />
        </label>
        <label>
          <span>Birthday</span>
          <input
            type="date"
            value={loginState.birthday}
            onChange={(event) => onUpdateLogin('birthday', event.target.value)}
            autoComplete="bday"
          />
        </label>
        {loginError && <span className="form-error">{loginError}</span>}
        <button type="submit">Open Dashboard</button>
      </form>
    </section>
  )
}

function AdminDashboard({
  draft,
  isSaving,
  messages,
  messagesError,
  onDeleteMessage,
  onRefreshMessages,
  onLogout,
  saveMessage,
  setDraft,
  token,
  onSave,
}: {
  draft: PortfolioData
  isSaving: boolean
  messages: InboxMessage[]
  messagesError: string
  onDeleteMessage: (id: number) => void
  onRefreshMessages: () => void
  onLogout: () => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
  saveMessage: string
  setDraft: Dispatch<SetStateAction<PortfolioData>>
  token: string
}) {
  const [activeAdminSection, setActiveAdminSection] =
    useState<AdminSectionId>('messages')
  const [projectsPage, setProjectsPage] = useState(1)
  const [experiencesPage, setExperiencesPage] = useState(1)
  const activeAdminLabel =
    adminSections.find((section) => section.id === activeAdminSection)?.label ??
    'Dashboard'

  const updateProfile = (field: keyof ProfileData, value: string) => {
    setDraft((current) => ({
      ...current,
      profile: { ...current.profile, [field]: value },
    }))
  }

  const updateAbout = (field: keyof AboutData, value: string) => {
    setDraft((current) => ({
      ...current,
      about: { ...current.about, [field]: value },
    }))
  }

  const updateSkill = (index: number, field: keyof SkillData, value: string) => {
    setDraft((current) => ({
      ...current,
      skills: current.skills.map((skill, itemIndex) =>
        itemIndex === index
          ? {
              ...skill,
              [field]: field === 'value' ? Number(value) : value,
            }
          : skill,
      ),
    }))
  }

  const updateExperience = (
    index: number,
    field: keyof ExperienceData,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      experiences: current.experiences.map((experience, itemIndex) =>
        itemIndex === index ? { ...experience, [field]: value } : experience,
      ),
    }))
  }

  const updateProject = (
    index: number,
    field: 'copy' | 'imageUrl' | 'linkText' | 'title',
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      projects: current.projects.map((project, itemIndex) =>
        itemIndex === index ? { ...project, [field]: value } : project,
      ),
    }))
  }

  const updateProjectImages = (index: number, imageUrls: string[]) => {
    const firstImageUrl = imageUrls.map((url) => url.trim()).find(Boolean) ?? ''
    setDraft((current) => ({
      ...current,
      projects: current.projects.map((project, itemIndex) =>
        itemIndex === index
          ? {
              ...project,
              imageUrl: firstImageUrl,
              imageUrls,
            }
          : project,
      ),
    }))
  }

  const removeListItem = (
    listName: 'experiences' | 'projects' | 'skills',
    index: number,
  ) => {
    setDraft((current) => ({
      ...current,
      [listName]: current[listName].filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  return (
    <section className="panel admin-dashboard" id="admin-dashboard">
      <aside className="admin-dashboard-sidebar" aria-label="Dashboard sections">
        <div className="admin-sidebar-heading">
          <h2>Dashboard</h2>
          <p>{draft.profile.name}</p>
        </div>
        <nav className="admin-section-nav">
          {adminSections.map((section) => (
            <button
              aria-pressed={activeAdminSection === section.id}
              className={
                activeAdminSection === section.id
                  ? 'admin-section-button active'
                  : 'admin-section-button'
              }
              key={section.id}
              type="button"
              onClick={() => setActiveAdminSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <button className="admin-logout-button" type="button" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <form className="admin-editor-form" onSubmit={onSave}>
        <div className="admin-heading">
          <div>
            <h2>{activeAdminLabel}</h2>
            <p>Edit portfolio content saved in SQLite.</p>
          </div>
          {activeAdminSection !== 'messages' && (
            <button className="save-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
        {saveMessage && <p className="save-message">{saveMessage}</p>}

        {activeAdminSection === 'messages' && (
          <EditorGroup
            title="Message Box"
            action={
              <button type="button" onClick={onRefreshMessages}>
                Refresh
              </button>
            }
          >
            {messagesError && <p className="form-error">{messagesError}</p>}
            {messages.length === 0 ? (
              <p className="empty-message">No messages yet.</p>
            ) : (
              <div className="message-list">
                {messages.map((message) => (
                  <article className="message-card" key={message.id}>
                    <div>
                      <h3>{message.email}</h3>
                      <time>{new Date(message.createdAt).toLocaleString()}</time>
                    </div>
                    <p>{message.message}</p>
                    <button type="button" onClick={() => onDeleteMessage(message.id)}>
                      Delete Message
                    </button>
                  </article>
                ))}
              </div>
            )}
          </EditorGroup>
        )}

        {activeAdminSection === 'profile' && (
          <EditorGroup title="Profile">
            <TextField
              label="Profile Name"
              value={draft.profile.name}
              onChange={(value) => updateProfile('name', value)}
            />
            <TextField
              label="Role"
              value={draft.profile.role}
              onChange={(value) => updateProfile('role', value)}
            />
            <UploadField
              accept="image/png,image/jpeg,image/webp,image/gif"
              label="Profile Image"
              token={token}
              value={draft.profile.imageUrl}
              onUploaded={(url) => updateProfile('imageUrl', url)}
            />
          </EditorGroup>
        )}

        {activeAdminSection === 'about' && (
          <EditorGroup title="About">
            <TextField
              label="Heading"
              value={draft.about.heading}
              onChange={(value) => updateAbout('heading', value)}
            />
            <TextField
              label="About Text"
              multiline
              value={draft.about.text}
              onChange={(value) => updateAbout('text', value)}
            />
            <UploadField
              accept="image/png,image/jpeg,image/webp,image/gif"
              label="About Image"
              token={token}
              value={draft.about.imageUrl}
              onUploaded={(url) => updateAbout('imageUrl', url)}
            />
            <UploadField
              accept="application/pdf"
              label="Resume PDF"
              token={token}
              value={draft.about.resumeUrl}
              onUploaded={(url) => updateAbout('resumeUrl', url)}
            />
          </EditorGroup>
        )}

        {activeAdminSection === 'skills' && (
          <EditorGroup
            title="Skills"
            action={
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    skills: [...current.skills, { label: 'New Skill', value: 50 }],
                  }))
                }
              >
                Add Skill
              </button>
            }
          >
            {draft.skills.map((skill, index) => (
              <div className="editor-row two-column" key={`${skill.id ?? 'skill'}-${index}`}>
                <TextField
                  label="Skill"
                  value={skill.label}
                  onChange={(value) => updateSkill(index, 'label', value)}
                />
                <TextField
                  label="Percent"
                  type="number"
                  value={String(skill.value)}
                  onChange={(value) => updateSkill(index, 'value', value)}
                />
                <button type="button" onClick={() => removeListItem('skills', index)}>
                  Delete
                </button>
              </div>
            ))}
          </EditorGroup>
        )}

        {activeAdminSection === 'experience' && (
          <EditorGroup
            title="Experience"
            action={
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    experiences: [
                      ...current.experiences,
                      {
                        role: 'New Role',
                        company: 'Company Name',
                        period: '2026 - Present',
                        copy: 'Describe this role.',
                        imageUrl: '',
                      },
                    ],
                  }))
                }
              >
                Add Experience
              </button>
            }
          >
            {draft.experiences
              .map((experience, index) => ({ experience, index }))
              .slice((experiencesPage - 1) * 1, experiencesPage * 1)
              .map(({ experience, index }) => (
              <div className="editor-card" key={`${experience.id ?? 'experience'}-${index}`}>
                <div className="editor-row two-column">
                  <TextField
                    label="Role"
                    value={experience.role}
                    onChange={(value) => updateExperience(index, 'role', value)}
                  />
                  <TextField
                    label="Period"
                    value={experience.period}
                    onChange={(value) => updateExperience(index, 'period', value)}
                  />
                </div>
                <TextField
                  label="Company"
                  value={experience.company}
                  onChange={(value) => updateExperience(index, 'company', value)}
                />
                <TextField
                  label="Description"
                  multiline
                  value={experience.copy}
                  onChange={(value) => updateExperience(index, 'copy', value)}
                />
                <UploadField
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  label="Experience Image"
                  token={token}
                  value={experience.imageUrl}
                  onUploaded={(url) => updateExperience(index, 'imageUrl', url)}
                />
                <button
                  type="button"
                  onClick={() => removeListItem('experiences', index)}
                >
                  Delete Experience
                </button>
              </div>
            ))}
            {Math.ceil(draft.experiences.length / 1) > 1 && (
              <div className="pagination-controls" style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
                <button
                  type="button"
                  disabled={experiencesPage === 1}
                  onClick={() => setExperiencesPage((p) => Math.max(1, p - 1))}
                  className="ghost-button"
                >
                  Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  Page {experiencesPage} of {Math.ceil(draft.experiences.length / 1)}
                </span>
                <button
                  type="button"
                  disabled={experiencesPage === Math.ceil(draft.experiences.length / 1)}
                  onClick={() => setExperiencesPage((p) => Math.min(Math.ceil(draft.experiences.length / 1), p + 1))}
                  className="ghost-button"
                >
                  Next
                </button>
              </div>
            )}
          </EditorGroup>
        )}

        {activeAdminSection === 'projects' && (
          <EditorGroup
            title="Project Highlights"
            action={
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    projects: [
                      ...current.projects,
                      {
                        title: 'New Project',
                        copy: 'Describe this project.',
                        imageUrl: '',
                        imageUrls: [],
                        linkText: 'View Project',
                      },
                    ],
                  }))
                }
              >
                Add Project
              </button>
            }
          >
            {draft.projects
              .map((project, index) => ({ project, index }))
              .slice((projectsPage - 1) * 1, projectsPage * 1)
              .map(({ project, index }) => (
              <div className="editor-card" key={`${project.id ?? 'project'}-${index}`}>
                <div className="editor-row two-column">
                  <TextField
                    label="Project Title"
                    value={project.title}
                    onChange={(value) => updateProject(index, 'title', value)}
                  />
                  <TextField
                    label="Button Text"
                    value={project.linkText}
                    onChange={(value) => updateProject(index, 'linkText', value)}
                  />
                </div>
                <TextField
                  label="Description"
                  multiline
                  value={project.copy}
                  onChange={(value) => updateProject(index, 'copy', value)}
                />
                <ProjectImagesField
                  imageUrls={
                    project.imageUrls?.length
                      ? project.imageUrls
                      : project.imageUrl
                        ? [project.imageUrl]
                        : []
                  }
                  label="Project Images"
                  token={token}
                  onChange={(imageUrls) => updateProjectImages(index, imageUrls)}
                />
                <button type="button" onClick={() => removeListItem('projects', index)}>
                  Delete Project
                </button>
              </div>
            ))}
            {Math.ceil(draft.projects.length / 1) > 1 && (
              <div className="pagination-controls" style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
                <button
                  type="button"
                  disabled={projectsPage === 1}
                  onClick={() => setProjectsPage((p) => Math.max(1, p - 1))}
                  className="ghost-button"
                >
                  Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  Page {projectsPage} of {Math.ceil(draft.projects.length / 1)}
                </span>
                <button
                  type="button"
                  disabled={projectsPage === Math.ceil(draft.projects.length / 1)}
                  onClick={() => setProjectsPage((p) => Math.min(Math.ceil(draft.projects.length / 1), p + 1))}
                  className="ghost-button"
                >
                  Next
                </button>
              </div>
            )}
          </EditorGroup>
        )}
      </form>
    </section>
  )
}

function EditorGroup({
  action,
  children,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  title: string
}) {
  return (
    <fieldset className="editor-group">
      <legend>
        <span>{title}</span>
        {action}
      </legend>
      {children}
    </fieldset>
  )
}

function TextField({
  label,
  multiline = false,
  onChange,
  type = 'text',
  value,
}: {
  label: string
  multiline?: boolean
  onChange: (value: string) => void
  type?: 'number' | 'text'
  value: string
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input
          min={type === 'number' ? 0 : undefined}
          max={type === 'number' ? 100 : undefined}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}

function UploadField({
  accept,
  label,
  onUploaded,
  token,
  value,
}: {
  accept: string
  label: string
  onUploaded: (url: string) => void
  token: string
  value: string
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setFileName(file.name)
    setIsUploading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const result = await apiJson<{ url: string }>('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          dataUrl,
          fileName: file.name,
          mimeType: file.type,
        }),
      })
      onUploaded(result.url)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="admin-field upload-field">
      <span>{label}</span>
      <div className="upload-controls">
        <label className="upload-picker">
          <input
            accept={accept}
            className="file-input"
            type="file"
            onChange={handleUpload}
          />
          <span>Choose File</span>
        </label>
        <span className="upload-file-name">
          {isUploading ? 'Uploading...' : fileName || 'No file selected'}
        </span>
      </div>
      <input
        className="upload-path-input"
        value={value}
        onChange={(event) => onUploaded(event.target.value)}
        placeholder="/uploads/file.png"
      />
    </div>
  )
}

function ProjectImagesField({
  imageUrls,
  label,
  onChange,
  token,
}: {
  imageUrls: string[]
  label: string
  onChange: (imageUrls: string[]) => void
  token: string
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 5
  const totalPages = Math.ceil(imageUrls.length / pageSize)

  const updateImage = (index: number, value: string) => {
    onChange(imageUrls.map((imageUrl, itemIndex) => (itemIndex === index ? value : imageUrl)))
  }

  const removeImage = (index: number) => {
    onChange(imageUrls.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }

    setFileName(files.length === 1 ? files[0].name : `${files.length} files selected`)
    setIsUploading(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file)
        const result = await apiJson<{ url: string }>('/api/admin/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            dataUrl,
            fileName: file.name,
            mimeType: file.type,
          }),
        })
        uploadedUrls.push(result.url)
      }
      onChange([...imageUrls, ...uploadedUrls])
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="admin-field upload-field project-images-field">
      <span>{label}</span>
      <div className="upload-controls">
        <label className="upload-picker">
          <input
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="file-input"
            multiple
            type="file"
            onChange={handleUpload}
          />
          <span>Choose Files</span>
        </label>
        <span className="upload-file-name">
          {isUploading ? 'Uploading...' : fileName || 'No files selected'}
        </span>
      </div>
      <div className="project-image-list">
        {imageUrls.length === 0 ? (
          <p>No project images yet.</p>
        ) : (
          imageUrls
            .map((imageUrl, index) => ({ imageUrl, index }))
            .slice((page - 1) * pageSize, page * pageSize)
            .map(({ imageUrl, index }) => (
            <div className="project-image-row" key={`${imageUrl}-${index}`}>
              <input
                className="upload-path-input"
                value={imageUrl}
                onChange={(event) => updateImage(index, event.target.value)}
                placeholder="/uploads/project.png"
              />
              <button type="button" onClick={() => removeImage(index)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
      {imageUrls.length > pageSize && (
        <div className="pagination-controls" style={{ display: 'flex', gap: '8px', marginTop: '10px', marginBottom: '10px', justifyContent: 'center' }}>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="ghost-button"
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: '#626bae', fontWeight: 750 }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="ghost-button"
          >
            Next
          </button>
        </div>
      )}
      <button type="button" onClick={() => { onChange([...imageUrls, '']); setPage(Math.ceil((imageUrls.length + 1) / pageSize)); }}>
        Add Image URL
      </button>
    </div>
  )
}

function ProjectModal({
  onClose,
  project,
}: {
  onClose: () => void
  project: ProjectData
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-modal="true"
        className="modal-card project-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose}>
          Close
        </button>
        <ImagePlaceholder
          alt={`${project.title} visual`}
          srcs={projectImages(project).map(assetUrl)}
        />
        <div>
          <h2>{project.title}</h2>
          <p>{project.copy}</p>
        </div>
      </section>
    </div>
  )
}

function ContactModal({
  contactForm,
  contactStatus,
  isSending,
  onChange,
  onClose,
  onSubmit,
}: {
  contactForm: { email: string; message: string }
  contactStatus: string
  isSending: boolean
  onChange: (field: 'email' | 'message', value: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-modal="true"
        className="modal-card contact-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose}>
          Close
        </button>
        <div>
          <h2>Send a Message</h2>
          <p>Your message will appear in the admin dashboard message box.</p>
        </div>
        <form className="contact-form" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
            <input
              required
              type="email"
              value={contactForm.email}
              onChange={(event) => onChange('email', event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            <span>Message</span>
            <textarea
              required
              value={contactForm.message}
              onChange={(event) => onChange('message', event.target.value)}
              placeholder="Write your message"
            />
          </label>
          {contactStatus && <p className="modal-status">{contactStatus}</p>}
          <button type="submit" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </section>
    </div>
  )
}

function AdminPage({
  draft,
  isSaving,
  loginError,
  loginState,
  messages,
  messagesError,
  onBack,
  onDeleteMessage,
  onLogin,
  onLogout,
  onRefreshMessages,
  onSave,
  onUpdateLogin,
  saveMessage,
  setDraft,
  token,
}: {
  draft: PortfolioData
  isSaving: boolean
  loginError: string
  loginState: { birthday: string; fullName: string }
  messages: InboxMessage[]
  messagesError: string
  onBack: (event: MouseEvent<HTMLAnchorElement>) => void
  onDeleteMessage: (id: number) => void
  onLogin: (event: FormEvent<HTMLFormElement>) => void
  onLogout: () => void
  onRefreshMessages: () => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onUpdateLogin: (field: 'birthday' | 'fullName', value: string) => void
  saveMessage: string
  setDraft: Dispatch<SetStateAction<PortfolioData>>
  token: string
}) {
  return (
    <main className="admin-page">
      <div className="admin-shell">
        <a className="back-link" href="/" onClick={onBack}>
          Back to Portfolio
        </a>
        {token ? (
          <AdminDashboard
            draft={draft}
            isSaving={isSaving}
            messages={messages}
            messagesError={messagesError}
            saveMessage={saveMessage}
            setDraft={setDraft}
            token={token}
            onDeleteMessage={onDeleteMessage}
            onRefreshMessages={onRefreshMessages}
            onLogout={onLogout}
            onSave={onSave}
          />
        ) : (
          <AdminLoginScreen
            loginError={loginError}
            loginState={loginState}
            onLogin={onLogin}
            onUpdateLogin={onUpdateLogin}
          />
        )}
      </div>
    </main>
  )
}

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('about')
  const [portfolio, setPortfolio] = useState<PortfolioData>(fallbackPortfolio)
  const [draft, setDraft] = useState<PortfolioData>(fallbackPortfolio)
  const [token, setToken] = useState('')
  const [loginState, setLoginState] = useState(defaultAdminLoginState)
  const [loginError, setLoginError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [route, setRoute] = useState(() => window.location.pathname)
  const [activeProject, setActiveProject] = useState<ProjectData | null>(null)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ email: '', message: '' })
  const [contactStatus, setContactStatus] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [messagesError, setMessagesError] = useState('')
  const [projectIndex, setProjectIndex] = useState(0)

  useEffect(() => {
    apiJson<PortfolioData>('/api/portfolio')
      .then((data) => {
        setPortfolio(data)
        setDraft(data)
      })
      .catch((error: Error) => setLoadError(error.message))
  }, [])

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    setProjectIndex((current) =>
      Math.min(current, Math.max(portfolio.projects.length - 1, 0)),
    )
  }, [portfolio.projects.length])

  const navigateTo = (path: '/' | '/admin') => {
    window.history.pushState(null, '', path)
    setRoute(path)
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  const loadMessages = async (adminToken = token) => {
    if (!adminToken) {
      return
    }

    setMessagesError('')
    try {
      const data = await apiJson<InboxMessage[]>('/api/admin/messages', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      setMessages(data)
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : 'Failed to load messages.')
    }
  }

  const handleNavClick = (
    event: MouseEvent<HTMLAnchorElement>,
    target: SectionId,
  ) => {
    event.preventDefault()
    if (route !== '/') {
      navigateTo('/')
    }
    setActiveSection(target)
    requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
    window.history.replaceState(null, '', `#${target}`)
  }

  const handleOpenAdmin = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    navigateTo('/admin')
  }

  const handleBackToPortfolio = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    navigateTo('/')
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError('')
    try {
      const result = await apiJson<{ portfolio: PortfolioData; token: string }>(
        '/api/admin/login',
        {
          method: 'POST',
          body: JSON.stringify({
            ...loginState,
            birthday: formatBirthdayForLogin(loginState.birthday),
          }),
        },
      )
      setToken(result.token)
      setPortfolio(result.portfolio)
      setDraft(result.portfolio)
      setActiveSection('about')
      void loadMessages(result.token)
      navigateTo('/admin')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed.')
    }
  }

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSendingMessage(true)
    setContactStatus('')
    try {
      await apiJson<{ ok: boolean }>('/api/messages', {
        method: 'POST',
        body: JSON.stringify(contactForm),
      })
      setContactStatus('Message sent.')
      setContactForm({ email: '', message: '' })
      if (token) {
        void loadMessages()
      }
    } catch (error) {
      setContactStatus(error instanceof Error ? error.message : 'Message could not be sent.')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleDeleteMessage = async (id: number) => {
    setMessagesError('')
    try {
      const data = await apiJson<InboxMessage[]>(`/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages(data)
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : 'Message could not be deleted.')
    }
  }

  const moveProjectCarousel = (direction: -1 | 1) => {
    setProjectIndex((current) => {
      const count = portfolio.projects.length
      if (count === 0) {
        return 0
      }

      return (current + direction + count) % count
    })
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setSaveMessage('')
    try {
      const saved = await apiJson<PortfolioData>('/api/admin/portfolio', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      })
      setPortfolio(saved)
      setDraft(saved)
      setSaveMessage('Saved.')
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Save failed.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setLoginState(defaultAdminLoginState)
    setLoginError('')
    setSaveMessage('')
    setMessages([])
    setMessagesError('')
  }

  if (route === '/admin') {
    return (
      <AdminPage
        draft={draft}
        isSaving={isSaving}
        loginError={loginError}
        loginState={loginState}
        messages={messages}
        messagesError={messagesError}
        saveMessage={saveMessage}
        setDraft={setDraft}
        token={token}
        onBack={handleBackToPortfolio}
        onDeleteMessage={handleDeleteMessage}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onRefreshMessages={() => void loadMessages()}
        onSave={handleSave}
        onUpdateLogin={(field, value) =>
          setLoginState((current) => ({ ...current, [field]: value }))
        }
      />
    )
  }

  return (
    <main className="portfolio-page">
      <div className="portfolio-frame">
        <aside className="sidebar" aria-label="Portfolio navigation">
          <div className="profile-card">
            <div className="avatar" aria-hidden="true">
              {portfolio.profile.imageUrl ? (
                <img
                  className="avatar-photo"
                  src={assetUrl(portfolio.profile.imageUrl)}
                  alt=""
                />
              ) : (
                <>
                  <div className="avatar-head" />
                  <div className="avatar-body" />
                </>
              )}
            </div>
            <h1>{portfolio.profile.name}</h1>
            <p>{portfolio.profile.role}</p>
          </div>

          <nav className="side-nav">
            {navItems.map((item) => (
              <a
                aria-current={
                  activeSection === item.target ? 'page' : undefined
                }
                className={
                  activeSection === item.target ? 'nav-link active' : 'nav-link'
                }
                href={`#${item.target}`}
                key={item.label}
                onClick={(event) => handleNavClick(event, item.target)}
              >
                <Icon name={item.icon} className="nav-icon" />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <section className="skill-panel" id="skills" aria-label="Skills">
            <h2>Skills</h2>
            <div className="skill-list">
              {portfolio.skills.map((skill, index) => (
                <div className="skill-row" key={`${skill.id ?? 'skill'}-${index}`}>
                  <span>{skill.label}</span>
                  <div className="skill-track" aria-hidden="true">
                    <div style={{ width: `${skill.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sidebar-note">
            <SidebarAdminCard
              isAuthenticated={Boolean(token)}
              onLogout={handleLogout}
              onOpenAdmin={handleOpenAdmin}
            />
          </section>
        </aside>

        <section className="content">
          <header className="top-bar" aria-label="Social links">
            <a href="https://www.facebook.com" aria-label="Facebook">
              <Icon name="facebook" />
            </a>
            <a href="https://www.instagram.com" aria-label="Instagram">
              <Icon name="instagram" />
            </a>
            <a href="mailto:hello@example.com" aria-label="Email">
              <Icon name="mail" />
            </a>
          </header>

          {loadError && <p className="load-error">{loadError}</p>}

          <section className="panel about-panel" id="about">
                <div>
                  <h2>{portfolio.about.heading}</h2>
                  <p>{portfolio.about.text}</p>
                  <a
                    className="soft-button"
                    download={portfolio.about.resumeUrl ? true : undefined}
                    href={
                      portfolio.about.resumeUrl
                        ? assetUrl(portfolio.about.resumeUrl)
                        : '#contact'
                    }
                  >
                    <span>Download Resume</span>
                    <Icon name="download" />
                  </a>
                </div>
                <ImagePlaceholder
                  alt={`${portfolio.about.heading} visual`}
                  src={assetUrl(portfolio.about.imageUrl)}
                />
              </section>

              <section className="panel experience-panel" id="experience">
                <h2>Experience</h2>
                <div className="timeline">
                  {portfolio.experiences.map((job, index) => (
                    <article
                      className="timeline-item"
                      key={`${job.id ?? 'experience'}-${index}`}
                    >
                      <ImagePlaceholder
                        compact
                        alt={`${job.role} visual`}
                        src={assetUrl(job.imageUrl)}
                      />
                      <div className="job-copy">
                        <div className="job-heading">
                          <h3>{job.role}</h3>
                          <span>{job.period}</span>
                        </div>
                        <p className="company">{job.company}</p>
                        <p>{job.copy}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel projects-panel" id="projects">
                <div className="projects-heading">
                  <h2>Project Highlights</h2>
                  {portfolio.projects.length > 1 && (
                    <div className="carousel-controls" aria-label="Project controls">
                      <button
                        aria-label="Previous project"
                        type="button"
                        onClick={() => moveProjectCarousel(-1)}
                      >
                        <Icon name="arrow" />
                      </button>
                      <button
                        aria-label="Next project"
                        type="button"
                        onClick={() => moveProjectCarousel(1)}
                      >
                        <Icon name="arrow" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="project-carousel" aria-label="Project carousel">
                  <div className="project-carousel-window">
                    <div
                      className="project-carousel-track"
                      style={{ transform: `translateX(-${projectIndex * 100}%)` }}
                    >
                      {portfolio.projects.map((project, index) => (
                        <article
                          aria-hidden={projectIndex !== index}
                          className="project-card carousel-slide"
                          key={`${project.id ?? 'project'}-${index}`}
                        >
                          <ImagePlaceholder
                            compact
                            alt={`${project.title} visual`}
                            srcs={projectImages(project).map(assetUrl)}
                          />
                          <div>
                            <h3>{project.title}</h3>
                            <p>{project.copy}</p>
                            <button
                              type="button"
                              onClick={() => setActiveProject(project)}
                            >
                              <span>View Project</span>
                              <Icon name="arrow" />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                  {portfolio.projects.length > 1 && (
                    <div className="carousel-dots" aria-label="Project slides">
                      {portfolio.projects.map((project, index) => (
                        <button
                          aria-label={`Show ${project.title}`}
                          aria-current={projectIndex === index ? 'true' : undefined}
                          className={projectIndex === index ? 'active' : undefined}
                          key={`${project.id ?? 'dot'}-${index}`}
                          type="button"
                          onClick={() => setProjectIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="contact-band" id="contact">
                <div className="contact-icon" aria-hidden="true">
                  <Icon name="paper" />
                </div>
                <div>
                  <h2>Interested in working together?</h2>
                  <p>
                    I'm currently open to new opportunities. Let's build something
                    great.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContactStatus('')
                    setIsContactOpen(true)
                  }}
                >
                  <span>Contact Me</span>
                  <Icon name="arrow" />
                </button>
              </section>

              <footer>
                &copy; 2026 {portfolio.profile.name}. All rights reserved.
              </footer>
        </section>
      </div>
      {activeProject && (
        <ProjectModal
          project={activeProject}
          onClose={() => setActiveProject(null)}
        />
      )}
      {isContactOpen && (
        <ContactModal
          contactForm={contactForm}
          contactStatus={contactStatus}
          isSending={isSendingMessage}
          onChange={(field, value) =>
            setContactForm((current) => ({ ...current, [field]: value }))
          }
          onClose={() => setIsContactOpen(false)}
          onSubmit={handleContactSubmit}
        />
      )}
    </main>
  )
}

export default App
