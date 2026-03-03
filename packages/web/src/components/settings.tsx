import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LLMSettings, RemoteProvider, ModelSelection, Locale } from "@storyteller/core";

import { saveLocale } from "../storage.ts";
import { useModelManager } from "../hooks/use-model-manager.ts";

type SettingsTab = "remote" | "local";

type Props = {
  settings: LLMSettings;
  onSave: (settings: LLMSettings) => void;
  localModelLoading: boolean;
  localModelProgress: number;
  localModelStatus: string;
};

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "da", label: "Dansk" },
];

// --- Provider Edit Card ---

type ProviderEditState = {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  manualModelInput: string;
};

const emptyProviderEdit = (): ProviderEditState => ({
  name: "",
  baseUrl: "https://openrouter.ai/api/v1",
  apiKey: "",
  models: [],
  manualModelInput: "",
});

const fromProvider = (p: RemoteProvider): ProviderEditState => ({
  name: p.name,
  baseUrl: p.baseUrl,
  apiKey: p.apiKey,
  models: [...p.models],
  manualModelInput: "",
});

// --- Component ---

const Settings = ({
  settings,
  onSave,
  localModelLoading,
  localModelProgress,
  localModelStatus,
}: Props): React.ReactNode => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const modelManager = useModelManager();

  const [tab, setTab] = useState<SettingsTab>("remote");
  const [providers, setProviders] = useState<RemoteProvider[]>(settings.remoteProviders);
  const [activeModel, setActiveModel] = useState<ModelSelection | null>(settings.activeModel);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<ProviderEditState>(emptyProviderEdit());
  const [isNew, setIsNew] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const hasWebGPU = "gpu" in navigator;

  useEffect(() => {
    setProviders(settings.remoteProviders);
    setActiveModel(settings.activeModel);
  }, [settings]);

  const save = (nextProviders: RemoteProvider[], nextActive: ModelSelection | null): void => {
    setProviders(nextProviders);
    setActiveModel(nextActive);
    onSave({ remoteProviders: nextProviders, activeModel: nextActive });
  };

  const handleLanguageChange = async (locale: Locale): Promise<void> => {
    await i18n.changeLanguage(locale);
    await saveLocale(locale);
  };

  // --- Provider CRUD ---

  const startAdd = (): void => {
    setEditingId("__new__");
    setEditState(emptyProviderEdit());
    setIsNew(true);
    setFetchError(null);
  };

  const startEdit = (p: RemoteProvider): void => {
    setEditingId(p.id);
    setEditState(fromProvider(p));
    setIsNew(false);
    setFetchError(null);
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setIsNew(false);
    setFetchError(null);
  };

  const saveProvider = (): void => {
    if (isNew) {
      const newProvider: RemoteProvider = {
        id: crypto.randomUUID(),
        name: editState.name || "Unnamed Provider",
        baseUrl: editState.baseUrl,
        apiKey: editState.apiKey,
        models: editState.models,
      };
      save([...providers, newProvider], activeModel);
    } else {
      const updated = providers.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: editState.name,
              baseUrl: editState.baseUrl,
              apiKey: editState.apiKey,
              models: editState.models,
            }
          : p,
      );
      // If active model references a model removed from this provider, clear it
      let nextActive = activeModel;
      if (
        nextActive?.kind === "remote" &&
        nextActive.providerId === editingId &&
        !editState.models.includes(nextActive.model)
      ) {
        nextActive = null;
      }
      save(updated, nextActive);
    }
    setEditingId(null);
    setIsNew(false);
    setFetchError(null);
  };

  const deleteProvider = (id: string): void => {
    const nextProviders = providers.filter((p) => p.id !== id);
    let nextActive = activeModel;
    if (nextActive?.kind === "remote" && nextActive.providerId === id) {
      nextActive = null;
    }
    save(nextProviders, nextActive);
    setConfirmDeleteId(null);
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const fetchModels = async (): Promise<void> => {
    setFetchError(null);
    try {
      const url = editState.baseUrl.replace(/\/+$/, "") + "/models";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (editState.apiKey) {
        headers["Authorization"] = `Bearer ${editState.apiKey}`;
      }
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as { data?: { id: string }[] };
      const ids = (json.data ?? []).map((m) => m.id);
      if (ids.length === 0) {
        throw new Error("No models returned");
      }
      setEditState((prev) => ({ ...prev, models: ids }));
    } catch {
      setFetchError(t("settings.fetchFailed"));
    }
  };

  const addManualModel = (): void => {
    const id = editState.manualModelInput.trim();
    if (!id || editState.models.includes(id)) {
      return;
    }
    setEditState((prev) => ({
      ...prev,
      models: [...prev.models, id],
      manualModelInput: "",
    }));
  };

  const removeModel = (modelId: string): void => {
    setEditState((prev) => ({
      ...prev,
      models: prev.models.filter((m) => m !== modelId),
    }));
  };

  // --- Active model ---

  const setActiveRemote = (providerId: string, model: string): void => {
    save(providers, { kind: "remote", providerId, model });
  };

  const setActiveLocal = (modelId: string): void => {
    save(providers, { kind: "local", modelId });
  };

  // --- Active model display ---

  const activeModelLabel = (() => {
    if (!activeModel) {
      return t("settings.noActiveModel");
    }
    if (activeModel.kind === "local") {
      return activeModel.modelId;
    }
    const provider = providers.find((p) => p.id === activeModel.providerId);
    return provider ? `${provider.name}: ${activeModel.model}` : activeModel.model;
  })();

  const isActiveRemoteModel = (providerId: string, model: string): boolean =>
    activeModel?.kind === "remote" && activeModel.providerId === providerId && activeModel.model === model;

  const isActiveLocalModel = (modelId: string): boolean =>
    activeModel?.kind === "local" && activeModel.modelId === modelId;

  return (
    <div className='screen settings'>
      <button className='btn btn-ghost back-btn' onClick={() => navigate("/")}>
        &larr; {t("common.back")}
      </button>
      <h2>{t("settings.heading")}</h2>

      <div className='settings-form'>
        {/* Language picker */}
        <div className='field'>
          <label>{t("settings.language")}</label>
          <div className='language-picker'>
            {LOCALES.map((loc) => (
              <button
                key={loc.value}
                className={`btn ${i18n.language === loc.value ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleLanguageChange(loc.value)}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active model banner */}
        <div className='active-model-banner'>
          <span className='active-model-label'>{t("settings.activeModel")}:</span>{" "}
          <span className={activeModel ? "active-model-value" : "active-model-none"}>{activeModelLabel}</span>
        </div>

        {/* Tabs */}
        <div className='settings-tabs'>
          <button className={`settings-tab ${tab === "remote" ? "active" : ""}`} onClick={() => setTab("remote")}>
            {t("settings.remoteProviders")}
          </button>
          <button className={`settings-tab ${tab === "local" ? "active" : ""}`} onClick={() => setTab("local")}>
            {t("settings.localModels")}
          </button>
        </div>

        {/* ═══ Remote Providers Tab ═══ */}
        {tab === "remote" && (
          <div className='providers-list'>
            {providers.length === 0 && editingId !== "__new__" && (
              <p className='info-text'>{t("settings.noProviders")}</p>
            )}

            {providers.map((p) => (
              <div key={p.id} className='provider-card'>
                {editingId === p.id ? (
                  /* ── Edit mode ── */
                  <div className='provider-card-edit'>
                    <div className='field'>
                      <label>{t("settings.providerName")}</label>
                      <input
                        type='text'
                        value={editState.name}
                        onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                        placeholder='OpenRouter'
                      />
                    </div>
                    <div className='field'>
                      <label>{t("settings.baseUrl")}</label>
                      <input
                        type='url'
                        value={editState.baseUrl}
                        onChange={(e) => setEditState((s) => ({ ...s, baseUrl: e.target.value }))}
                        placeholder='https://openrouter.ai/api/v1'
                      />
                    </div>
                    <div className='field'>
                      <label>{t("settings.apiKey")}</label>
                      <input
                        type='password'
                        value={editState.apiKey}
                        onChange={(e) => setEditState((s) => ({ ...s, apiKey: e.target.value }))}
                        placeholder='sk-or-v1-...'
                      />
                    </div>

                    {/* Models */}
                    <div className='field'>
                      <label>{t("settings.models")}</label>
                      <div className='model-fetch-row'>
                        <button className='btn btn-small btn-secondary' onClick={fetchModels}>
                          {t("settings.fetchModels")}
                        </button>
                        {fetchError && <span className='warning-text'>{fetchError}</span>}
                      </div>
                      {editState.models.length > 0 && (
                        <ul className='model-list'>
                          {editState.models.map((m) => (
                            <li key={m} className='model-list-item'>
                              <span className='model-list-id'>{m}</span>
                              <button className='btn btn-ghost btn-small' onClick={() => removeModel(m)}>
                                {t("settings.removeModel")}
                              </button>
                              {!isActiveRemoteModel(p.id, m) && (
                                <button className='btn btn-ghost btn-small' onClick={() => setActiveRemote(p.id, m)}>
                                  {t("settings.setActive")}
                                </button>
                              )}
                              {isActiveRemoteModel(p.id, m) && (
                                <span className='model-active-badge'>{t("models.active")}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className='manual-model-row'>
                        <input
                          type='text'
                          value={editState.manualModelInput}
                          onChange={(e) => setEditState((s) => ({ ...s, manualModelInput: e.target.value }))}
                          placeholder={t("settings.addModelManually")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addManualModel();
                            }
                          }}
                        />
                        <button className='btn btn-small btn-secondary' onClick={addManualModel}>
                          {t("settings.addModel")}
                        </button>
                      </div>
                    </div>

                    <div className='provider-card-actions'>
                      <button className='btn btn-primary btn-small' onClick={saveProvider}>
                        {t("common.save")}
                      </button>
                      <button className='btn btn-secondary btn-small' onClick={cancelEdit}>
                        {t("settings.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Display mode ── */
                  <div className='provider-card-display'>
                    <div className='provider-card-header'>
                      <span className='provider-card-name'>{p.name}</span>
                      <span className='provider-card-url'>{p.baseUrl}</span>
                    </div>
                    <div className='provider-card-meta'>
                      {p.models.length} {t("settings.models").toLowerCase()}
                    </div>
                    {/* Model radio buttons for quick activation */}
                    {p.models.length > 0 && (
                      <ul className='model-list compact'>
                        {p.models.map((m) => (
                          <li key={m} className='model-list-item'>
                            <span className='model-list-id'>{m}</span>
                            {isActiveRemoteModel(p.id, m) ? (
                              <span className='model-active-badge'>{t("models.active")}</span>
                            ) : (
                              <button className='btn btn-ghost btn-small' onClick={() => setActiveRemote(p.id, m)}>
                                {t("settings.setActive")}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className='provider-card-actions'>
                      <button className='btn btn-secondary btn-small' onClick={() => startEdit(p)}>
                        {t("settings.editProvider")}
                      </button>
                      {confirmDeleteId === p.id ? (
                        <>
                          <span className='warning-text'>{t("settings.deleteProviderConfirm")}</span>
                          <button
                            className='btn btn-small'
                            style={{ color: "var(--negative)" }}
                            onClick={() => deleteProvider(p.id)}
                          >
                            {t("common.delete")}
                          </button>
                          <button className='btn btn-ghost btn-small' onClick={() => setConfirmDeleteId(null)}>
                            {t("settings.cancel")}
                          </button>
                        </>
                      ) : (
                        <button className='btn btn-ghost btn-small' onClick={() => setConfirmDeleteId(p.id)}>
                          {t("settings.deleteProvider")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* New provider inline card */}
            {editingId === "__new__" && (
              <div className='provider-card'>
                <div className='provider-card-edit'>
                  <div className='field'>
                    <label>{t("settings.providerName")}</label>
                    <input
                      type='text'
                      value={editState.name}
                      onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                      placeholder='OpenRouter'
                    />
                  </div>
                  <div className='field'>
                    <label>{t("settings.baseUrl")}</label>
                    <input
                      type='url'
                      value={editState.baseUrl}
                      onChange={(e) => setEditState((s) => ({ ...s, baseUrl: e.target.value }))}
                      placeholder='https://openrouter.ai/api/v1'
                    />
                  </div>
                  <div className='field'>
                    <label>{t("settings.apiKey")}</label>
                    <input
                      type='password'
                      value={editState.apiKey}
                      onChange={(e) => setEditState((s) => ({ ...s, apiKey: e.target.value }))}
                      placeholder='sk-or-v1-...'
                    />
                  </div>

                  <div className='field'>
                    <label>{t("settings.models")}</label>
                    <div className='model-fetch-row'>
                      <button className='btn btn-small btn-secondary' onClick={fetchModels}>
                        {t("settings.fetchModels")}
                      </button>
                      {fetchError && <span className='warning-text'>{fetchError}</span>}
                    </div>
                    {editState.models.length > 0 && (
                      <ul className='model-list'>
                        {editState.models.map((m) => (
                          <li key={m} className='model-list-item'>
                            <span className='model-list-id'>{m}</span>
                            <button className='btn btn-ghost btn-small' onClick={() => removeModel(m)}>
                              {t("settings.removeModel")}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className='manual-model-row'>
                      <input
                        type='text'
                        value={editState.manualModelInput}
                        onChange={(e) => setEditState((s) => ({ ...s, manualModelInput: e.target.value }))}
                        placeholder={t("settings.addModelManually")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addManualModel();
                          }
                        }}
                      />
                      <button className='btn btn-small btn-secondary' onClick={addManualModel}>
                        {t("settings.addModel")}
                      </button>
                    </div>
                  </div>

                  <div className='provider-card-actions'>
                    <button className='btn btn-primary btn-small' onClick={saveProvider}>
                      {t("common.save")}
                    </button>
                    <button className='btn btn-secondary btn-small' onClick={cancelEdit}>
                      {t("settings.cancel")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {editingId === null && (
              <button className='btn btn-secondary' onClick={startAdd}>
                {t("settings.addProvider")}
              </button>
            )}
          </div>
        )}

        {/* ═══ Local Models Tab ═══ */}
        {tab === "local" && (
          <div className='local-models-tab'>
            {!hasWebGPU && <p className='warning-text'>{t("settings.webgpuWarning")}</p>}
            <p className='info-text'>{t("models.localInfo")}</p>

            <div className='model-grid'>
              {modelManager.models.map((m) => {
                const isDownloading = modelManager.downloadingModelId === m.id;
                const isActive = isActiveLocalModel(m.id);
                return (
                  <div key={m.id} className={`model-card ${isActive ? "active" : ""}`}>
                    <div className='model-card-header'>
                      <span className='model-card-name'>{m.label}</span>
                      <span className='model-card-size'>{m.size}</span>
                    </div>
                    <div className='model-card-status'>
                      {isActive && <span className='model-active-badge'>{t("models.active")}</span>}
                      {m.cached ? (
                        <span className='model-cached-badge'>{t("models.downloaded")}</span>
                      ) : (
                        <span className='model-not-cached-badge'>{t("models.notDownloaded")}</span>
                      )}
                    </div>

                    {isDownloading && (
                      <div className='model-progress'>
                        <div className='model-progress-bar'>
                          <div
                            className='model-progress-fill'
                            style={{ width: `${modelManager.downloadProgress * 100}%` }}
                          />
                        </div>
                        <p className='model-progress-status'>{modelManager.downloadStatus}</p>
                      </div>
                    )}

                    {/* Show loading indicator from use-llm when this local model is being initialized */}
                    {!isDownloading && isActive && localModelLoading && (
                      <div className='model-progress'>
                        <div className='model-progress-bar'>
                          <div className='model-progress-fill' style={{ width: `${localModelProgress * 100}%` }} />
                        </div>
                        <p className='model-progress-status'>{localModelStatus}</p>
                      </div>
                    )}

                    <div className='model-card-actions'>
                      {!m.cached && !isDownloading && (
                        <button
                          className='btn btn-secondary btn-small'
                          onClick={() => modelManager.downloadModel(m.id)}
                        >
                          {t("models.download")}
                        </button>
                      )}
                      {m.cached && !isActive && (
                        <button className='btn btn-primary btn-small' onClick={() => setActiveLocal(m.id)}>
                          {t("models.activate")}
                        </button>
                      )}
                      {m.cached && (
                        <button className='btn btn-ghost btn-small' onClick={() => modelManager.deleteModel(m.id)}>
                          {t("models.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Settings };
