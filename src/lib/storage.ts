import { Bounty, Application, Submission, Notification, Profile } from '../types/database'
import { DEMO_USER, INITIAL_BOUNTIES, INITIAL_APPLICATIONS, INITIAL_SUBMISSIONS, INITIAL_NOTIFICATIONS, MOCK_PROFILES } from './mockData'

const STORAGE_KEYS = {
  BOUNTIES: 'vaultwork_bounties_v1',
  APPLICATIONS: 'vaultwork_applications_v1',
  SUBMISSIONS: 'vaultwork_submissions_v1',
  NOTIFICATIONS: 'vaultwork_notifications_v1',
  PROFILES: 'vaultwork_profiles_v1',
  CURRENT_USER: 'vaultwork_current_user_v1',
  AUTH_SESSION: 'vaultwork_auth_session_v1',
}

export class LocalStore {
  // Profiles
  static getProfiles(): Record<string, Profile> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILES)
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(MOCK_PROFILES))
        return MOCK_PROFILES
      }
      return JSON.parse(data)
    } catch {
      return MOCK_PROFILES
    }
  }

  static getProfile(id: string): Profile | null {
    const profiles = this.getProfiles()
    return profiles[id] || null
  }

  static updateProfile(profile: Partial<Profile> & { id: string }): Profile {
    const profiles = this.getProfiles()
    const existing = profiles[profile.id] || {
      id: profile.id,
      username: 'user_' + profile.id.slice(0, 6),
      display_name: 'Builder',
      skills: [],
      created_at: new Date().toISOString()
    }
    const updated = { ...existing, ...profile, updated_at: new Date().toISOString() }
    profiles[profile.id] = updated
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles))

    // If updating current user
    const currentUser = this.getCurrentUser()
    if (currentUser && currentUser.id === profile.id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated))
    }
    return updated
  }

  static getCurrentUser(): Profile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      if (!data) {
        // default to DEMO_USER
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USER))
        return DEMO_USER
      }
      return JSON.parse(data)
    } catch {
      return DEMO_USER
    }
  }

  static setCurrentUser(user: Profile | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    }
  }

  // Bounties
  static getBounties(): Bounty[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOUNTIES)
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BOUNTIES, JSON.stringify(INITIAL_BOUNTIES))
        return INITIAL_BOUNTIES
      }
      return JSON.parse(data)
    } catch {
      return INITIAL_BOUNTIES
    }
  }

  static getBounty(id: string): Bounty | null {
    const list = this.getBounties()
    return list.find(b => b.id === id) || null
  }

  static saveBounty(bountyData: Omit<Bounty, 'id' | 'created_at' | 'applications_count'> & { id?: string }): Bounty {
    const list = this.getBounties()
    const profiles = this.getProfiles()
    const creator = profiles[bountyData.creator_id] || this.getCurrentUser() || DEMO_USER

    if (bountyData.id) {
      const index = list.findIndex(b => b.id === bountyData.id)
      if (index !== -1) {
        const updated: Bounty = {
          ...list[index],
          ...bountyData,
          creator,
          updated_at: new Date().toISOString()
        }
        list[index] = updated
        localStorage.setItem(STORAGE_KEYS.BOUNTIES, JSON.stringify(list))
        return updated
      }
    }

    const newBounty: Bounty = {
      ...bountyData,
      id: 'bounty-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      created_at: new Date().toISOString(),
      applications_count: 0,
      creator,
    }
    list.unshift(newBounty)
    localStorage.setItem(STORAGE_KEYS.BOUNTIES, JSON.stringify(list))
    return newBounty
  }

  static updateBountyStatus(bountyId: string, status: Bounty['status'], assignedDeveloperId?: string | null): Bounty | null {
    const list = this.getBounties()
    const index = list.findIndex(b => b.id === bountyId)
    if (index === -1) return null

    const profiles = this.getProfiles()
    const assignedDeveloper = assignedDeveloperId ? profiles[assignedDeveloperId] : (assignedDeveloperId === null ? undefined : list[index].assigned_developer)

    const updated: Bounty = {
      ...list[index],
      status,
      assigned_developer_id: assignedDeveloperId !== undefined ? assignedDeveloperId : list[index].assigned_developer_id,
      assigned_developer: assignedDeveloper,
      updated_at: new Date().toISOString()
    }
    list[index] = updated
    localStorage.setItem(STORAGE_KEYS.BOUNTIES, JSON.stringify(list))
    return updated
  }

  // Applications
  static getApplications(bountyId?: string): Application[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS)
      let list: Application[] = data ? JSON.parse(data) : INITIAL_APPLICATIONS
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS))
      }
      if (bountyId) {
        return list.filter(a => a.bounty_id === bountyId)
      }
      return list
    } catch {
      return INITIAL_APPLICATIONS
    }
  }

  static getDeveloperApplications(developerId: string): Application[] {
    const list = this.getApplications()
    return list.filter(a => a.developer_id === developerId)
  }

  static submitApplication(appData: Omit<Application, 'id' | 'created_at' | 'status'>): Application {
    const list = this.getApplications()
    const profiles = this.getProfiles()
    const developer = profiles[appData.developer_id] || this.getCurrentUser() || DEMO_USER
    const bounty = this.getBounty(appData.bounty_id)

    if (bounty) {
      // Validate self-application
      if (bounty.creator_id === appData.developer_id) {
        throw new Error('Creators cannot apply to their own bounties.')
      }

      // Validate status
      if (bounty.status !== 'open') {
        throw new Error('Applications can only be submitted to open bounties.')
      }

      // Validate deadline
      if (new Date(bounty.deadline).getTime() < Date.now()) {
        throw new Error('Cannot apply to a bounty with an expired deadline.')
      }
    }

    // Check for duplicate
    const existing = list.find(a => a.bounty_id === appData.bounty_id && a.developer_id === appData.developer_id && a.status !== 'withdrawn')
    if (existing) {
      throw new Error('You have already applied to this bounty.')
    }

    const newApp: Application = {
      ...appData,
      id: 'app-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      status: 'pending',
      created_at: new Date().toISOString(),
      developer,
      bounty: bounty || undefined
    }

    list.unshift(newApp)
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(list))

    // Increment bounty applications_count
    if (bounty) {
      const bounties = this.getBounties()
      const bIndex = bounties.findIndex(b => b.id === bounty.id)
      if (bIndex !== -1) {
        bounties[bIndex].applications_count += 1
        localStorage.setItem(STORAGE_KEYS.BOUNTIES, JSON.stringify(bounties))
      }

      // Notify creator
      this.createNotification({
        user_id: bounty.creator_id,
        title: 'New Proposal Received',
        message: `${developer.display_name} applied to your bounty "${bounty.title}".`,
        type: 'application_received',
        link: `/bounties/${bounty.id}`,
      })
    }

    return newApp
  }

  static updateApplicationStatus(appId: string, status: Application['status']): Application | null {
    const list = this.getApplications()
    const index = list.findIndex(a => a.id === appId)
    if (index === -1) return null

    list[index].status = status
    list[index].updated_at = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(list))

    const app = list[index]
    const bounty = this.getBounty(app.bounty_id)

    // Notify developer
    if (bounty) {
      if (status === 'accepted') {
        this.createNotification({
          user_id: app.developer_id,
          title: 'Proposal Accepted! 🎉',
          message: `Congratulations! Your proposal for "${bounty.title}" was accepted. Head to the Workroom to start.`,
          type: 'application_accepted',
          link: `/work/${bounty.id}`,
        })
      } else if (status === 'rejected') {
        this.createNotification({
          user_id: app.developer_id,
          title: 'Proposal Status Update',
          message: `Another candidate was selected for "${bounty.title}". Thank you for your application!`,
          type: 'application_rejected',
          link: `/bounties/${bounty.id}`,
        })
      }
    }

    return app
  }

  static selectDeveloper(bountyId: string, applicationId: string, developerId: string, callerId?: string): boolean {
    const bounty = this.getBounty(bountyId)
    if (!bounty) throw new Error('Bounty not found.')
    if (callerId && bounty.creator_id !== callerId) {
      throw new Error('Unauthorized: only the bounty creator can select a developer.')
    }
    if (bounty.status !== 'open') {
      throw new Error(`Bounty is not open for selection (status: ${bounty.status}).`)
    }

    const apps = this.getApplications(bountyId)
    const targetApp = apps.find(a => a.id === applicationId)
    if (!targetApp) throw new Error('Application not found.')
    if (targetApp.status !== 'pending') {
      throw new Error(`Application is not pending (status: ${targetApp.status}).`)
    }

    // Accept selected application
    this.updateApplicationStatus(applicationId, 'accepted')

    // Reject all other pending applications for this bounty
    apps.forEach(a => {
      if (a.id !== applicationId && a.status === 'pending') {
        this.updateApplicationStatus(a.id, 'rejected')
      }
    })

    // Update bounty to in_progress with assigned developer
    this.updateBountyStatus(bountyId, 'in_progress', developerId)

    return true
  }

  // Submissions (Workroom)
  static getSubmissions(bountyId: string): Submission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)
      let list: Submission[] = data ? JSON.parse(data) : INITIAL_SUBMISSIONS
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS))
      }
      return list.filter(s => s.bounty_id === bountyId)
    } catch {
      return INITIAL_SUBMISSIONS.filter(s => s.bounty_id === bountyId)
    }
  }

  static createSubmission(subData: Omit<Submission, 'id' | 'created_at' | 'status'>): Submission {
    const list = this.getAllSubmissions()
    const profiles = this.getProfiles()
    const developer = profiles[subData.developer_id] || this.getCurrentUser() || DEMO_USER
    const bounty = this.getBounty(subData.bounty_id)

    if (bounty) {
      if (bounty.assigned_developer_id && bounty.assigned_developer_id !== subData.developer_id) {
        throw new Error('Unauthorized: you are not the assigned developer for this bounty.')
      }
      if (bounty.status !== 'in_progress' && bounty.status !== 'in_review') {
        throw new Error('Deliverables can only be submitted when bounty is in progress.')
      }
    }

    const newSub: Submission = {
      ...subData,
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      status: 'submitted',
      created_at: new Date().toISOString(),
      developer,
    }

    list.unshift(newSub)
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list))

    // Update bounty status to in_review
    if (bounty) {
      this.updateBountyStatus(bounty.id, 'in_review')
      this.createNotification({
        user_id: bounty.creator_id,
        title: 'Deliverables Submitted for Review',
        message: `${developer.display_name} has submitted deliverables for "${bounty.title}". Review in the Workroom.`,
        type: 'work_submitted',
        link: `/work/${bounty.id}`,
      })
    }

    return newSub
  }

  static updateSubmissionReview(submissionId: string, status: Submission['status'], feedback?: string, reviewerId?: string): Submission | null {
    const list = this.getAllSubmissions()
    const index = list.findIndex(s => s.id === submissionId)
    if (index === -1) return null

    const sub = list[index]
    const bounty = this.getBounty(sub.bounty_id)

    if (bounty && reviewerId && bounty.creator_id !== reviewerId) {
      throw new Error('Unauthorized: only the creator can review submissions.')
    }

    list[index].status = status
    if (feedback !== undefined) {
      list[index].feedback = feedback
    }
    list[index].updated_at = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list))

    if (bounty) {
      if (status === 'approved') {
        this.updateBountyStatus(bounty.id, 'completed')

        // Update developer profile metrics
        const devProfile = this.getProfile(sub.developer_id)
        if (devProfile) {
          const earned = (devProfile.total_earned_usd || 0) + (bounty.reward_amount || 0)
          const completed = (devProfile.bounties_completed || 0) + 1
          this.updateProfile({
            id: sub.developer_id,
            bounties_completed: completed,
            total_earned_usd: earned
          })
        }

        this.createNotification({
          user_id: sub.developer_id,
          title: 'Work Approved & Escrow Released! 💰',
          message: `The creator approved your deliverables for "${bounty.title}". ${bounty.reward_amount} ${bounty.reward_currency} has been credited.`,
          type: 'bounty_completed',
          link: `/work/${bounty.id}`,
        })
      } else if (status === 'revision_requested') {
        this.updateBountyStatus(bounty.id, 'in_progress')
        this.createNotification({
          user_id: sub.developer_id,
          title: 'Revision Requested on Deliverables',
          message: `The creator reviewed your submission for "${bounty.title}" and requested modifications. Check the Workroom for details.`,
          type: 'revision_requested',
          link: `/work/${bounty.id}`,
        })
      }
    }

    return sub
  }

  private static getAllSubmissions(): Submission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)
      return data ? JSON.parse(data) : INITIAL_SUBMISSIONS
    } catch {
      return INITIAL_SUBMISSIONS
    }
  }

  // Notifications
  static getNotifications(userId: string): Notification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
      let list: Notification[] = data ? JSON.parse(data) : INITIAL_NOTIFICATIONS
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS))
      }
      return list.filter(n => n.user_id === userId)
    } catch {
      return INITIAL_NOTIFICATIONS.filter(n => n.user_id === userId)
    }
  }

  static markNotificationRead(notifId: string): void {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    let list: Notification[] = data ? JSON.parse(data) : INITIAL_NOTIFICATIONS
    const item = list.find(n => n.id === notifId)
    if (item) {
      item.read = true
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list))
    }
  }

  static markAllNotificationsRead(userId: string): void {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    let list: Notification[] = data ? JSON.parse(data) : INITIAL_NOTIFICATIONS
    list.forEach(n => {
      if (n.user_id === userId) n.read = true
    })
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list))
  }

  static createNotification(notifData: Omit<Notification, 'id' | 'created_at' | 'read'>): Notification {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    let list: Notification[] = data ? JSON.parse(data) : INITIAL_NOTIFICATIONS

    const newNotif: Notification = {
      ...notifData,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      read: false,
      created_at: new Date().toISOString()
    }
    list.unshift(newNotif)
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list))
    return newNotif
  }

  // Reset to default seed
  static resetDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.BOUNTIES, JSON.stringify(INITIAL_BOUNTIES))
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS))
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS))
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS))
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(MOCK_PROFILES))
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USER))
  }
}
