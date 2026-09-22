import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

// Normaliza o identificador das listas para manter compatibilidade com as
// diferentes formas de resposta usadas pelo backend.
function getId(lista) {
  return Number(lista?.id ?? lista?.listId ?? lista?._id)
}

// Helper para requisições com o cliente centralizado (JWT, base URL e tratamento 401).
async function fetchApi(url, options = {}) {
  const method = options.method || 'GET'
  let data = options.body

  if (data && typeof data === 'string') {
    try { data = JSON.parse(data) } catch {}
  }

  const response = await api.request({
    url,
    method,
    data,
    headers: options.headers,
  })
  return response.data
}

export default function Listas() {
  const [listas, setListas] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [fetchingListas, setFetchingListas] = useState(true)

  // Modais e Estados de Ação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [listToEditCover, setListToEditCover] = useState(null)
  const [listToDelete, setListToDelete] = useState(null)

  // Estados dos Formulários
  const [createForm, setCreateForm] = useState({
    titulo: '',
    descricao: '',
    tipoCapa: 'url',
    capaUrl: '',
    capaFile: null,
    previewUrl: ''
  })

  const [editCoverForm, setEditCoverForm] = useState({
    tipoCapa: 'url',
    novaCapaUrl: '',
    novaCapaFile: null,
    previewUrl: ''
  })

  // Feedbacks de Envio
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [savingCover, setSavingCover] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [createError, setCreateError] = useState('')

  // Limpeza de memória dos objetos de Preview
  const handleFileChange = useCallback((file, setFormState) => {
    if (file) {
      const preview = URL.createObjectURL(file)
      setFormState((prev) => {
        if (prev.previewUrl && prev.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prev.previewUrl)
        }
        return { ...prev, capaFile: file, novaCapaFile: file, previewUrl: preview }
      })
    } else {
      setFormState((prev) => {
        if (prev.previewUrl && prev.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prev.previewUrl)
        }
        return { ...prev, capaFile: null, novaCapaFile: null, previewUrl: '' }
      })
    }
  }, [])

  // 1. Carregar Listas
  useEffect(() => {
    let isMounted = true
    async function loadListas() {
      try {
        const data = await fetchApi('/lists')
        if (isMounted) setListas(Array.isArray(data) ? data : data.listas || [])
      } catch (err) {
        console.error('Erro ao buscar listas:', err)
      } finally {
        if (isMounted) setFetchingListas(false)
      }
    }
    loadListas()
    return () => { isMounted = false }
  }, [])

  // 2. Busca e Filtro Local
  const filteredListas = useMemo(() => {
    if (!searchQuery.trim()) return listas
    const term = searchQuery.toLowerCase()
    return listas.filter(
      (item) =>
        item.titulo?.toLowerCase().includes(term) ||
        item.descricao?.toLowerCase().includes(term)
    )
  }, [listas, searchQuery])

  // Reset e Abertura do Modal de Criação
  const handleOpenCreateModal = () => {
    setCreateError('')
    setCreateForm({
      titulo: '',
      descricao: '',
      tipoCapa: 'url',
      capaUrl: '',
      capaFile: null,
      previewUrl: ''
    })
    setIsCreateModalOpen(true)
  }

  // Abertura do Modal de Capa
  const handleOpenCoverModal = (lista) => {
    const capa = lista?.capaUrl || ''
    setListToEditCover(lista)
    setEditCoverForm({
      tipoCapa: 'url',
      novaCapaUrl: capa,
      novaCapaFile: null,
      previewUrl: capa
    })
  }

  // 3. Criar Lista
  const handleCriarLista = async (e) => {
    e.preventDefault()
    if (!createForm.titulo.trim()) return

    setLoadingCreate(true)
    setCreateError('')

    try {
      let options = {}

      if (createForm.tipoCapa === 'file' && createForm.capaFile) {
        const formData = new FormData()
        formData.append('titulo', createForm.titulo.trim())
        formData.append('descricao', createForm.descricao.trim())
        formData.append('capa', createForm.capaFile)

        options = { method: 'POST', body: formData }
      } else {
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo: createForm.titulo.trim(),
            descricao: createForm.descricao.trim(),
            capaUrl: createForm.capaUrl.trim() || null
          })
        }
      }

      const data = await fetchApi('/lists', options)
      const novaLista = data.lista || data
      setListas((prev) => [novaLista, ...prev])
      setIsCreateModalOpen(false)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setLoadingCreate(false)
    }
  }

  // 4. Atualizar Capa (CORRIGIDO)
  const handleSalvarCapa = async (e) => {
    e.preventDefault()
    if (!listToEditCover) return

    const id = getId(listToEditCover)
    setSavingCover(true)

    try {
      let options = {}

      if (editCoverForm.tipoCapa === 'file' && editCoverForm.novaCapaFile) {
        const formData = new FormData()
        formData.append('capa', editCoverForm.novaCapaFile)
        options = { method: 'PATCH', body: formData }
      } else {
        options = {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ capaUrl: editCoverForm.novaCapaUrl.trim() || null })
        }
      }

      const data = await fetchApi(`/lists/${id}`, options)

      // Garante extração da URL retornada do backend
      const updatedCapaUrl = 
        data.capaUrl || 
        data.lista?.capaUrl || 
        data.cover || 
        (editCoverForm.tipoCapa === 'url' ? editCoverForm.novaCapaUrl.trim() : null)

      // Atualização de estado criando um novo objeto
      setListas((prevListas) =>
        prevListas.map((item) => {
          if (getId(item) === id) {
            return {
              ...item,
              capaUrl: updatedCapaUrl
            }
          }
          return item
        })
      )

      setListToEditCover(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingCover(false)
    }
  }

  // 5. Excluir Lista
  const confirmDelete = async () => {
    if (!listToDelete) return
    const id = getId(listToDelete)
    setDeletingId(id)

    try {
      await fetchApi(`/lists/${id}`, { method: 'DELETE' })
      setListas((prev) => prev.filter((item) => getId(item) !== id))
      setListToDelete(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-cinema-black px-6 py-8 text-cream">
      <div className="mx-auto max-w-6xl">
        
        {/* Cabeçalho */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-cinema-surface-2 pb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-marquee-gold tracking-wide">
              Minhas Listas
            </h1>
            <p className="text-sm text-dust mt-1">
              Crie, gerencie e organize suas coleções de filmes.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 rounded-full bg-marquee-gold px-5 py-2.5 text-sm font-semibold text-cinema-black hover:bg-yellow-400 transition-all shadow-lg cursor-pointer"
          >
            <span className="text-xl leading-none">+</span>
            <span>Criar Nova Lista</span>
          </button>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar listas por título ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md rounded-xl border border-cinema-surface-2 bg-cinema-surface px-4 py-2.5 text-sm text-cream placeholder-dust focus:border-marquee-gold focus:outline-none transition-colors"
          />
        </div>

        {/* Grid de Listas */}
        {fetchingListas ? (
          <div className="flex flex-col items-center justify-center py-24 text-dust gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-marquee-gold border-t-transparent" />
            <span className="text-sm font-medium">Carregando suas coleções...</span>
          </div>
        ) : filteredListas.length === 0 ? (
          <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-12 text-center text-dust">
            Nenhuma lista encontrada.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListas.map((lista) => {
              const listId = getId(lista)
              return (
                <Link
                  key={listId}
                  to={`/listas/${listId}`}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-cinema-surface-2 bg-cinema-surface hover:border-marquee-gold/50 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                >
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      type="button"
                      title="Alterar Capa"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleOpenCoverModal(lista)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-cinema-black/80 text-cream backdrop-blur-md hover:bg-marquee-gold hover:text-cinema-black transition-colors"
                    >
                      🖼️
                    </button>

                    <button
                      type="button"
                      title="Excluir lista"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setListToDelete(lista)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-cinema-black/80 text-red-400 backdrop-blur-md hover:bg-red-600 hover:text-white transition-colors"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="h-40 w-full bg-cinema-surface-2 relative overflow-hidden flex items-center justify-center">
                    {lista.capaUrl ? (
                      <img
                        src={lista.capaUrl}
                        alt={lista.titulo}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                      />
                    ) : (
                      <span className="text-4xl text-dust/30 group-hover:scale-110 transition-transform duration-300">
                        🎬
                      </span>
                    )}

                    <span className="absolute bottom-3 right-3 rounded-md bg-cinema-black/80 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-marquee-gold border border-cinema-surface-2">
                      {lista.filmesCount || 0} {lista.filmesCount === 1 ? 'filme' : 'filmes'}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-lg font-bold text-cream group-hover:text-marquee-gold transition-colors line-clamp-1">
                      {lista.titulo}
                    </h2>
                    <p className="mt-2 text-sm text-dust line-clamp-2 flex-1">
                      {lista.descricao || 'Sem descrição informada.'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Modal: Criar Nova Lista */}
        {isCreateModalOpen && (
          <ModalWrapper onClose={() => setIsCreateModalOpen(false)}>
            <div className="flex items-center justify-between border-b border-cinema-surface-2 pb-3 mb-4">
              <h3 className="text-lg font-bold text-marquee-gold">Nova Lista</h3>
              <CloseButton onClick={() => setIsCreateModalOpen(false)} />
            </div>

            {createError && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                {createError}
              </div>
            )}

            <form onSubmit={handleCriarLista} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cream uppercase tracking-wider mb-1.5">Título *</label>
                <input
                  type="text"
                  required
                  value={createForm.titulo}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Filmes Favoritos de Sci-Fi"
                  className="w-full rounded-lg border border-cinema-surface-2 bg-cinema-surface px-4 py-2.5 text-sm text-cream placeholder-dust focus:border-marquee-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cream uppercase tracking-wider mb-1.5">Descrição</label>
                <textarea
                  rows={3}
                  value={createForm.descricao}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição opcional para esta lista..."
                  className="w-full rounded-lg border border-cinema-surface-2 bg-cinema-surface px-4 py-2.5 text-sm text-cream placeholder-dust focus:border-marquee-gold focus:outline-none"
                />
              </div>

              <CapaSourceSelector
                tipo={createForm.tipoCapa}
                setTipo={(tipo) => setCreateForm((prev) => ({ ...prev, tipoCapa: tipo }))}
                url={createForm.capaUrl}
                setUrl={(capaUrl) => setCreateForm((prev) => ({ ...prev, capaUrl }))}
                onFileChange={(e) => handleFileChange(e.target.files?.[0], setCreateForm)}
              />

              {((createForm.tipoCapa === 'url' && createForm.capaUrl.trim()) ||
                (createForm.tipoCapa === 'file' && createForm.previewUrl)) && (
                <ImagePreview src={createForm.tipoCapa === 'url' ? createForm.capaUrl : createForm.previewUrl} />
              )}

              <FormActions
                loading={loadingCreate}
                onCancel={() => setIsCreateModalOpen(false)}
                submitLabel="Criar Lista"
                loadingLabel="Criando..."
              />
            </form>
          </ModalWrapper>
        )}

        {/* Modal: Editar Capa */}
        {listToEditCover && (
          <ModalWrapper onClose={() => setListToEditCover(null)}>
            <div className="flex items-center justify-between border-b border-cinema-surface-2 pb-3 mb-4">
              <h3 className="text-md font-bold text-marquee-gold">
                Alterar Capa: <span className="text-cream">{listToEditCover.titulo}</span>
              </h3>
              <CloseButton onClick={() => setListToEditCover(null)} />
            </div>

            <form onSubmit={handleSalvarCapa} className="space-y-4">
              <CapaSourceSelector
                tipo={editCoverForm.tipoCapa}
                setTipo={(tipo) => setEditCoverForm((prev) => ({ ...prev, tipoCapa: tipo }))}
                url={editCoverForm.novaCapaUrl}
                setUrl={(novaCapaUrl) =>
                  setEditCoverForm((prev) => ({ ...prev, novaCapaUrl, previewUrl: novaCapaUrl }))
                }
                onFileChange={(e) => handleFileChange(e.target.files?.[0], setEditCoverForm)}
              />

              {editCoverForm.previewUrl && <ImagePreview src={editCoverForm.previewUrl} />}

              <FormActions
                loading={savingCover}
                onCancel={() => setListToEditCover(null)}
                submitLabel="Salvar Imagem"
                loadingLabel="Salvando..."
              />
            </form>
          </ModalWrapper>
        )}

        {/* Modal: Deletar Lista */}
        {listToDelete && (
          <ModalWrapper onClose={() => setListToDelete(null)} maxWidth="max-w-sm">
            <h3 className="text-lg font-bold text-cream mb-2">Excluir Lista</h3>
            <p className="text-sm text-dust mb-6">
              Tem certeza que deseja excluir a lista <strong className="text-cream">"{listToDelete.titulo}"</strong>? Esta ação não poderá ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => setListToDelete(null)}
                className="px-4 py-2 text-sm text-dust hover:text-cream transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={confirmDelete}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deletingId !== null ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </ModalWrapper>
        )}

      </div>
    </div>
  )
}

// --- Componentes Auxiliares ---

function ModalWrapper({ children, onClose, maxWidth = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`w-full ${maxWidth} rounded-2xl border border-cinema-surface-2 bg-[#121212] p-6 shadow-2xl`}>
        {children}
      </div>
    </div>
  )
}

function CloseButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="text-dust hover:text-cream text-lg font-bold cursor-pointer">
      ✕
    </button>
  )
}

function CapaSourceSelector({ tipo, setTipo, url, setUrl, onFileChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-cream uppercase tracking-wider mb-1.5">
        Fonte da Imagem
      </label>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setTipo('url')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            tipo === 'url'
              ? 'border-marquee-gold bg-marquee-gold/10 text-marquee-gold'
              : 'border-cinema-surface-2 text-dust hover:text-cream'
          }`}
        >
          🔗 Link (URL)
        </button>
        <button
          type="button"
          onClick={() => setTipo('file')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            tipo === 'file'
              ? 'border-marquee-gold bg-marquee-gold/10 text-marquee-gold'
              : 'border-cinema-surface-2 text-dust hover:text-cream'
          }`}
        >
          📁 Upload de Arquivo
        </button>
      </div>

      {tipo === 'url' ? (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          className="w-full rounded-lg border border-cinema-surface-2 bg-cinema-surface px-4 py-2.5 text-sm text-cream placeholder-dust focus:border-marquee-gold focus:outline-none"
        />
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="w-full text-xs text-dust file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cinema-surface-2 file:text-cream hover:file:bg-marquee-gold hover:file:text-cinema-black cursor-pointer"
        />
      )}
    </div>
  )
}

function ImagePreview({ src }) {
  return (
    <div className="relative h-28 w-full rounded-lg overflow-hidden border border-cinema-surface-2 bg-cinema-surface">
      <img
        src={src}
        alt="Pré-visualização"
        className="h-full w-full object-cover"
        onError={(e) => { e.target.style.display = 'none' }}
      />
    </div>
  )
}

function FormActions({ loading, onCancel, submitLabel, loadingLabel }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        disabled={loading}
        onClick={onCancel}
        className="px-4 py-2 text-sm text-dust hover:text-cream cursor-pointer"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-marquee-gold px-5 py-2 text-sm font-semibold text-cinema-black hover:bg-yellow-400 disabled:opacity-50 cursor-pointer"
      >
        {loading ? loadingLabel : submitLabel}
      </button>
    </div>
  )
}