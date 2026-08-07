import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const toCommaString = (arr) =>
  Array.isArray(arr) ? arr.join(', ') : (arr || '');

const OnboardingPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [form, setForm] = useState({
    fullname: user?.fullname || '',
    bio: user?.bio || '',
    codingLanguage: toCommaString(user?.codinglanguage),
    learningLanguage: toCommaString(user?.learninglanguage),
    location: user?.location || '',
    role: user?.role || '',
    techStack: toCommaString(user?.techStack),
    interests: toCommaString(user?.interests),
    lookingFor: user?.lookingFor || 'learning Buddy',
    availability: user?.availability || 'Occasional',
    timezone: user?.timezone || '',
    githubUsername: user?.githubUsername || '',
    linkedinUsername: user?.linkedinUsername || '',
    portfolioUrl: user?.portfolioUrl || '',
    experience: user?.experience || '',
  });
const [isSubmitting, setIsSubmitting] = useState(false);
const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [preview, setPreview] = useState(user?.profilePic || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('profilePic', selectedFile);
      const upRes = await axiosInstance.post('/user/upload-profile-picture', fd);
      const url = upRes.data?.data?.path || upRes.data?.data?.profilePic || upRes.data?.data?.url;
      if (url) {
        setProfilePic(url);
        setPreview(url);
        toast.success('Profile picture uploaded!');
      } else {
        throw new Error('Could not read upload URL');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        profilePic,
        codingLanguage: form.codingLanguage.split(',').map((s) => s.trim()).filter(Boolean),
        learningLanguage: form.learningLanguage.split(',').map((s) => s.trim()).filter(Boolean),
        techStack: form.techStack.split(',').map((s) => s.trim()).filter(Boolean),
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const res = await axiosInstance.post('/auth/onboarding', payload);
      if (res.data?.success) {
        toast.success('Profile updated! 🎉');
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const skip = () => navigate('/dashboard');

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-base-content">Edit your profile</h1>
              <p className="text-sm text-base-content/60 mt-1">
                Update your details to keep your profile accurate.
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={skip}>
              Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-20 h-20 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
                  {preview ? (
                    <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-base-300 text-3xl">
                      <i className="fa-solid fa-user" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <span className="loading loading-spinner loading-xs" /> Uploading...
                      </>
                    ) : (
                      'Upload Photo'
                    )}
                  </button>
                  {profilePic && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => {
                        setProfilePic('');
                        setPreview('');
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Full Name *</span></div>
                <input name="fullname" value={form.fullname} onChange={handleChange} placeholder="John Doe" className="input input-bordered" required />
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Role *</span></div>
                <input name="role" value={form.role} onChange={handleChange} placeholder="Frontend Developer" className="input input-bordered" required />
              </label>
            </div>

            <label className="form-control">
              <div className="label"><span className="label-text font-medium">Bio *</span></div>
              <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Tell developers about yourself..." className="textarea textarea-bordered h-20" required />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Coding Languages * (comma separated)</span></div>
                <input name="codingLanguage" value={form.codingLanguage} onChange={handleChange} placeholder="JavaScript, Python" className="input input-bordered" required />
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Learning Languages *</span></div>
                <input name="learningLanguage" value={form.learningLanguage} onChange={handleChange} placeholder="React, Go" className="input input-bordered" required />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Location *</span></div>
                <input name="location" value={form.location} onChange={handleChange} placeholder="Pakistan" className="input input-bordered" required />
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Looking For</span></div>
                <select name="lookingFor" value={form.lookingFor} onChange={handleChange} className="select select-bordered">
                  <option value="learning Buddy">Learning Buddy</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Project Collaborator">Project Collaborator</option>
                  <option value="Interview Partner">Interview Partner</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Tech Stack</span></div>
                <input name="techStack" value={form.techStack} onChange={handleChange} placeholder="React, Node, MongoDB" className="input input-bordered" />
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Interests</span></div>
                <input name="interests" value={form.interests} onChange={handleChange} placeholder="AI, Open Source" className="input input-bordered" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Availability</span></div>
                <select name="availability" value={form.availability} onChange={handleChange} className="select select-bordered">
                  <option value="Occasional">Occasional</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Full Time">Full Time</option>
                </select>
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Timezone</span></div>
                <input name="timezone" value={form.timezone} onChange={handleChange} placeholder="GMT+5" className="input input-bordered" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="form-control">
                <div className="label"><span className="label-text font-medium">GitHub</span></div>
                <input name="githubUsername" value={form.githubUsername} onChange={handleChange} placeholder="username" className="input input-bordered" />
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text font-medium">LinkedIn</span></div>
                <input name="linkedinUsername" value={form.linkedinUsername} onChange={handleChange} placeholder="username" className="input input-bordered" />
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text font-medium">Portfolio URL</span></div>
                <input name="portfolioUrl" value={form.portfolioUrl} onChange={handleChange} placeholder="https://..." className="input input-bordered" />
              </label>
            </div>

            <label className="form-control">
              <div className="label"><span className="label-text font-medium">Experience</span></div>
              <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 2 years" className="input input-bordered" />
            </label>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button type="button" className="btn btn-ghost" onClick={skip}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
