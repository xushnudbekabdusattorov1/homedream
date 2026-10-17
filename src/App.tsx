import React, { useState, useEffect } from 'react';
import { HouseSpec, ProjectItem, ValidationResult, GuidedOptions } from './types/house';
import { SAMPLE_HOUSES } from './lib/sampleHouses';
import { validateHouseSpec, autoRepairHouseSpec } from './lib/houseValidator';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Workspace } from './components/Workspace/Workspace';
import { InspirationGallery } from './components/Gallery/InspirationGallery';
import { MyProjects } from './components/Projects/MyProjects';
import { PricingModal } from './components/Pricing/PricingModal';
import { AuthModal } from './components/Auth/AuthModal';
import { ShareModal } from './components/Share/ShareModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'workspace' | 'gallery' | 'projects' | 'pricing'>('landing');

  // Currently active house specification
  const [currentSpec, setCurrentSpec] = useState<HouseSpec>(SAMPLE_HOUSES[0]);
  const [currentValidation, setCurrentValidation] = useState<ValidationResult>(validateHouseSpec(SAMPLE_HOUSES[0]));

  // Saved user projects
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const stored = localStorage.getItem('dreamhome_projects');
      if (stored) return JSON.parse(stored);
    } catch {}
    return SAMPLE_HOUSES.map((h, i) => ({
      id: h.id,
      title: h.title,
      description: h.designSummary,
      prompt: h.tags.join(', ') + ' style home',
      style: h.style,
      createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      spec: h,
    }));
  });

  // User auth state
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(() => {
    try {
      const stored = localStorage.getItem('dreamhome_user');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Sync projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dreamhome_projects', JSON.stringify(projects));
    } catch {}
  }, [projects]);

  // Check shared house URL parameter on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const houseId = params.get('house');
    if (houseId) {
      const match = SAMPLE_HOUSES.find((h) => h.id === houseId) || projects.find((p) => p.id === houseId)?.spec;
      if (match) {
        setCurrentSpec(match);
        setCurrentValidation(validateHouseSpec(match));
        setCurrentTab('workspace');
      }
    }
  }, []);

  // Update house spec with auto-repair and validation
  const handleUpdateSpec = (updated: HouseSpec, validation?: ValidationResult) => {
    const repaired = autoRepairHouseSpec(updated);
    setCurrentSpec(repaired);
    setCurrentValidation(validation || validateHouseSpec(repaired));
  };

  // Launch generation from landing page
  const handleStartGeneration = async (prompt: string, guided?: GuidedOptions) => {
    setCurrentTab('workspace');

    try {
      const res = await fetch('/api/generate-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, guidedOptions: guided }),
      });
      const data = await res.json();
      if (data.spec) {
        handleUpdateSpec(data.spec, data.validation);
      }
    } catch (err) {
      console.error('Failed to generate from landing:', err);
    }
  };

  // Save current project
  const handleSaveProject = (title?: string) => {
    const targetTitle = title || currentSpec.title;
    const existingIndex = projects.findIndex((p) => p.id === currentSpec.id);

    const projectItem: ProjectItem = {
      id: currentSpec.id,
      title: targetTitle,
      description: currentSpec.designSummary,
      prompt: `${currentSpec.style} residential architecture`,
      style: currentSpec.style,
      createdAt: existingIndex >= 0 ? projects[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spec: { ...currentSpec, title: targetTitle },
    };

    if (existingIndex >= 0) {
      const updated = [...projects];
      updated[existingIndex] = projectItem;
      setProjects(updated);
    } else {
      setProjects([projectItem, ...projects]);
    }
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  // Duplicate project
  const handleDuplicateProject = (project: ProjectItem) => {
    const newId = 'proj-' + Math.random().toString(36).substring(2, 9);
    const newSpec: HouseSpec = {
      ...project.spec,
      id: newId,
      title: `${project.title} (Copy)`,
    };
    const newProject: ProjectItem = {
      ...project,
      id: newId,
      title: `${project.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spec: newSpec,
    };
    setProjects([newProject, ...projects]);
  };

  // Rename project
  const handleRenameProject = (id: string, newTitle: string) => {
    setProjects(
      projects.map((p) =>
        p.id === id ? { ...p, title: newTitle, spec: { ...p.spec, title: newTitle } } : p
      )
    );
    if (currentSpec.id === id) {
      setCurrentSpec((prev) => ({ ...prev, title: newTitle }));
    }
  };

  // Open any house in 3D workspace
  const handleOpenHouse = (spec: HouseSpec) => {
    handleUpdateSpec(spec);
    setCurrentTab('workspace');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Universal Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onOpenShare={() => setIsShareOpen(true)}
      />

      {/* Pages Switcher */}
      {currentTab === 'landing' && (
        <LandingPage
          onStartGeneration={handleStartGeneration}
          onExploreHouse={handleOpenHouse}
          onNavigateToStudio={() => setCurrentTab('workspace')}
        />
      )}

      {currentTab === 'workspace' && (
        <Workspace
          currentSpec={currentSpec}
          validation={currentValidation}
          onUpdateSpec={handleUpdateSpec}
          onSaveProject={handleSaveProject}
          onOpenShareModal={() => setIsShareOpen(true)}
        />
      )}

      {currentTab === 'gallery' && (
        <InspirationGallery onSelectHouse={handleOpenHouse} />
      )}

      {currentTab === 'projects' && (
        <MyProjects
          projects={projects}
          onOpenProject={handleOpenHouse}
          onCreateNew={() => setCurrentTab('workspace')}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onRenameProject={handleRenameProject}
          onShareProject={(proj) => {
            setCurrentSpec(proj.spec);
            setIsShareOpen(true);
          }}
        />
      )}

      {currentTab === 'pricing' && (
        <PricingModal isFullPage />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('dreamhome_user', JSON.stringify(user));
        }}
        onLogout={() => {
          setCurrentUser(null);
          localStorage.removeItem('dreamhome_user');
        }}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        spec={currentSpec}
      />

      {isPricingModalOpen && (
        <PricingModal onClose={() => setIsPricingModalOpen(false)} />
      )}
    </div>
  );
}
