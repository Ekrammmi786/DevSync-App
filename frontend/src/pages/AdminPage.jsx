import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogout } from '../hooks/useAuth';
import {
  useAdminDashboard,
  useAdminUsers,
  useAdminFriendRequests,
  useAdminSettings,
  useDeleteAdminUser,
  useToggleAdmin,
  useUpdateAdminSettings,
  useSetMaintenance,
} from '../hooks/useAdmin';

const AdminPage = () => {
  const { mutate: logout } = useLogout();
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');

  const { data: dashboardData, isLoading: dashLoading } = useAdminDashboard();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(search ? { search } : { limit: 20 });
  const { data: requestsData, isLoading: reqLoading } = useAdminFriendRequests({ limit: 20 });
  const { data: settingsData, isLoading: settingsLoading } = useAdminSettings();

  const { mutate: deleteUser } = useDeleteAdminUser();
  const { mutate: toggleAdmin } = useToggleAdmin();
  const { mutate: updateSettings } = useUpdateAdminSettings();
  const { mutate: setMaintenance } = useSetMaintenance();

  const [settingsForm, setSettingsForm] = useState(null);
  const settings = settingsData?.data;

  const dashboard = dashboardData?.data;
  const users = usersData?.data ?? [];
  const requests = requestsData?.data ?? [];

  const handleSettingsChange = (e) => {
    setSettingsForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveSettings = () => {
    updateSettings(settingsForm || {});
  };

  const handleMaintenance = (mode) => {
    setMaintenance({ maintenanceMode: mode });
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-30">
        <div className="navbar-start">
          <Link to="/dashboard" className="flex items-center gap-2 px-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg text-primary">DevSync Admin</span>
          </Link>
        </div>
        <div className="navbar-end">
          <button onClick={() => logout()} className="btn btn-ghost btn-sm">Logout</button>
        </div>
      </div>

      <div className="flex">
        <div className="w-56 bg-base-100 min-h-screen border-r border-base-300 hidden md:block">
          <ul className="menu p-4 gap-1">
            <li><button onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'active' : ''}>📊 Dashboard</button></li>
            <li><button onClick={() => setTab('users')} className={tab === 'users' ? 'active' : ''}>👥 Users</button></li>
            <li><button onClick={() => setTab('requests')} className={tab === 'requests' ? 'active' : ''}>📩 Friend Requests</button></li>
            <li><button onClick={() => setTab('settings')} className={tab === 'settings' ? 'active' : ''}>⚙️ Settings</button></li>
          </ul>
        </div>

        <main className="flex-1 p-4 sm:p-6">
          <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
            {['dashboard', 'users', 'requests', 'settings'].map((t) => (
              <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
                {t === 'dashboard' ? '📊' : t === 'users' ? '👥' : t === 'requests' ? '📩' : '⚙️'} {t}
              </button>
            ))}
          </div>

          {tab === 'dashboard' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-base-content">Dashboard</h1>
              {dashLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (<div key={i} className="card bg-base-100 shadow-xl animate-pulse h-24"></div>))}
                </div>
              ) : dashboard ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card bg-base-100 shadow-xl"><div className="card-body"><p className="text-3xl font-bold text-primary">{dashboard.users?.total ?? 0}</p><p className="text-sm text-base-content/60">Total Users</p></div></div>
                    <div className="card bg-base-100 shadow-xl"><div className="card-body"><p className="text-3xl font-bold text-primary">{dashboard.users?.onboarded ?? 0}</p><p className="text-sm text-base-content/60">Onboarded</p></div></div>
                    <div className="card bg-base-100 shadow-xl"><div className="card-body"><p className="text-3xl font-bold text-primary">{dashboard.users?.verified ?? 0}</p><p className="text-sm text-base-content/60">Verified</p></div></div>
                    <div className="card bg-base-100 shadow-xl"><div className="card-body"><p className="text-3xl font-bold text-primary">{dashboard.users?.today ?? 0}</p><p className="text-sm text-base-content/60">New Today</p></div></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card bg-base-100 shadow-xl"><div className="card-body"><p className="text-3xl font-bold text-primary">{dashboard.friendRequests?.total ?? 0}</p><p className="text-sm text-base-content/60">Total Requests</p></div></div>
                    <div className="card bg-base-100 shadow-xl"><div className="card-body"><p className="text-3xl font-bold text-warning">{dashboard.friendRequests?.pending ?? 0}</p><p className="text-sm text-base-content/60">Pending</p></div></div>
                    <div className="card bg-base-100 shadow-xl"><div className="card-body"><p className="text-3xl font-bold text-success">{dashboard.friendRequests?.accepted ?? 0}</p><p className="text-sm text-base-content/60">Accepted</p></div></div>
                    <div className="card bg-base-100 shadow-xl"><div className="card-body"><p className="text-3xl font-bold text-error">{dashboard.friendRequests?.rejected ?? 0}</p><p className="text-sm text-base-content/60">Rejected</p></div></div>
                  </div>
                </>
              ) : (
                <div className="card bg-base-100 shadow-xl"><div className="card-body text-center text-base-content/60">Error loading dashboard</div></div>
              )}
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-base-content">Users</h1>
                <input
                  type="text"
                  className="input input-bordered input-sm sm:w-64"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {usersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (<div key={i} className="card bg-base-100 shadow-xl animate-pulse h-16"></div>))}
                </div>
              ) : users.length ? (
                <div className="card bg-base-100 shadow-xl overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="avatar"><div className="w-9 rounded-full"><img src={u.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt={u.fullname} /></div></div>
                              <div>
                                <p className="font-medium text-sm">{u.fullname}</p>
                                <p className="text-xs text-base-content/50">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-sm">{u.role || 'Developer'}</td>
                          <td>
                            <div className="flex flex-col gap-1">
                              {u.isAdmin && <span className="badge badge-primary badge-sm">Admin</span>}
                              {u.isVerified && <span className="badge badge-success badge-sm">Verified</span>}
                              {u.isOnBoarded ? <span className="badge badge-info badge-sm">Onboarded</span> : <span className="badge badge-ghost badge-sm">Not onboarded</span>}
                            </div>
                          </td>
                          <td className="font-semibold">{u.devScore ?? 0}</td>
                          <td>
                            <div className="flex gap-2">
                              <button className="btn btn-xs" onClick={() => toggleAdmin(u._id)}>
                                {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                              </button>
                              <button className="btn btn-xs btn-error" onClick={() => deleteUser(u._id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card bg-base-100 shadow-xl"><div className="card-body text-center text-base-content/60">No users found</div></div>
              )}
            </div>
          )}

          {tab === 'requests' && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-base-content">Friend Requests</h1>
              {reqLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (<div key={i} className="card bg-base-100 shadow-xl animate-pulse h-16"></div>))}
                </div>
              ) : requests.length ? (
                <div className="card bg-base-100 shadow-xl overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Sender</th>
                        <th>Recipient</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r._id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar"><div className="w-8 rounded-full"><img src={r.sender?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt={r.sender?.fullname} /></div></div>
                              <span className="text-sm">{r.sender?.fullname || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar"><div className="w-8 rounded-full"><img src={r.recipient?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt={r.recipient?.fullname} /></div></div>
                              <span className="text-sm">{r.recipient?.fullname || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${r.status === 'accepted' ? 'badge-success' : r.status === 'pending' ? 'badge-warning' : 'badge-error'} badge-sm`}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card bg-base-100 shadow-xl"><div className="card-body text-center text-base-content/60">No friend requests</div></div>
              )}
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-base-content">Settings</h1>
              {settingsLoading ? (
                <div className="card bg-base-100 shadow-xl animate-pulse h-40"></div>
              ) : settings ? (
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body space-y-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">App Name</span></label>
                      <input type="text" name="appName" className="input input-bordered" defaultValue={settings.appName || 'DevSync'} onChange={handleSettingsChange} />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">App Version</span></label>
                      <input type="text" name="appVersion" className="input input-bordered" defaultValue={settings.appVersion || ''} onChange={handleSettingsChange} />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Announcement</span></label>
                      <textarea name="announcement" className="textarea textarea-bordered" defaultValue={settings.announcement || ''} onChange={handleSettingsChange}></textarea>
                    </div>
                    <button className="btn btn-primary" onClick={saveSettings}>Save Settings</button>

                    <div className="divider"></div>
                    <h3 className="font-semibold">Maintenance Mode</h3>
                    <div className="flex gap-2">
                      <button className="btn btn-warning" onClick={() => handleMaintenance(true)}>Turn ON Maintenance</button>
                      <button className="btn btn-success" onClick={() => handleMaintenance(false)}>Turn OFF Maintenance</button>
                    </div>
                    <p className="text-sm text-base-content/60">
                      Current status: {settings.maintenanceMode ? <span className="badge badge-warning badge-sm">MAINTENANCE ON</span> : <span className="badge badge-success badge-sm">LIVE</span>}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card bg-base-100 shadow-xl"><div className="card-body text-center text-base-content/60">Error loading settings</div></div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
